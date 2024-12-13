import { createReadStream } from "fs";
import { render } from "mustache";
import { createInterface as readlineCrate } from "readline";
import { plural, singular } from "pluralize";
import {
  getLineColumns,
  getRelationInformation,
  getTableName,
  isComment,
  isEnum,
  isNull,
  isRelation,
  isTable,
  snakeCaseToCamelCase,
  snakeCaseToPascalCase
} from "./helpers";
import { Interface, Property } from "./types";

const DBML_TO_TS_MAP: Record<string, string[]> = {
  string: ["varchar", "text", "uuid"],
  number: ["int"],
  Date: ["timestamp", "date"]
};

const TS_TEMPLATE = `{{#interfaces}}
// {{name}}
{{#isInterface}}
interface {{name}} {
{{#properties}}
  {{name}}{{#null}}?{{/null}}: {{type}};
{{/properties}}
}
{{/isInterface}}
{{#isEnum}} 
enum {{name}} {
{{#properties}}
  {{name}} = {{index}},
{{/properties}}
}
{{/isEnum}}
{{resetIndex}}
{{/interfaces}}
`;

export async function generate(schemaFilePath: string): Promise<string> {
  const interfaceMap: Map<string, Set<Property>> = new Map();
  const interfaces: Interface[] = [];

  function handleEnum(line: string): void {
    const interfaceObject: Interface = {
      name: snakeCaseToPascalCase(line.split(" ")[0]!),
      isEnum: true,
      properties: []
    };

    const match = line.match(/\(([^)]+)\)/);
    if (match) {
      // Extract words inside single quotes
      const words = [...match[1]!.matchAll(/"([^"]+)"/g)].map(match => match[1]!);

      words.forEach((word: string) => {
        interfaceObject.properties.push({ name: snakeCaseToPascalCase(word) });
      });
    }

    interfaces.push(interfaceObject);
  }

  const stream = createReadStream(
    schemaFilePath,
    { encoding: "utf-8" }
  );

  const readline = readlineCrate({
    input: stream,
    crlfDelay: Infinity
  });

  let currentTable: string;

  for await (let line of readline) {
    line = line.trim();

    if (!line || isComment(line) || line === "}" || line.length === 0) continue;

    if (isTable(line)) {
      currentTable = getTableName(line);
      interfaceMap.set(currentTable, new Set<Property>());
      continue;
    }

    if (isEnum(line)) {
      handleEnum(line);
      continue;
    }

    const {
      propertyName,
      propertyType,
      propertyMetadata,
    } = getLineColumns(line.trim());

    const isArray = propertyMetadata?.includes("<>") || propertyMetadata?.includes("<");
    const property: Property = {
      name: snakeCaseToCamelCase(isArray ? plural(propertyName) : singular(propertyName)),
      type: propertyType,
      null: isNull(line)
    };

    if (propertyMetadata && isRelation(propertyMetadata)) {
      const relationInformation = getRelationInformation(propertyMetadata)
      const relationTableName = snakeCaseToPascalCase(singular(relationInformation.name));

      property.type = `${relationTableName}${isArray ? "[]" : ""}`;
    }

    // verify type mapping
    for (const [key, value] of Object.entries(DBML_TO_TS_MAP)) {
      if (value.find(val => property.type!.includes(val))) {
        property.type = key;
      }
    }

    interfaceMap.set(
      currentTable!,
      interfaceMap.get(currentTable!)!.add(property)
    );
  }

  // build data object for mustache
  for (const [name, properties] of interfaceMap.entries()) {
    const interfaceObject: Interface = {
      name: singular(name),
      properties: [...properties],
      isInterface: true
    };

    interfaces.push(interfaceObject);
  }

  let mustacheCurrentIndex: number = -1;

  const mustacheRenderData = {
    interfaces,
    index: () => ++mustacheCurrentIndex,
    resetIndex: () => {
      mustacheCurrentIndex = -1;
      return;
    },
  };

  // render the file with mustache and add a EOF line break
  return `${render(TS_TEMPLATE, mustacheRenderData).trim()}
`;
}
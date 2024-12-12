import { createReadStream } from "fs";
import { render } from "mustache";
import { createInterface as readlineCrate } from "readline";
import { getLineColumns, getRelationInformation, getTableName, isComment, isEnum, isNull, isRelation, isTable, sanitizePropertyName, singularize, snakeCaseToPascalCase } from "./helpers";
import { Interface, Property } from "./types";

const DBML_TO_TS_MAP: Record<string, string> = {
  "varchar": "string",
  "text": "string",
  "uuid": "string",
  "int": "number",
  "datetime": "Date",
  "date": "Date"
};
const ARRAY_RELATIONS = ["<", "<>"];

const TS_TEMPLATE = `{{#interfaces}}
// {{name}}
{{#isInterface}}
interface {{name}} {
{{#properties}}
{{#null}}
  {{name}}?: {{type}};
{{/null}}
{{^null}}
  {{name}}: {{type}};
{{/null}}
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

    const property: Property = {
      name: sanitizePropertyName(propertyName),
      type: propertyType,
      null: isNull(line)
    };

    if (propertyMetadata && isRelation(propertyMetadata)) {
      const relationInformation = getRelationInformation(propertyMetadata)
      const relationTableName = snakeCaseToPascalCase(singularize(relationInformation.name));

      property.type = `${relationTableName}${ARRAY_RELATIONS.includes(relationInformation.symbol) ? "[]" : ""}`;
    }

    const dbmlToTsMapKey = Object.keys(DBML_TO_TS_MAP).find(key => property.type!.includes(key));

    if (dbmlToTsMapKey)
      property.type = DBML_TO_TS_MAP[dbmlToTsMapKey];

    interfaceMap.set(
      currentTable!,
      interfaceMap.get(currentTable!)!.add(property)
    );
  }

  for (const [key, value] of interfaceMap.entries()) {
    const interfaceObject: Interface = {
      name: singularize(key),
      properties: [...value],
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
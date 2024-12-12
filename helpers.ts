import { LineColumns, RelationInformation } from "./types";


export function getRelationInformation(line: string): RelationInformation {
  // @ts-ignore
  const [_, symbol, name] = line.match(/(- *|< *|> *|<> *)(\w+)\./);

  return { symbol: symbol.trim(), name };
}

export function getTableName(line: string): string {
  const trimmed = line.replace(/^Table\s+|\s+\{$/g, "");
  return snakeCaseToPascalCase(trimmed);
}

// helpers
export function isEnum(line: string): boolean {
  return line.includes("enum(");
}

export function isNull(line: string): boolean {
  return line.includes("null") && !line.includes("not");
}

export function isTable(line: string): boolean {
  return line.toLowerCase().startsWith("table");
}

export function isComment(line: string): boolean {
  return line.startsWith("/");
}

export function isRelation(line: string): boolean {
  return line.includes("ref:");
}

export function sanitizePropertyName(propertyName: string): string {
  if (propertyName.endsWith("_id"))
    propertyName = propertyName.replace("_id", "");

  return snakeCaseToCamelCase(singularize(propertyName));
}

/**
 * This function returns three columns of each
 * DBML line
 * 
 * Example:
 * id int [pk, increment]
 * 
 * property name = id
 * property type = int
 * property metadata = [pk, increment] // the transpiler only cares about ref metadata for nested interfaces
 */
export function getLineColumns(line: string): LineColumns {
  const [_, propertyName, propertyType, propertyMetadata] = line
    .match(/^(\w+)\s+([\w()]+)(?:\s+(\[.*\]))?$/);

  return { propertyName, propertyType, propertyMetadata };
}

export function snakeCaseToCamelCase(string: string): string {
  const camelCase = string
    .replace(/_([a-z])/g, (_, char) => char.toUpperCase());

  return camelCase;
}

export function snakeCaseToPascalCase(string: string): string {
  const pascalCase = snakeCaseToCamelCase(string)
    .replace(/^[a-z]/, char => char.toUpperCase());

  return pascalCase;
}

export function singularize(word: string): string {
  if (word.endsWith("ies")) {
    return word.slice(0, -3) + "y";
  } else if (word.endsWith("es") && !word.endsWith("ces")) {
    return word.slice(0, -2);
  } else if (word.endsWith("s") && word.length > 1) {
    return word.slice(0, -1);
  }

  return word;
}
//  end helpers
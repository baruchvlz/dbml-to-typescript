export interface RelationInformation {
  symbol: string;
  name: string;
}

export interface LineColumns {
  propertyName: string;
  propertyType: string;
  propertyMetadata?: string
}

export interface Interface {
  name: string;
  properties: Property[];
  isInterface?: boolean;
  isEnum?: boolean;
}

export interface Property {
  name: string;
  type?: string;
  null?: boolean
}
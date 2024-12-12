const typescript = `
// TestTableThreeType
enum TestTableThreeType {
  Foo = 0,
  Bar = 1,
}

// TestTableOne
interface TestTableOne {
  id: number;
  testStringProperty: string;
  testBooleanProperty: boolean;
  testNullProperty?: string;
  testRelationSingle: TestTableTwo;
  testRelationArray: TestTableThree[];
  testRelationMany: TestTableFour[];
  created: Date;
}

// TestTableTwo
interface TestTableTwo {
  id: number;
  foo: string;
  bar?: number;
  testSingularizationBusiness: TestTableThree;
  testSingularizationCompany: TestTableThree;
  testSingularizationOffice: TestTableFour;
  testSingularizationCar: TestTableOne;
  created: Date;
}

// TestTableThree
interface TestTableThree {
  id: number;
  foo: boolean;
  bar: Date;
  created: Date;
}

// TestTableFour
interface TestTableFour {
  id: number;
  foo: number;
  bar?: boolean;
  testTableOne: TestTableOne[];
  created: Date;
}

`;

export default typescript.trim();

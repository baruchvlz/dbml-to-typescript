import { generate } from "../generate";
import expectedTypes from "./test_data/ts_types";
import { join } from "path";

test("should generate TypeScipt file based on DBML schema", async () => {
  expect(await generate(join(__dirname, 'test_data', 'dbml_schema.dbml'))).toMatch(expectedTypes);
});

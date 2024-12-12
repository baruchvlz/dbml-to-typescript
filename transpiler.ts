import { join } from "path";
import { readFileSync, writeFileSync } from "fs";
import { generate } from "./generate";

// execute
(async function () {
  const [_, __, filePath] = process.argv;

  if (!filePath)
    throw new Error("File path must be provided.");

  const fullFilePath = join(__dirname, filePath);

  if (!readFileSync(fullFilePath))
    throw new Error(`No file found in ${fullFilePath}`);

  const renderedTemplate = await generate(fullFilePath);

  writeFileSync(
    join(__dirname, "generated", "types.ts"),
    renderedTemplate,
    { encoding: "utf-8" }
  );

  console.log("DBML to TS generation completed.");
})();
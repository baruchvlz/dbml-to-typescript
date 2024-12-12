# DBML to TypeScript

**STILL A WIP**

Simple DBML to TypeScript transpiler.

To use it, you have to clone the repo and run the script

```
npm run generate:dbml_ts ./path/to/dbml/schema.dbml
```

## Todo

- Ignore scopes like indexes
- Understand relation references outside of table scope
- Use library as binary i.e. `npx dbml-to-ts ./path/to/file.dbml`
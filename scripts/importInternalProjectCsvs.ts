import { importInternalProjectCsvPackages } from "../server/internalProjectCsvImport";

const result = await importInternalProjectCsvPackages(1);
console.log(JSON.stringify(result, null, 2));
process.exit(0);

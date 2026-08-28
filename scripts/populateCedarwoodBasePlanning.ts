import { applyCedarwoodBasePlanningCase } from "../server/cedarwoodBasePlanningPopulation";

const result = await applyCedarwoodBasePlanningCase(1, 30001);
console.log(JSON.stringify(result));
process.exit(0);

import { cedarwoodHistoricalPlanningWbs, cedarwoodHistoricalPlanningWbsTotal } from "../shared/cedarwoodHistoricalPlanning.ts";

const categories = cedarwoodHistoricalPlanningWbs.reduce((result, line) => {
  result[line.costCategory] = (result[line.costCategory] ?? 0) + line.allocatedAmount;
  return result;
}, {});
console.log(JSON.stringify({ count: cedarwoodHistoricalPlanningWbs.length, total: cedarwoodHistoricalPlanningWbsTotal, categories }, null, 2));

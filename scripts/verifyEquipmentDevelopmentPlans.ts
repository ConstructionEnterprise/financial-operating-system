import assert from "node:assert/strict";
import { equipmentPlanSeeds } from "../shared/equipmentPlanSeed.ts";
import { equipmentLineBudget, equipmentMonthlyPlan, equipmentPlanItemSchema, equipmentPlanSchema, equipmentPlanTotals } from "../shared/equipmentPlan.ts";

for (const seed of equipmentPlanSeeds) {
  const plan = equipmentPlanSchema.parse(seed.plan);
  const totals = equipmentPlanTotals(plan.items);
  const monthly = equipmentMonthlyPlan(plan.items);
  assert.equal(monthly.length, 36);
  assert.equal(monthly.reduce((n,m) => n + m.acquisition, 0), totals.finance);
  assert.equal(monthly.reduce((n,m) => n + m.rental, 0), totals.rent);
  for (const i of plan.items.filter(i => i.strategy === "contractor")) assert.equal(equipmentLineBudget(i), null);
  assert.equal(new Set(plan.items.map(i => i.key)).size, plan.items.length);
}
const rental = equipmentPlanSeeds[1].plan.items.find(i => i.key === "sp-tele")!;
assert.equal(equipmentLineBudget(rental), 2 * 3075 * 23);
assert.equal(equipmentLineBudget({ ...rental, startMonth: 36, endMonth: 36 }), 6150);
assert.equal(equipmentPlanItemSchema.safeParse({ ...rental, endMonth: 2 }).success, false);
assert.equal(equipmentPlanItemSchema.safeParse({ ...rental, quantity: 0 }).success, false);
assert.equal(equipmentPlanItemSchema.safeParse({ ...rental, quantity: 1.5 }).success, false);
assert.equal(equipmentPlanItemSchema.safeParse({ ...rental, unitMonthlyRent: -1 }).success, false);
assert.equal(equipmentPlanItemSchema.safeParse({ ...rental, unitMonthlyRent: null }).success, false);
assert.equal(equipmentPlanItemSchema.safeParse({ ...rental, strategy: "finance", unitPurchase: null }).success, false);
assert.equal(equipmentPlanItemSchema.safeParse({ ...rental, startMonth: 0 }).success, false);
assert.equal(equipmentPlanItemSchema.safeParse({ ...rental, endMonth: 37 }).success, false);
const plan = equipmentPlanSeeds[0].plan;
assert.equal(equipmentPlanSchema.safeParse({ ...plan, items: [...plan.items, plan.items[0]] }).success, false);
assert.deepEqual(equipmentPlanTotals(equipmentPlanSeeds[0].plan.items), { finance: 2135000, rent: 294000, contractorPackages: 6 });
assert.deepEqual(equipmentPlanTotals(equipmentPlanSeeds[1].plan.items), { finance: 115000, rent: 427450, contractorPackages: 7 });
console.log("Equipment planning checks passed: both scopes, 36-month reconciliation, inclusive rental periods, strategy guards, bounds, unpriced contractor treatment and unique keys.");

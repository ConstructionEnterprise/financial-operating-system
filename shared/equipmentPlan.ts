import { z } from "zod";

export const equipmentStrategies = ["finance", "rent", "contractor"] as const;
export const strategyLabels = { finance: "Finance candidate", rent: "Rent", contractor: "Contractor supplied" };
const money = z.number().finite().min(0).max(100_000_000);
export const equipmentPlanItemSchema = z.object({
  key: z.string().min(1).max(100), name: z.string().min(1).max(200), category: z.string().min(1).max(100),
  strategy: z.enum(equipmentStrategies), quantity: z.number().int().min(1).max(1000),
  startMonth: z.number().int().min(1).max(36), endMonth: z.number().int().min(1).max(36),
  unitPurchase: money.nullable(), unitMonthlyRent: money.nullable(),
  basis: z.string().min(1).max(2000), sourceUrl: z.string().url().nullable(),
  reason: z.string().min(1).max(2000), specification: z.string().min(1).max(2000),
}).refine(v => v.endMonth >= v.startMonth, "End month must follow start month")
  .refine(v => v.strategy !== "finance" || v.unitPurchase !== null, "Enter a purchase allowance before selecting finance")
  .refine(v => v.strategy !== "rent" || v.unitMonthlyRent !== null, "Enter a monthly rental allowance before selecting rent");
export type EquipmentPlanItem = z.infer<typeof equipmentPlanItemSchema>;
export const equipmentPlanSchema = z.object({
  version: z.literal(1), scope: z.string(), assumptions: z.array(z.string()),
  items: z.array(equipmentPlanItemSchema).min(1).max(200),
}).refine(v => new Set(v.items.map(i => i.key)).size === v.items.length, "Duplicate equipment keys");
export type EquipmentPlan = z.infer<typeof equipmentPlanSchema>;

// Rental months are planning calendar-month allowances, not a promise about a supplier's billing period.
export function equipmentLineBudget(item: EquipmentPlanItem) {
  if (item.strategy === "contractor") return null;
  return item.strategy === "finance"
    ? item.quantity * (item.unitPurchase ?? 0)
    : item.quantity * (item.unitMonthlyRent ?? 0) * (item.endMonth - item.startMonth + 1);
}
export function equipmentPlanTotals(items: EquipmentPlanItem[]) {
  return items.reduce((sum, item) => {
    const value = equipmentLineBudget(item);
    if (item.strategy === "finance") sum.finance += value ?? 0;
    if (item.strategy === "rent") sum.rent += value ?? 0;
    if (item.strategy === "contractor") sum.contractorPackages++;
    return sum;
  }, { finance: 0, rent: 0, contractorPackages: 0 });
}
export function equipmentMonthlyPlan(items: EquipmentPlanItem[]) {
  return Array.from({ length: 36 }, (_, index) => {
    const month = index + 1;
    return { month, acquisition: items.reduce((sum, i) => sum + (i.strategy === "finance" && i.startMonth === month ? equipmentLineBudget(i)! : 0), 0),
      rental: items.reduce((sum, i) => sum + (i.strategy === "rent" && month >= i.startMonth && month <= i.endMonth ? i.quantity * (i.unitMonthlyRent ?? 0) : 0), 0) };
  });
}

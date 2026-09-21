import { describe, expect, it } from "vitest";
import { assertCedarwoodHistoricalPlanningWbs, cedarwoodHistoricalControlTotal, cedarwoodHistoricalControls, cedarwoodHistoricalPlanningWbs, cedarwoodHistoricalPlanningWbsTotal } from "../shared/cedarwoodHistoricalPlanning";

describe("Cedarwood reverse-engineered historical planning WBS", () => {
  it("contains exactly 100 scenario-isolated planning lines that reconcile to the $40M control total", () => {
    expect(assertCedarwoodHistoricalPlanningWbs()).toBe(true);
    expect(cedarwoodHistoricalPlanningWbs).toHaveLength(100);
    expect(cedarwoodHistoricalPlanningWbsTotal).toBe(cedarwoodHistoricalControlTotal);
  });

  it("does not mislabel any allocation as an actual invoice or current capital requirement", () => {
    expect(cedarwoodHistoricalPlanningWbs.every((line) => line.notes.includes("Reverse-Engineered Historical Planning Allocation"))).toBe(true);
    expect(cedarwoodHistoricalPlanningWbs.every((line) => line.quantityUnit === "planning_allowance")).toBe(true);
  });

  it("reconciles each authorized top-level allocation and preserves derived controls", () => {
    const categoryTotals = cedarwoodHistoricalPlanningWbs.reduce<Record<string, number>>((totals, line) => ({ ...totals, [line.costCategory]: (totals[line.costCategory] ?? 0) + line.allocatedAmount }), {});
    expect(categoryTotals).toMatchObject({ land_acquisition: 4_000_000, site_development: 4_000_000, building_modular: 25_600_000, factory_logistics_installation: 2_000_000, professional_soft_costs: 2_400_000, financing_carry: 1_200_000, contingency: 800_000 });
    expect(cedarwoodHistoricalControls.totalDevelopmentCost / cedarwoodHistoricalControls.constructionBasisCentral).toBe(cedarwoodHistoricalControls.grossSfCentral);
    expect(cedarwoodHistoricalControls.units / cedarwoodHistoricalControls.buildings).toBe(cedarwoodHistoricalControls.unitsPerBuilding);
  });
});

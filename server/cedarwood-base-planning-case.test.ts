import { describe, expect, it } from "vitest";
import { assertCedarwoodBasePlanningCase, cedarwoodBasePlanningOperatingExpenses, cedarwoodBasePlanningProgram, cedarwoodBasePlanningSchedule, cedarwoodBasePlanningUnitMix, cedarwoodPlanningScenarioDefinitions } from "../shared/cedarwoodBasePlanningCase";

describe("Cedarwood user-supplied Base Planning Case", () => {
  it("reconciles the detailed unit mix, operating expenses, and 36-month S-curve", () => {
    expect(assertCedarwoodBasePlanningCase()).toBe(true);
    expect(cedarwoodBasePlanningUnitMix).toHaveLength(4);
    expect(cedarwoodBasePlanningOperatingExpenses).toHaveLength(10);
    expect(cedarwoodBasePlanningSchedule).toHaveLength(36);
    expect(cedarwoodBasePlanningSchedule.reduce((sum, row) => sum + row.constructionSpendBps, 0)).toBe(10_000);
    expect(cedarwoodBasePlanningSchedule.at(-1)?.occupancyBps).toBe(cedarwoodBasePlanningProgram.stabilizedOccupancyBps);
  });

  it("defines populated downside, base, upside, and historical planning cases rather than blank scenarios", () => {
    expect(cedarwoodPlanningScenarioDefinitions.map((scenario) => scenario.scenarioName)).toEqual(["Downside Case", "Base Case", "Upside Case", "Historical Planning — Cedarwood Baseline"]);
    expect(cedarwoodPlanningScenarioDefinitions.every((scenario) => scenario.developmentCostBps > 0 && scenario.rentBps > 0 && scenario.annualInterestRateBps > 0)).toBe(true);
  });
});

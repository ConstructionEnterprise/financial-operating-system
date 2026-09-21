import { describe, expect, it } from "vitest";
import { cedarwoodHistoricalPlanningInitialSchedule, assertCedarwoodHistoricalPlanningInitialSchedule, cedarwoodHistoricalControlTotal } from "../shared/cedarwoodHistoricalPlanning";
import { summarizeCedarwoodSchedule } from "../shared/cedarwoodScheduleFinancing";

describe("Cedarwood historical planning initial schedule", () => {
  it("creates an explicit 36-month estimated underwriting schedule that deploys the full $40M control case", () => {
    expect(assertCedarwoodHistoricalPlanningInitialSchedule()).toBe(true);
    expect(cedarwoodHistoricalPlanningInitialSchedule).toHaveLength(36);
    expect(cedarwoodHistoricalPlanningInitialSchedule.reduce((sum, row) => sum + row.constructionSpendBps, 0)).toBe(10_000);
    expect(cedarwoodHistoricalPlanningInitialSchedule.reduce((sum, row) => sum + cedarwoodHistoricalControlTotal * row.constructionSpendBps / 10_000, 0)).toBe(cedarwoodHistoricalControlTotal);
  });

  it("remains a complete, non-decreasing scenario-isolated lease-up schedule without claiming actual performance", () => {
    const summary = summarizeCedarwoodSchedule(cedarwoodHistoricalPlanningInitialSchedule, 36);
    expect(summary.complete).toBe(true);
    expect(summary.occupancyIsNonDecreasing).toBe(true);
    expect(cedarwoodHistoricalPlanningInitialSchedule.every((row) => row.dataState === "estimated" && row.notes.includes("does not represent actual"))).toBe(true);
  });
});

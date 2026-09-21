import { describe, expect, it } from "vitest";
import { historicalPlanningDisclosure, historicalPlanningMarker, isHistoricalPlanningScenario } from "./historicalPlanning";

describe("historical planning scenario classification", () => {
  it("identifies only explicitly marked historical planning scenarios", () => {
    expect(isHistoricalPlanningScenario(`${historicalPlanningMarker} | effective date unknown`)).toBe(true);
    expect(isHistoricalPlanningScenario("Current projected base case")).toBe(false);
    expect(isHistoricalPlanningScenario(null)).toBe(false);
  });

  it("requires the visible isolation disclosure for a historical planning scenario", () => {
    expect(historicalPlanningDisclosure(`${historicalPlanningMarker} | source: user briefing`)).toContain("effective date unknown");
    expect(historicalPlanningDisclosure(`${historicalPlanningMarker} | source: user briefing`)).toContain("excluded from actual ROI, IRR, payback");
    expect(historicalPlanningDisclosure("Current projected base case")).toBeNull();
  });
});

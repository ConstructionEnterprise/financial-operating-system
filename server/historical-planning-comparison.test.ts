import { describe, expect, it } from "vitest";
import { buildHistoricalPlanningComparison, historicalPlanningMarker } from "../shared/historicalPlanning";

describe("historical planning budget comparison", () => {
  it("keeps scenarios project-specific, estimated, and unsummed", () => {
    const rows = buildHistoricalPlanningComparison(
      [{ id: 1, projectName: "Cedarwood Flats" }, { id: 2, projectName: "Skyline Towers" }],
      [{ id: 10, internalProjectId: 1 }],
      [{ id: 100, modelId: 10, scenarioName: "Historical Planning — Cedarwood Baseline", scenarioStatus: "draft", notes: `${historicalPlanningMarker} | effective date unknown` }],
      [{ scenarioId: 100, metric: "total_cost", value: 40000000, dataState: "estimated", sourceReference: "user briefing", effectiveAt: null, ownerName: "owner" }],
    );
    expect(rows[0]).toMatchObject({ projectName: "Cedarwood Flats", hasRecoverableHistoricalPlanning: true });
    expect(rows[0]?.scenarios[0]?.primaryMetric).toMatchObject({ metric: "total_cost", value: 40000000 });
    expect(rows[1]).toMatchObject({ projectName: "Skyline Towers", hasRecoverableHistoricalPlanning: false, scenarios: [] });
  });
});

import { describe, expect, it } from "vitest";
import { assertCedarwoodVisualizationControls, cedarwoodCostBasisSensitivityChartData, cedarwoodHistoricalFinancialControlChartData } from "./cedarwoodVisualizations";

describe("Cedarwood historical planning visualization data", () => {
  it("uses the authorized historical development cost and NOI without manufacturing a monthly forecast", () => {
    expect(cedarwoodHistoricalFinancialControlChartData()).toEqual([
      { metric: "Development cost", amount: 40_000_000 },
      { metric: "Annual NOI", amount: 4_750_000 },
    ]);
  });

  it("retains the supplied $155/$160/$165 per-SF sensitivity and central 250,000-SF calculation", () => {
    const values = cedarwoodCostBasisSensitivityChartData();
    expect(values.map((value) => value.dollarsPerSf)).toEqual([155, 160, 165]);
    expect(values[1]?.impliedSf).toBe(250_000);
    expect(assertCedarwoodVisualizationControls()).toBe(true);
  });
});

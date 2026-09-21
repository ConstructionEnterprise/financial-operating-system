import { describe, expect, it } from "vitest";
import { calculateRoiOverview } from "../shared/roiReturns";

const emptyDetails = { equity: [], jv: [], equipment: [], grants: [] };

describe("ROI returns engine", () => {
  it("reports return metrics as unavailable instead of inferring an ROI from incomplete inputs", () => {
    const result = calculateRoiOverview({ project: { capitalRequirement: 100 }, sources: [], cashFlows: [], scenarios: [], contributions: [], returnDetails: emptyDetails });
    expect(result.operating.roi).toBeNull();
    expect(result.operating.roiState).toBe("missing");
    expect(result.cashFlow.unavailableReason).toContain("cash-flow schedule incomplete");
  });

  it("calculates transparent projected project ROI and capital efficiency only from recorded values", () => {
    const result = calculateRoiOverview({ project: { capitalRequirement: 100, projectedRevenue: 180, projectedCost: 120 }, sources: [{ id: 1, capitalPath: "equity", capitalCommitted: 60, capitalDeployed: 20 }], cashFlows: [], scenarios: [], contributions: [], returnDetails: emptyDetails });
    expect(result.operating.projectProfit).toBe(60);
    expect(result.operating.roi).toBe(0.6);
    expect(result.operating.state).toBe("projected");
    expect(result.capital.remainingGap).toBe(40);
  });

  it("derives IRR, equity multiple, and payback only from a complete cash-flow schedule", () => {
    const result = calculateRoiOverview({ project: {}, sources: [], cashFlows: [{ monthIndex: 0, amount: -100, flowType: "forecast" }, { monthIndex: 1, amount: 50, flowType: "forecast" }, { monthIndex: 2, amount: 75, flowType: "forecast" }], scenarios: [], contributions: [], returnDetails: emptyDetails });
    expect(result.cashFlow.monthlyIrr).not.toBeNull();
    expect(result.cashFlow.equityMultiple).toBe(1.25);
    expect(result.cashFlow.paybackMonths).toBe(2);
  });

  it("calculates JV capitalization and CE capital efficiency from structured contribution values", () => {
    const result = calculateRoiOverview({ project: {}, sources: [{ id: 7, capitalPath: "facility_jv", capitalCommitted: 100 }], cashFlows: [], scenarios: [], contributions: [{ capitalSourceId: 7, contributor: "ce", amount: 40 }, { capitalSourceId: 7, contributor: "partner", amount: 60 }], returnDetails: { ...emptyDetails, jv: [{ capitalSourceId: 7, ceOwnershipBps: 6000, expectedDistributions: 80 }] } });
    expect(result.contributions[0]).toMatchObject({ ceContribution: 40, partnerContribution: 60, totalCapitalization: 100, ceOwnership: 0.6, capitalEfficiency: 2 });
  });

  it("keeps scenarios explicitly projected and marks incomplete scenarios as missing", () => {
    const result = calculateRoiOverview({ project: {}, sources: [], cashFlows: [], scenarios: [{ id: 1, scenarioName: "Base", scenarioType: "base", revenue: 150, cost: 100, capitalRequired: 100 }, { id: 2, scenarioName: "Downside", scenarioType: "downside", revenue: 110 }], contributions: [], returnDetails: emptyDetails });
    expect(result.scenarios[0]).toMatchObject({ profit: 50, roi: 0.5, state: "projected" });
    expect(result.scenarios[1].state).toBe("missing");
  });
});

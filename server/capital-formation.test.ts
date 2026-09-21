import { describe, expect, it } from "vitest";
import { rankCapitalActions, summarizeCapitalFormation } from "../shared/capitalFormation";

describe("summarizeCapitalFormation", () => {
  it("keeps each capital path distinct while calculating committed, weighted, and remaining funding", () => {
    const summary = summarizeCapitalFormation([{ capitalPath: "equity", targetAmount: 1_000_000 }, { capitalPath: "facility_jv", targetAmount: 2_000_000 }], [{ capitalPath: "equity", requestedAmount: 500_000, committedAmount: 100_000, probability: 60, stage: "diligence" }, { capitalPath: "facility_jv", requestedAmount: 2_000_000, committedAmount: 0, probability: 25, stage: "meeting" }, { capitalPath: "grants", requestedAmount: 250_000, committedAmount: 0, probability: 90, stage: "passed" }]);
    expect(summary.find((row) => row.capitalPath === "equity")).toMatchObject({ targetAmount: 1_000_000, requestedAmount: 500_000, committedAmount: 100_000, weightedPipelineAmount: 300_000, expectedCapitalAmount: 400_000, remainingGap: 900_000, remainingExpectedGap: 600_000 });
    expect(summary.find((row) => row.capitalPath === "facility_jv")).toMatchObject({ weightedPipelineAmount: 500_000, expectedCapitalAmount: 500_000, remainingGap: 2_000_000, remainingExpectedGap: 1_500_000 });
    expect(summary.find((row) => row.capitalPath === "grants")).toMatchObject({ opportunityCount: 0, weightedPipelineAmount: 0 });
  });
});

describe("rankCapitalActions", () => {
  it("prioritizes overdue capital actions before similarly sized opportunities and keeps the recorded path visible", () => {
    const ranked = rankCapitalActions([{ capitalPath: "equipment_finance", requestedAmount: 500_000, committedAmount: 0, fundedAmount: 0, probability: 30, stage: "diligence", organizationName: "Lender A", nextAction: "Submit financing package", nextActionDueAt: "2026-08-19T00:00:00.000Z" }, { capitalPath: "facility_jv", requestedAmount: 800_000, committedAmount: 0, fundedAmount: 0, probability: 30, stage: "meeting", organizationName: "Partner B", nextAction: "Review draft terms" }], new Date("2026-08-20T00:00:00.000Z"));
    expect(ranked[0]).toMatchObject({ capitalPath: "equipment_finance", nextAction: "Submit financing package", urgency: 2 });
  });
});

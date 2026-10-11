import { describe, expect, it } from "vitest";
import { campaignTotals } from "../shared/campaignFinance";

describe("campaign funding measures", () => {
  it("isolates campaigns and keeps commitment separate from funding", () => {
    const result = campaignTotals([
      { campaignId: 1, requestedAmount: 100000000, committedAmount: 100000000, fundedAmount: 20000000, stage: "committed" },
      { campaignId: 2, requestedAmount: 1000000, committedAmount: 1000000, fundedAmount: 1000000, stage: "committed" },
      { campaignId: 1, requestedAmount: 5000000, stage: "passed" },
      { campaignId: 1, requestedAmount: 3000000, stage: "diligence" },
    ], 1, 110000000);
    expect(result.committed).toBe(100000000);
    expect(result.funded).toBe(20000000);
    expect(result.gap).toBe(10000000);
    expect(result.pipeline).toBe(3000000);
  });
  it("preserves an unknown target and floors a fully committed gap at zero", () => {
    expect(campaignTotals([], 1, null).gap).toBeNull();
    expect(campaignTotals([{ campaignId: 1, committedAmount: 20 }], 1, 10).gap).toBe(0);
  });
});

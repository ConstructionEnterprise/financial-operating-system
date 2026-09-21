import { describe, expect, it } from "vitest";
import { calculateNonDilutiveCapitalLeverage, scoreGrantOpportunity, summarizeGrantCapitalState } from "../shared/grantIncentives";

describe("grant and incentive safeguards", () => {
  it("does not promote records without supported CE and project eligibility", () => {
    const result = scoreGrantOpportunity({ ceEligibility: null, projectEligibility: true, geographicEligibility: true, manufacturingRelevance: true, roboticsAutomationRelevance: true, activeApplicationWindow: true, strategicFit: true });
    expect(result.priority).toBe("C");
    expect(result.rationale).toContain("not yet supported");
  });

  it("calculates non-dilutive leverage only from recorded award and match amounts", () => {
    expect(calculateNonDilutiveCapitalLeverage({ awardedAmount: 2_000_000, matchAmount: 1_000_000 }).leverage).toBe(2);
    expect(calculateNonDilutiveCapitalLeverage({ awardedAmount: 2_000_000 }).leverage).toBeNull();
    expect(calculateNonDilutiveCapitalLeverage({ awardedAmount: 2_000_000, matchAmount: 0 }).leverage).toBeNull();
  });

  it("keeps requested, awarded, and funded capital distinct", () => {
    expect(summarizeGrantCapitalState({ requestedAmount: 2_000_000, awardedAmount: 1_500_000, fundedAmount: 500_000 })).toEqual({ requested: 2_000_000, awarded: 1_500_000, funded: 500_000, awardGap: 500_000, unfundedAwardBalance: 1_000_000 });
  });
});

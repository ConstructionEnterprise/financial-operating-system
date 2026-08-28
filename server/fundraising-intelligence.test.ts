import { describe, expect, it } from "vitest";
import { scoreInvestor, simulateFunnel } from "../shared/fundraisingIntelligence";

describe("fundraising intelligence", () => {
  it("prioritizes high-fit engaged investors and makes a clear next-action recommendation", () => {
    const result = scoreInvestor({ fitScore: 9, relationshipStage: "engaged", checkSizeMax: 250000, status: "replied", nextAction: "Ask for a partner meeting" });
    expect(result.score).toBeGreaterThanOrEqual(75);
    expect(result.priority).toBe("High");
    expect(result.nextMove).toContain("Respond");
  });
  it("calculates every funnel stage using transparent user-supplied assumptions", () => {
    expect(simulateFunnel({ prospects: 1000, qualificationRate: 50, contactRate: 50, responseRate: 8, conversationRate: 50, diligenceRate: 50, meetingRate: 50, termSheetRate: 30 })).toEqual({ identified: 1000, qualified: 500, contacted: 250, responses: 20, conversations: 10, diligence: 5, meetings: 3, termSheets: 1 });
  });
});

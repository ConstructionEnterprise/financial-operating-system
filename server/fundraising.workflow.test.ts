import { describe, expect, it } from "vitest";
import { buildAiSummaryEvents, buildCampaignCreatePayload, buildInvestorUpdatePayload, buildMeetingCreatePayload, buildTaskCreatePayload, formatMeetingContext, nextFunnelStage, taskToggleStatus } from "../shared/fundraisingWorkflow";

describe("fundraising operating system workflows", () => {
  it("advances the CE/FF funnel one stage at a time", () => {
    expect(nextFunnelStage("1,000")).toBe("500");
    expect(nextFunnelStage("500")).toBe("100");
    expect(nextFunnelStage("100")).toBe("50");
    expect(nextFunnelStage("50")).toBeNull();
  });

  it("toggles task completion for next-action management", () => {
    expect(taskToggleStatus("open")).toBe("done");
    expect(taskToggleStatus("done")).toBe("open");
  });

  it("builds mutation payloads for investor, campaign, task, and meeting actions", () => {
    const profile = { relationshipStage: "engaged", geography: "US", checkSizeMin: "100000", checkSizeMax: "500000", relationshipOwner: "Founder", nextAction: "Request diligence call", nextActionDueAt: "2026-08-22", source: "Warm intro", notes: "Priority prospect", campaignId: "3" };
    expect(buildInvestorUpdatePayload(7, profile)).toMatchObject({ id: 7, relationshipStage: "engaged", checkSizeMin: 100000, checkSizeMax: 500000, campaignId: 3 });
    expect(buildCampaignCreatePayload("Priority 50", "50", "50")).toEqual({ name: "Priority 50", funnelStage: "50", targetCount: 50, status: "planning" });
    expect(buildTaskCreatePayload("Request diligence call", "7", "2026-08-22")).toMatchObject({ title: "Request diligence call", investorId: 7 });
    expect(buildMeetingCreatePayload("Diligence", "2026-08-23T15:00", "7", "3", "Discuss deployment timeline")).toMatchObject({ title: "Diligence", investorId: 7, campaignId: 3, notes: "Discuss deployment timeline" });
  });

  it("formats meeting context and keeps meeting notes in AI events", () => {
    const meeting = { investorId: 7, title: "Technical diligence", status: "completed", notes: "Discussed deployment timeline.", scheduledAt: "2026-08-21T00:00:00.000Z" };
    expect(formatMeetingContext(meeting)).toContain("Discussed deployment timeline.");
    expect(buildAiSummaryEvents([{ kind: "reply", detail: "Interested in a call.", createdAt: "2026-08-20T00:00:00.000Z" }], [meeting], 7)).toEqual([
      { kind: "reply", detail: "Interested in a call.", createdAt: "2026-08-20T00:00:00.000Z" },
      { kind: "meeting", detail: "Technical diligence · completed · Discussed deployment timeline.", createdAt: "2026-08-21T00:00:00.000Z" },
    ]);
  });
});

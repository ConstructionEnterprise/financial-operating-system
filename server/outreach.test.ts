import { describe, expect, it } from "vitest";
import { buildFollowUpSubject, buildInitialSubject, canSendFromGmailStatus, canSendToContactStatus, canShowSendButton, sixMonthsFrom } from "../shared/outreach";

describe("CE/FF outreach helpers", () => {
  it("schedules exactly one follow-up six months after the initial date", () => {
    const start = new Date("2026-08-20T12:00:00Z");
    expect(sixMonthsFrom(start).toISOString()).toBe("2027-02-20T12:00:00.000Z");
  });

  it("builds simple firm-specific subjects", () => {
    expect(buildInitialSubject("Construct Capital")).toBe("CE/FF + Construct Capital");
    expect(buildFollowUpSubject("Construct Capital")).toBe("Following up — CE/FF + Construct Capital");
  });
});


describe("send safeguards", () => {
  it("enables the send action only when server-reported Gmail status is connected", () => {
    expect(canSendFromGmailStatus(false)).toBe(false);
    expect(canSendFromGmailStatus(true)).toBe(true);
    expect(canSendToContactStatus("sent")).toBe(true);
    expect(canSendToContactStatus("opted_out")).toBe(false);
    expect(canSendToContactStatus("bounced")).toBe(false);
    expect(canSendToContactStatus("paused")).toBe(false);
    expect(canShowSendButton(false, "approved")).toBe(false);
    expect(canShowSendButton(true, "new")).toBe(false);
    expect(canShowSendButton(true, "approved")).toBe(true);
  });
});

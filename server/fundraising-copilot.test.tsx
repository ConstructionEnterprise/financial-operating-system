import React from "react";
import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { FundraisingCopilot, getPipelineAlerts } from "../client/src/components/FundraisingCopilot";
import { InvestorPriorityPanel } from "../client/src/App";

describe("Fundraising Copilot", () => {
  const now = new Date("2026-08-20T12:00:00.000Z");
  const contacts = [
    { id: 1, firmName: "Active Construction Fund", fitScore: 9, relationshipStage: "engaged", checkSizeMax: 250000, status: "replied", nextAction: "Ask for partner meeting", followUpDueAt: "2026-08-19T12:00:00.000Z" },
    { id: 2, firmName: "Approved Capital", fitScore: 7, relationshipStage: "contacted", status: "approved" },
    { id: 3, firmName: "Quiet Investor", fitScore: 6, relationshipStage: "contacted", status: "sent", initialSentAt: "2026-08-10T12:00:00.000Z" },
  ];

  it("derives auditable pipeline alert counts from outreach and meeting records", () => {
    expect(getPipelineAlerts(contacts, [{ id: 4, status: "scheduled", scheduledAt: "2026-08-21T12:00:00.000Z" }], [{ id: 5, investorId: 1, title: "Prepare partner brief", status: "open", dueAt: "2026-08-19T12:00:00.000Z" }], now)).toEqual(expect.arrayContaining([
      expect.objectContaining({ key: "overdueFollowUps", count: 1 }),
      expect.objectContaining({ key: "pendingApprovals", count: 1 }),
      expect.objectContaining({ key: "upcomingMeetings", count: 1 }),
      expect.objectContaining({ key: "unrepliedOutreach", count: 1 }),
      expect.objectContaining({ key: "overdueTasks", count: 1 }),
    ]));
  });

  it("renders the alert panel and ranked next actions", () => {
    const html = renderToStaticMarkup(<FundraisingCopilot contacts={contacts.map((contact) => ({ ...contact, campaignId: contact.id === 1 ? 6 : undefined }))} meetings={[{ id: 4, status: "scheduled", scheduledAt: "2026-08-21T12:00:00.000Z" }]} tasks={[{ id: 5, investorId: 1, title: "Prepare partner brief", status: "open", dueAt: "2026-08-19T12:00:00.000Z" }]} campaigns={[{ id: 6, name: "Priority 50", funnelStage: "50" }]} events={[{ id: 7, contactId: 1, kind: "replied", detail: "Asked for a partner briefing" }]} />);
    expect(html).toContain("Overdue six-month follow-ups");
    expect(html).toContain("Approved drafts");
    expect(html).toContain("Meetings in the next 48 hours");
    expect(html).toContain("Unreplied outreach");
    expect(html).toContain("Overdue next actions");
    expect(html).toContain("Active Construction Fund");
    expect(html).toContain("Recent reply recorded — respond while the conversation is active.");
    expect(html).toContain("Campaign: Priority 50 · 50");
    expect(html).toContain("Latest interaction: replied · Asked for a partner briefing");
  });
});

describe("InvestorPriorityPanel", () => {
  it("renders a transparent score with persisted-record drivers and next action", () => {
    const html = renderToStaticMarkup(<InvestorPriorityPanel contact={{ firmName: "Example Fund", fitScore: 8, relationshipStage: "meeting", checkSizeMax: 100000, status: "sent", nextAction: "Send the investor deck" }} />);
    expect(html).toContain("DETERMINISTIC PRIORITY");
    expect(html).toContain("Thesis alignment");
    expect(html).toContain("Pipeline stage");
    expect(html).toContain("Check-size fit");
    expect(html).toContain("Prior engagement");
    expect(html).toContain("Action readiness");
    expect(html).toContain("Send the investor deck");
    expect(html).toContain("not an opaque AI judgment");
  });
});

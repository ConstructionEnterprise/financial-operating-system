import React from "react";
import { describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { FundraisingDashboard, InvestorsV2 } from "../client/src/App";

const noop = () => undefined;
const mutation = { isPending: false, mutate: vi.fn() };

describe("composed fundraising intelligence workspaces", () => {
  it("renders the application’s real Investors workspace and Dashboard composition with linked intelligence context", () => {
    const contact = { id: 1, firmName: "Example Fund", contactName: "Partner", email: "partner@example.com", fitScore: 8, relationshipStage: "meeting", status: "sent", geography: "US", nextAction: "Send an executive summary", campaignId: 2, bestPitchAngle: "Technology-equity ownership and factory customer model" };
    const html = renderToStaticMarkup(<><InvestorsV2 contacts={[contact]} filtered={[contact]} query="" setQuery={noop} openContact={noop} current={contact} subject="" body="" followSubject="" followBody="" setSubject={noop} setBody={noop} setFollowSubject={noop} setFollowBody={noop} saveMessages={mutation} setStatus={mutation} markSent={mutation} isGmailConnected={false} contactsLoading={false} profile={{ relationshipStage: "meeting", geography: "US", checkSizeMin: "", checkSizeMax: "", relationshipOwner: "", nextAction: "Send an executive summary", nextActionDueAt: "", source: "", notes: "", campaignId: "2" }} setProfile={noop} updateProfile={mutation} investorEvents={[]} campaigns={[{ id: 2, name: "Technology Equity", funnelStage: "50" }]} meetings={[]} aiDraft={mutation} aiClassify={mutation} aiSummarize={mutation} aiClassResult={null} aiHistorySummary="" aiSummaryError="" /><FundraisingDashboard contacts={[contact]} analytics={{ responseRate: 0, positiveRate: 0 }} ready={0} approval={0} meetingsBooked={0} campaigns={[{ id: 2, name: "Technology Equity", funnelStage: "50", status: "active" }]} tasks={[{ id: 3, investorId: 1, title: "Confirm partner attendance", status: "open", dueAt: "2026-08-19T12:00:00.000Z" }]} meetings={[]} events={[{ id: 4, contactId: 1, kind: "replied", detail: "Requested a technical overview" }]} /></>);
    expect(html).toContain("INVESTOR RECORD");
    expect(html).toContain("DETERMINISTIC PRIORITY");
    expect(html).toContain("INVESTOR DNA");
    expect(html).toContain("73/100");
    expect(html).toContain("DAILY FUNDRAISING COPILOT");
    expect(html).toContain("Overdue next actions");
    expect(html).toContain("Recent reply recorded — respond while the conversation is active.");
    expect(html).toContain("Campaign: Technology Equity · 50");
  });
});

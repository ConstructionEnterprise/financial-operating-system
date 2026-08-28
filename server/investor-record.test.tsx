import React from "react";
import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { InvestorsV2 } from "../client/src/App";

const noop = () => undefined;
const mutation = { isPending: false, mutate: noop };

const baseProps = {
  contacts: [{ id: 1, firmName: "Example Fund", contactName: "Partner", email: "partner@example.com", relationshipStage: "identified", status: "new", fitScore: 8, geography: "US" }],
  filtered: [{ id: 1, firmName: "Example Fund", contactName: "Partner", email: "partner@example.com", relationshipStage: "identified", status: "new", fitScore: 8, geography: "US" }],
  query: "", setQuery: noop, openContact: noop, current: { id: 1, firmName: "Example Fund", contactName: "Partner", email: "partner@example.com", relationshipStage: "identified", status: "new", fitScore: 8, geography: "US" },
  subject: "", body: "", followSubject: "", followBody: "", setSubject: noop, setBody: noop, setFollowSubject: noop, setFollowBody: noop,
  saveMessages: mutation, setStatus: mutation, markSent: mutation, isGmailConnected: false, contactsLoading: false,
  profile: { relationshipStage: "identified", geography: "US", checkSizeMin: "", checkSizeMax: "", relationshipOwner: "", nextAction: "", nextActionDueAt: "", source: "", notes: "", campaignId: "" }, setProfile: noop, updateProfile: mutation,
  investorEvents: [], campaigns: [], meetings: [], aiDraft: mutation, aiClassify: mutation, aiSummarize: mutation, aiClassResult: null, aiHistorySummary: "", aiSummaryError: "AI service unavailable.",
};

describe("InvestorsV2", () => {
  it("renders the inline AI summary error in the selected investor record", () => {
    const html = renderToStaticMarkup(<InvestorsV2 {...baseProps} />);
    expect(html).toContain("INVESTOR RECORD");
    expect(html).toContain("AI SUMMARY ERROR");
    expect(html).toContain("AI service unavailable.");
    expect(html).toContain("Prioritized prospect list");
    expect(html).toContain("DETERMINISTIC PRIORITY");
    expect(html).toContain("INVESTOR DNA");
    expect(html).toContain("38");
    expect(html).toContain("Watch");
    expect(html).toContain("Research thesis and identify a warm-introduction path.");
  });
});

// @vitest-environment jsdom
import React from "react";
import { describe, expect, it, vi } from "vitest";
import { render } from "@testing-library/react";
import { InvestorsV2 } from "../client/src/App";

const noop = () => undefined;
const mutation = { isPending: false, mutate: vi.fn() };

describe("investor priority row", () => {
  it("adds the deterministic score and priority badge to the investor table row", () => {
    const contact = { id: 1, firmName: "Example Fund", contactName: "Partner", email: "partner@example.com", relationshipStage: "identified", status: "new", fitScore: 8, geography: "US" };
    const { getByText } = render(<InvestorsV2 contacts={[contact]} filtered={[contact]} query="" setQuery={noop} openContact={noop} current={contact} subject="" body="" followSubject="" followBody="" setSubject={noop} setBody={noop} setFollowSubject={noop} setFollowBody={noop} saveMessages={mutation} setStatus={mutation} markSent={mutation} isGmailConnected={false} contactsLoading={false} profile={{ relationshipStage: "identified", geography: "US", checkSizeMin: "", checkSizeMax: "", relationshipOwner: "", nextAction: "", nextActionDueAt: "", source: "", notes: "", campaignId: "" }} setProfile={noop} updateProfile={mutation} investorEvents={[]} campaigns={[]} meetings={[]} aiDraft={mutation} aiClassify={mutation} aiSummarize={mutation} aiClassResult={null} aiHistorySummary="" aiSummaryError="" />);
    expect(getByText("38/100 · Watch")).toBeTruthy();
  });
});

import { beforeEach, describe, expect, it, vi } from "vitest";

const dbMocks = vi.hoisted(() => ({ getInvestorContact: vi.fn(), createInvestorResearchProposal: vi.fn(), addOutreachEvent: vi.fn(), getInvestorResearchProposal: vi.fn(), updateInvestorContact: vi.fn(), updateInvestorResearchProposalStatus: vi.fn() }));
const researchMocks = vi.hoisted(() => ({ fetchPublicResearchSources: vi.fn(), generateInvestorResearchProposal: vi.fn() }));
const gmailMocks = vi.hoisted(() => ({ sendGmailMessage: vi.fn() }));
vi.mock("./db", () => dbMocks);
vi.mock("./investorResearch", () => researchMocks);
vi.mock("./gmail", () => gmailMocks);

import { appRouter } from "./routers";

function caller() {
  return appRouter.createCaller({ user: { id: 7, openId: "owner", name: "Owner", email: "owner@example.com", loginMethod: "manus", role: "admin", createdAt: new Date(), updatedAt: new Date(), lastSignedIn: new Date() }, req: { protocol: "https", headers: {} } as any, res: { clearCookie: vi.fn() } as any });
}

describe("investor research approval gates", () => {
  beforeEach(() => vi.clearAllMocks());

  it("creates a cited research proposal without changing the investor record or sending an email", async () => {
    dbMocks.getInvestorContact.mockResolvedValue({ id: 42, ownerId: 7, firmName: "AEC Angels", contactName: null, thesis: null });
    researchMocks.fetchPublicResearchSources.mockResolvedValue([{ url: "https://aec-angels.example/", title: "AEC Angels", sourceType: "public website", excerpt: "Construction technology investor." }]);
    researchMocks.generateInvestorResearchProposal.mockResolvedValue({ researchSummary: "Focuses on construction technology.", thesis: "Construction technology", suggestedFitScore: 8, geography: null, checkSizeMin: null, checkSizeMax: null, investorLanguage: null, portfolioHighlights: null, likelyObjections: null, bestPitchAngle: "Lead with software and automation.", warmIntroPath: null, assetClassPreference: null, riskTolerance: null, returnExpectations: null, capitalPreference: null, investmentHorizon: null, decisionStructure: null, decisionCycle: null, communicationPreference: null, draftSubject: "CE/FF + AEC Angels", draftBody: "Hello", fieldEvidence: "[]" });
    dbMocks.createInvestorResearchProposal.mockResolvedValue({ id: 9, status: "proposed" });
    await expect(caller().fundraising.researchInvestor({ contactId: 42, sourceUrls: ["https://aec-angels.example/"] })).resolves.toMatchObject({ id: 9, status: "proposed" });
    expect(dbMocks.createInvestorResearchProposal).toHaveBeenCalled();
    expect(dbMocks.updateInvestorContact).not.toHaveBeenCalled();
    expect(gmailMocks.sendGmailMessage).not.toHaveBeenCalled();
  });

  it("applies only user-selected proposed fields and records that no email was sent", async () => {
    dbMocks.getInvestorResearchProposal.mockResolvedValue({ id: 9, ownerId: 7, contactId: 42, bestPitchAngle: "Lead with platform IP.", draftSubject: "CE/FF + AEC Angels", draftBody: "Hello", suggestedFitScore: 8 });
    dbMocks.updateInvestorContact.mockResolvedValue({ id: 42, bestPitchAngle: "Lead with platform IP.", initialSubject: "CE/FF + AEC Angels" });
    await expect(caller().fundraising.applyResearchProposal({ proposalId: 9, fields: ["bestPitchAngle", "draft"] })).resolves.toMatchObject({ id: 42 });
    expect(dbMocks.updateInvestorContact).toHaveBeenCalledWith(7, 42, { bestPitchAngle: "Lead with platform IP.", initialSubject: "CE/FF + AEC Angels", initialBody: "Hello" });
    expect(dbMocks.updateInvestorResearchProposalStatus).toHaveBeenCalledWith(7, 9, "applied");
    expect(dbMocks.addOutreachEvent).toHaveBeenCalledWith(7, 42, "research_applied", expect.stringContaining("No email was sent"));
    expect(gmailMocks.sendGmailMessage).not.toHaveBeenCalled();
  });

  it("rejects an empty apply selection before any investor field can change", async () => {
    await expect(caller().fundraising.applyResearchProposal({ proposalId: 9, fields: [] })).rejects.toBeTruthy();
    expect(dbMocks.updateInvestorContact).not.toHaveBeenCalled();
    expect(gmailMocks.sendGmailMessage).not.toHaveBeenCalled();
  });

  it("rejects an unsupported field name before any investor field can change", async () => {
    await expect(caller().fundraising.applyResearchProposal({ proposalId: 9, fields: ["untrustedField"] as any })).rejects.toBeTruthy();
    expect(dbMocks.updateInvestorContact).not.toHaveBeenCalled();
    expect(gmailMocks.sendGmailMessage).not.toHaveBeenCalled();
  });
});

import React from "react";
import { describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { InvestorResearchPanel } from "../client/src/App";

describe("InvestorResearchPanel", () => {
  it("renders source attribution and explicit review controls rather than a send action", () => {
    const html = renderToStaticMarkup(<InvestorResearchPanel current={{ id: 42, firmName: "AEC Angels" }} researchUrls="https://aec-angels.example/" setResearchUrls={vi.fn()} proposal={{ id: 9, status: "proposed", createdAt: new Date(), researchSummary: "Construction technology focus.", suggestedFitScore: 8, bestPitchAngle: "Lead with platform IP.", fieldEvidence: JSON.stringify([{ field: "bestPitchAngle", confidence: "high", evidence: "Construction technology focus", sourceUrl: "https://aec-angels.example/" }]) }} sources={[{ id: 1, url: "https://aec-angels.example/", title: "AEC Angels", sourceType: "public website" }]} researchInvestor={{ isPending: false, mutate: vi.fn() }} applyResearchProposal={{ isPending: false, mutate: vi.fn() }} dismissResearchProposal={{ isPending: false, mutate: vi.fn() }} />);
    expect(html).toContain("AI INVESTOR RESEARCH");
    expect(html).toContain("No autosave · No send");
    expect(html).toContain("ATTRIBUTED SOURCES");
    expect(html).toContain("APPLY SELECTED PROPOSALS");
    expect(html).not.toContain("Send via Gmail");
  });

  it("keeps a research failure visible in the panel with its actionable message", () => {
    const html = renderToStaticMarkup(<InvestorResearchPanel current={{ id: 42, firmName: "AEC Angels" }} researchUrls="https://aec-angels.example/" setResearchUrls={vi.fn()} proposal={null} sources={[]} researchInvestor={{ isPending: false, mutate: vi.fn(), error: { message: "Unable to read the public source." } }} applyResearchProposal={{ isPending: false, mutate: vi.fn() }} dismissResearchProposal={{ isPending: false, mutate: vi.fn() }} />);
    expect(html).toContain("Research could not complete.");
    expect(html).toContain("Unable to read the public source.");
  });
});

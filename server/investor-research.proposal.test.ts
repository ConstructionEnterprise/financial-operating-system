import { describe, expect, it, vi } from "vitest";

const llmMocks = vi.hoisted(() => ({ invokeLLM: vi.fn() }));
vi.mock("./_core/llm", () => llmMocks);

import { generateInvestorResearchProposal } from "./investorResearch";

describe("research proposal evidence validation", () => {
  it("retains evidence only when it cites one of the submitted public sources", async () => {
    llmMocks.invokeLLM.mockResolvedValue({ choices: [{ message: { content: JSON.stringify({ researchSummary: "Supported proposal", thesis: null, suggestedFitScore: null, geography: null, checkSizeMin: null, checkSizeMax: null, investorLanguage: null, portfolioHighlights: null, likelyObjections: null, bestPitchAngle: "Lead with software", warmIntroPath: null, assetClassPreference: null, riskTolerance: null, returnExpectations: null, capitalPreference: null, investmentHorizon: null, decisionStructure: null, decisionCycle: null, communicationPreference: null, draftSubject: null, draftBody: null, evidence: [{ field: "bestPitchAngle", confidence: "high", evidence: "Construction automation focus", sourceUrl: "https://approved.example/thesis" }, { field: "portfolioHighlights", confidence: "high", evidence: "Unattributed claim", sourceUrl: "https://unapproved.example/" }] }) } }] });
    const proposal = await generateInvestorResearchProposal({ firmName: "AEC Angels", sources: [{ url: "https://approved.example/thesis", title: "Thesis", sourceType: "public website", excerpt: "Construction automation thesis." }] });
    expect(JSON.parse(proposal.fieldEvidence)).toEqual([{ field: "bestPitchAngle", confidence: "high", evidence: "Construction automation focus", sourceUrl: "https://approved.example/thesis" }]);
    const request = llmMocks.invokeLLM.mock.calls[0][0];
    expect(request).toMatchObject({ model: "gpt-5-mini", reasoning: { effort: "minimal" }, maxCompletionTokens: 1600 });
    expect(request.response_format.json_schema.schema.properties.researchSummary).toEqual({ type: ["string", "null"] });
  });

  it("returns an actionable provider error instead of crashing when structured output has no choices", async () => {
    llmMocks.invokeLLM.mockResolvedValue({ error: { message: "Invalid schema" } });
    await expect(generateInvestorResearchProposal({ firmName: "AEC Angels", sources: [{ url: "https://approved.example/thesis", title: "Thesis", sourceType: "public website", excerpt: "Construction automation thesis." }] })).rejects.toThrow("AI research could not produce a structured proposal: Invalid schema");
  });
});

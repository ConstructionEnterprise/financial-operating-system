import { describe, expect, it, vi } from "vitest";

const { invokeLLM } = vi.hoisted(() => ({ invokeLLM: vi.fn() }));
vi.mock("./_core/llm", () => ({ invokeLLM }));

import { generateInvestorDraft, classifyInvestor, summarizeInvestorHistory } from "./ai";

describe("generateInvestorDraft", () => {
  it("returns the structured subject, body, and next action for review", async () => {
    invokeLLM.mockResolvedValueOnce({ choices: [{ message: { content: JSON.stringify({ subject: "CE/FF + Example Fund", body: "Hi Example Fund team,\\n\\nWould you be open to a short conversation?", nextAction: "Review and approve the draft", rationale: "The thesis mentions construction technology." }) } }] });
    const draft = await generateInvestorDraft({ firmName: "Example Fund", thesis: "construction technology" });
    expect(draft.subject).toContain("Example Fund");
    expect(draft.body).toContain("short conversation");
    expect(draft.nextAction).toBe("Review and approve the draft");
  });
});

describe("classifyInvestor", () => {
  it("returns a constrained priority classification", async () => {
    invokeLLM.mockResolvedValueOnce({ choices: [{ message: { content: JSON.stringify({ priority: "high", recommendedStage: "engaged", reason: "Strong thesis overlap." }) } }] });
    await expect(classifyInvestor({ firmName: "Example Fund", thesis: "construction technology", fitScore: 9 })).resolves.toEqual({ priority: "high", recommendedStage: "engaged", reason: "Strong thesis overlap." });
  });
});

describe("summarizeInvestorHistory", () => {
  it("returns the model summary text", async () => {
    invokeLLM.mockResolvedValueOnce({ choices: [{ message: { content: "Initial outreach drafted; next action is founder review." } }] });
    await expect(summarizeInvestorHistory({ firmName: "Example Fund", events: [] })).resolves.toEqual({ summary: "Initial outreach drafted; next action is founder review." });
  });

  it("passes reply and meeting-note context to the model", async () => {
    invokeLLM.mockResolvedValueOnce({ choices: [{ message: { content: "Reply received and meeting notes captured." } }] });
    await summarizeInvestorHistory({ firmName: "Example Fund", events: [
      { kind: "reply", detail: "Interested in a technical diligence call.", createdAt: "2026-08-20T00:00:00.000Z" },
      { kind: "meeting", detail: "Technical diligence · completed · Discussed facility deployment timeline.", createdAt: "2026-08-21T00:00:00.000Z" },
    ] });
    const call = invokeLLM.mock.calls.at(-1)?.[0] as any;
    expect(call.messages[1].content).toContain("Interested in a technical diligence call.");
    expect(call.messages[1].content).toContain("Discussed facility deployment timeline.");
  });
});

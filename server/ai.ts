import { invokeLLM } from "./_core/llm";

export async function generateInvestorDraft(input: { firmName: string; thesis?: string | null; geography?: string | null; checkSizeMin?: number | null; checkSizeMax?: number | null; relationshipStage?: string | null }) {
  const response = await invokeLLM({
    messages: [
      { role: "system", content: "You help a founder write concise, truthful investor outreach. Do not invent portfolio facts, traction, metrics, relationships, or testimonials. Produce a short email and a practical next action." },
      { role: "user", content: `Create a simple CE/FF investor outreach draft for:\nFirm: ${input.firmName}\nThesis: ${input.thesis || "construction technology and industrial automation"}\nGeography: ${input.geography || "not specified"}\nCheck size: ${input.checkSizeMin || "?"} to ${input.checkSizeMax || "?"}\nRelationship stage: ${input.relationshipStage || "identified"}` },
    ],
    response_format: { type: "json_schema", json_schema: { name: "investor_outreach_draft", strict: true, schema: { type: "object", properties: { subject: { type: "string" }, body: { type: "string" }, nextAction: { type: "string" }, rationale: { type: "string" } }, required: ["subject", "body", "nextAction", "rationale"], additionalProperties: false } } },
  });
  const content = response.choices[0]?.message.content;
  if (typeof content !== "string") throw new Error("AI draft response was empty.");
  return JSON.parse(content) as { subject: string; body: string; nextAction: string; rationale: string };
}


export async function classifyInvestor(input: { firmName: string; thesis?: string | null; fitScore?: number | null; relationshipStage?: string | null; geography?: string | null }) {
  const response = await invokeLLM({
    messages: [
      { role: "system", content: "Classify an investment prospect using only the supplied facts. Do not invent facts. Return a concise priority, stage recommendation, and reason." },
      { role: "user", content: JSON.stringify(input) },
    ],
    response_format: { type: "json_schema", json_schema: { name: "investor_classification", strict: true, schema: { type: "object", properties: { priority: { type: "string", enum: ["high", "medium", "low"] }, recommendedStage: { type: "string" }, reason: { type: "string" } }, required: ["priority", "recommendedStage", "reason"], additionalProperties: false } } },
  });
  const content = response.choices[0]?.message.content;
  if (typeof content !== "string") throw new Error("AI classification response was empty.");
  return JSON.parse(content) as { priority: string; recommendedStage: string; reason: string };
}

export async function summarizeInvestorHistory(input: { firmName: string; events: Array<{ kind: string; detail?: string | null; createdAt: string }> }) {
  const response = await invokeLLM({
    messages: [
      { role: "system", content: "Summarize an investor outreach history in three concise sentences. Use only the supplied events and do not infer unprovided facts." },
      { role: "user", content: JSON.stringify(input) },
    ],
    maxTokens: 300,
  });
  const content = response.choices[0]?.message.content;
  if (typeof content !== "string") throw new Error("AI summary response was empty.");
  return { summary: content.trim() };
}

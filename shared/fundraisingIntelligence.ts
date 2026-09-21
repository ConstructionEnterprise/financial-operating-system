export type InvestorSignal = {
  fitScore?: number | null;
  relationshipStage?: string | null;
  checkSizeMin?: number | null;
  checkSizeMax?: number | null;
  geography?: string | null;
  status?: string | null;
  nextAction?: string | null;
  nextActionDueAt?: Date | string | null;
  thesis?: string | null;
  type?: string | null;
};

const stagePoints: Record<string, number> = { identified: 2, researched: 8, contacted: 12, engaged: 20, meeting: 25, diligence: 30, committed: 35, passed: -20 };

export function scoreInvestor(signal: InvestorSignal, seedTarget = 1_000_000) {
  const thesis = Math.max(0, Math.min(40, Math.round((signal.fitScore ?? 0) * 4)));
  const stage = stagePoints[signal.relationshipStage || "identified"] ?? 0;
  const checkFit = signal.checkSizeMax && signal.checkSizeMax >= seedTarget * 0.05 ? 12 : signal.checkSizeMin ? 6 : 4;
  const engagement = signal.status === "replied" ? 14 : signal.status === "sent" ? 7 : signal.status === "drafted" || signal.status === "approved" ? 4 : 0;
  const action = signal.nextAction ? 5 : 0;
  const score = Math.max(0, Math.min(100, thesis + stage + checkFit + engagement + action));
  const priority = score >= 75 ? "High" : score >= 50 ? "Medium" : "Watch";
  const nextMove = signal.status === "replied" ? "Respond while the conversation is active." : signal.relationshipStage === "identified" ? "Research thesis and identify a warm-introduction path." : signal.status === "new" ? "Draft a tailored first outreach email." : signal.nextAction || "Review investor context and set the next action.";
  return { score, priority, nextMove, drivers: { thesis, stage, checkFit, engagement, action } };
}

export function simulateFunnel(input: { prospects: number; qualificationRate: number; contactRate: number; responseRate: number; conversationRate: number; diligenceRate: number; meetingRate: number; termSheetRate: number }) {
  const next = (base: number, rate: number) => Math.round(base * Math.max(0, Math.min(100, rate)) / 100);
  const qualified = next(input.prospects, input.qualificationRate);
  const contacted = next(qualified, input.contactRate);
  const responses = next(contacted, input.responseRate);
  const conversations = next(responses, input.conversationRate);
  const diligence = next(conversations, input.diligenceRate);
  const meetings = next(diligence, input.meetingRate);
  const termSheets = next(meetings, input.termSheetRate);
  return { identified: input.prospects, qualified, contacted, responses, conversations, diligence, meetings, termSheets };
}

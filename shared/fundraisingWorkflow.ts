export const FUNNEL_STAGES = ["1,000", "500", "100", "50"] as const;

export function nextFunnelStage(stage: string) {
  const index = FUNNEL_STAGES.indexOf(stage as (typeof FUNNEL_STAGES)[number]);
  return index >= 0 && index < FUNNEL_STAGES.length - 1 ? FUNNEL_STAGES[index + 1] : null;
}

export function taskToggleStatus(status: string) {
  return status === "done" ? "open" : "done";
}

export function formatMeetingContext(meeting: { title: string; status: string; notes?: string | null }) {
  return `${meeting.title} · ${meeting.status}${meeting.notes ? ` · ${meeting.notes}` : ""}`;
}

export function buildInvestorUpdatePayload(id: number, profile: any) {
  return { id, relationshipStage: profile.relationshipStage, geography: profile.geography || undefined, checkSizeMin: profile.checkSizeMin ? Number(profile.checkSizeMin) : undefined, checkSizeMax: profile.checkSizeMax ? Number(profile.checkSizeMax) : undefined, relationshipOwner: profile.relationshipOwner || undefined, nextAction: profile.nextAction || undefined, nextActionDueAt: profile.nextActionDueAt ? new Date(profile.nextActionDueAt) : undefined, source: profile.source || undefined, notes: profile.notes || undefined, campaignId: profile.campaignId ? Number(profile.campaignId) : undefined };
}

export function buildCampaignCreatePayload(name: string, funnelStage: string, targetCount: string) {
  return { name, funnelStage, targetCount: targetCount ? Number(targetCount) : undefined, status: "planning" as const };
}

export function buildTaskCreatePayload(title: string, investorId: string, dueAt: string) {
  return { title, investorId: investorId ? Number(investorId) : undefined, dueAt: dueAt ? new Date(dueAt) : undefined };
}

export function buildMeetingCreatePayload(title: string, scheduledAt: string, investorId: string, campaignId: string, notes: string) {
  return { title, scheduledAt: new Date(scheduledAt), investorId: investorId ? Number(investorId) : undefined, campaignId: campaignId ? Number(campaignId) : undefined, notes: notes || undefined };
}

export function buildAiSummaryEvents(events: Array<{ kind: string; detail?: string | null; createdAt: string | Date }>, meetings: Array<{ investorId?: number | null; title: string; status: string; notes?: string | null; scheduledAt: string | Date }>, investorId: number) {
  return [...events.map((event) => ({ kind: event.kind, detail: event.detail, createdAt: new Date(event.createdAt).toISOString() })), ...meetings.filter((meeting) => meeting.investorId === investorId).map((meeting) => ({ kind: "meeting", detail: formatMeetingContext(meeting), createdAt: new Date(meeting.scheduledAt).toISOString() }))];
}

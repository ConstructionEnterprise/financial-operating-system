import React from "react";
import { scoreInvestor } from "../../../shared/fundraisingIntelligence";

type PipelineAlert = {
  key: "overdueFollowUps" | "pendingApprovals" | "upcomingMeetings" | "unrepliedOutreach" | "overdueTasks";
  label: string;
  count: number;
  detail: string;
  tone: "urgent" | "attention" | "scheduled" | "watch";
};

const asDate = (value: unknown) => {
  if (!value) return undefined;
  const parsed = new Date(value as string | Date);
  return Number.isNaN(parsed.getTime()) ? undefined : parsed;
};

export function getPipelineAlerts(contacts: any[], meetings: any[] = [], tasks: any[] = [], now = new Date()): PipelineAlert[] {
  const next48Hours = new Date(now.getTime() + 48 * 60 * 60 * 1000);
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const activeContacts = contacts.filter((contact) => !["opted_out", "bounced", "paused"].includes(contact.status));
  const overdueFollowUps = activeContacts.filter((contact) => {
    const dueAt = asDate(contact.followUpDueAt);
    return Boolean(dueAt && dueAt < now && !contact.followUpSentAt);
  }).length;
  const pendingApprovals = contacts.filter((contact) => contact.status === "approved").length;
  const upcomingMeetings = meetings.filter((meeting) => {
    const scheduledAt = asDate(meeting.scheduledAt);
    return meeting.status === "scheduled" && Boolean(scheduledAt && scheduledAt >= now && scheduledAt <= next48Hours);
  }).length;
  const unrepliedOutreach = activeContacts.filter((contact) => {
    const sentAt = asDate(contact.initialSentAt);
    return contact.status === "sent" && Boolean(sentAt && sentAt <= sevenDaysAgo);
  }).length;
  const overdueTasks = tasks.filter((task) => {
    const dueAt = asDate(task.dueAt);
    return task.status !== "done" && Boolean(dueAt && dueAt < now);
  }).length;

  return [
    { key: "overdueFollowUps", label: "Overdue six-month follow-ups", count: overdueFollowUps, detail: "Due and not yet sent", tone: "urgent" },
    { key: "pendingApprovals", label: "Approved drafts", count: pendingApprovals, detail: "Ready for your final send approval", tone: "attention" },
    { key: "upcomingMeetings", label: "Meetings in the next 48 hours", count: upcomingMeetings, detail: "Prepare relationship context and materials", tone: "scheduled" },
    { key: "unrepliedOutreach", label: "Unreplied outreach", count: unrepliedOutreach, detail: "Sent more than seven days ago", tone: "watch" },
    { key: "overdueTasks", label: "Overdue next actions", count: overdueTasks, detail: "Investor tasks now past due", tone: "urgent" },
  ];
}

export function FundraisingCopilot({ contacts, meetings = [], tasks = [], campaigns = [], events = [] }: { contacts: any[]; meetings?: any[]; tasks?: any[]; campaigns?: any[]; events?: any[] }) {
  const ranked = contacts.map((contact) => {
    const task = tasks.find((item) => item.investorId === contact.id && item.status !== "done");
    const campaign = campaigns.find((item) => item.id === contact.campaignId);
    const latestInteraction = events.find((event) => event.contactId === contact.id);
    return { contact, intelligence: scoreInvestor(contact), task, campaign, latestInteraction };
  }).sort((a, b) => b.intelligence.score - a.intelligence.score).slice(0, 5);
  const alerts = getPipelineAlerts(contacts, meetings, tasks);
  return <section className="copilot-panel" aria-label="Daily Fundraising Copilot"><div className="kicker">DAILY FUNDRAISING COPILOT</div><h2>Priorities for today</h2><p>{contacts.filter((contact) => contact.status === "replied").length} replies, {contacts.filter((contact) => contact.status === "new").length} prospects ready to contact, and {contacts.filter((contact) => contact.nextActionDueAt).length} scheduled next actions.</p><div className="copilot-alert-grid" aria-label="Pipeline alerts">{alerts.map((alert) => <div className={`copilot-alert ${alert.tone}`} key={alert.key}><strong>{alert.count}</strong><div><span>{alert.label}</span><small>{alert.detail}</small></div></div>)}</div><div className="copilot-priority-list">{ranked.map(({ contact, intelligence, task, campaign, latestInteraction }) => <div className="copilot-row" key={contact.id}><strong>{contact.firmName} — {intelligence.score}/100 <em className={`priority-${intelligence.priority.toLowerCase()}`}>{intelligence.priority}</em></strong><span>{latestInteraction?.kind === "replied" ? "Recent reply recorded — respond while the conversation is active." : task ? `Next task: ${task.title}` : intelligence.nextMove}{campaign ? <small className="copilot-context">Campaign: {campaign.name} · {campaign.funnelStage}</small> : null}{latestInteraction ? <small className="copilot-context">Latest interaction: {latestInteraction.kind}{latestInteraction.detail ? ` · ${latestInteraction.detail}` : ""}</small> : null}</span></div>)}</div></section>;
}

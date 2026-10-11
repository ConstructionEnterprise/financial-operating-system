export type TaskStatus = "open" | "in_progress" | "done" | "snoozed";
export type TaskDueBucket = "overdue" | "today" | "next_7_days" | "later" | "no_due_date";

export type TaskRecord = {
  id: number;
  title: string;
  description?: string | null;
  status: TaskStatus;
  dueAt?: Date | string | null;
  investorId?: number | null;
  campaignId?: number | null;
  capitalOpportunityId?: number | null;
  createdAt?: Date | string | null;
};

export type TaskCampaign = { id: number; name: string; financeType?: string | null };
export type TaskOpportunity = { id: number; organizationName: string; capitalPath?: string | null; campaignId?: number | null };

const financeTypeLabels: Record<string, string> = {
  company_equity: "Company equity",
  project_debt: "Project debt",
  project_equity_jv: "Project equity / JV",
  equipment_finance: "Equipment finance",
  grants: "Grants & incentives",
  unclassified: "Unclassified campaign",
};

const capitalPathLabels: Record<string, string> = {
  equity: "Company equity",
  facility_jv: "Project equity / JV",
  equipment_finance: "Equipment finance",
  grants: "Grants & incentives",
};

export const dueBucketLabels: Record<TaskDueBucket, string> = {
  overdue: "Overdue",
  today: "Today",
  next_7_days: "Next 7 days",
  later: "Later",
  no_due_date: "No due date",
};

const chicagoDay = (value: Date | string) => new Intl.DateTimeFormat("en-CA", {
  timeZone: "America/Chicago", year: "numeric", month: "2-digit", day: "2-digit",
}).format(new Date(value));

const addDays = (day: string, amount: number) => {
  const date = new Date(`${day}T12:00:00.000Z`);
  date.setUTCDate(date.getUTCDate() + amount);
  return date.toISOString().slice(0, 10);
};

export function taskDueBucket(task: Pick<TaskRecord, "dueAt" | "status">, now = new Date()): TaskDueBucket {
  if (!task.dueAt) return "no_due_date";
  const today = chicagoDay(now);
  const due = new Date(task.dueAt).toISOString().slice(0, 10);
  if (due < today) return "overdue";
  if (due === today) return "today";
  if (due <= addDays(today, 7)) return "next_7_days";
  return "later";
}

export function taskWorkstream(task: TaskRecord, campaigns: TaskCampaign[], opportunities: TaskOpportunity[]) {
  const campaign = campaigns.find((item) => item.id === task.campaignId);
  const opportunity = opportunities.find((item) => item.id === task.capitalOpportunityId);
  const linkedCampaign = campaign ?? campaigns.find((item) => item.id === opportunity?.campaignId);
  if (linkedCampaign?.financeType) return financeTypeLabels[linkedCampaign.financeType] ?? linkedCampaign.name;
  if (opportunity?.capitalPath) return capitalPathLabels[opportunity.capitalPath] ?? "Capital opportunity";
  if (task.investorId) return "Investor relationship";
  return "Internal / unlinked";
}

export function prioritizeTasks(tasks: TaskRecord[], now = new Date()) {
  const bucketScore: Record<TaskDueBucket, number> = { overdue: 0, today: 1, next_7_days: 2, later: 3, no_due_date: 4 };
  const statusScore: Record<TaskStatus, number> = { in_progress: 0, open: 1, snoozed: 2, done: 3 };
  return [...tasks].sort((left, right) => {
    const status = statusScore[left.status] - statusScore[right.status];
    if (status) return status;
    const bucket = bucketScore[taskDueBucket(left, now)] - bucketScore[taskDueBucket(right, now)];
    if (bucket) return bucket;
    const leftDate = left.dueAt ? +new Date(left.dueAt) : Number.MAX_SAFE_INTEGER;
    const rightDate = right.dueAt ? +new Date(right.dueAt) : Number.MAX_SAFE_INTEGER;
    return leftDate - rightDate || left.id - right.id;
  });
}

export function summarizeTaskWorkspace(tasks: TaskRecord[], campaigns: TaskCampaign[], opportunities: TaskOpportunity[], now = new Date()) {
  const dueOrder: TaskDueBucket[] = ["overdue", "today", "next_7_days", "later", "no_due_date"];
  const due = dueOrder.map((bucket) => {
    const rows = tasks.filter((task) => taskDueBucket(task, now) === bucket);
    return {
      id: bucket,
      label: dueBucketLabels[bucket],
      open: rows.filter((task) => task.status === "open").length,
      inProgress: rows.filter((task) => task.status === "in_progress").length,
      snoozed: rows.filter((task) => task.status === "snoozed").length,
      done: rows.filter((task) => task.status === "done").length,
      total: rows.length,
    };
  });
  const streamNames = Array.from(new Set(tasks.map((task) => taskWorkstream(task, campaigns, opportunities))));
  const workstreams = streamNames.map((name) => {
    const rows = tasks.filter((task) => taskWorkstream(task, campaigns, opportunities) === name);
    return { name, active: rows.filter((task) => task.status !== "done").length, done: rows.filter((task) => task.status === "done").length, total: rows.length };
  }).sort((left, right) => right.active - left.active || right.total - left.total || left.name.localeCompare(right.name));
  const active = tasks.filter((task) => task.status !== "done");
  return {
    total: tasks.length,
    active: active.length,
    inProgress: tasks.filter((task) => task.status === "in_progress").length,
    overdue: active.filter((task) => taskDueBucket(task, now) === "overdue").length,
    dueNext7: active.filter((task) => ["today", "next_7_days"].includes(taskDueBucket(task, now))).length,
    noDueDate: active.filter((task) => !task.dueAt).length,
    completed: tasks.filter((task) => task.status === "done").length,
    linked: tasks.filter((task) => task.investorId || task.campaignId || task.capitalOpportunityId).length,
    due,
    workstreams,
  };
}

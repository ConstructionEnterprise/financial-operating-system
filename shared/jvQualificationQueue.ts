export const JV_QUEUE_PAGE_SIZE = 10;

export const jvQueueSortFields = ["priority", "capital_requested", "qualification_status", "date_added", "last_activity", "next_action_date", "region"] as const;
export type JvQueueSortField = (typeof jvQueueSortFields)[number];
export type JvQueueSortDirection = "asc" | "desc";

type QueueRecord = {
  organizationName: string;
  priority?: "A" | "B" | "C" | null;
  indicativeCapitalAmount?: number | null;
  status?: string | null;
  createdAt?: Date | string | null;
  updatedAt?: Date | string | null;
  nextActionDueAt?: Date | string | null;
  region?: string | null;
};

const priorityRank = { A: 3, B: 2, C: 1 } as const;
const statusRank: Record<string, number> = { research: 1, prospect: 2, qualified: 3, converted: 4, passed: 5 };

function timeValue(value: Date | string | null | undefined) {
  if (!value) return 0;
  const time = new Date(value).getTime();
  return Number.isFinite(time) ? time : 0;
}

function compareStrings(left: string | null | undefined, right: string | null | undefined) {
  return (left || "").localeCompare(right || "");
}

export function sortJvQualificationQueue<T extends QueueRecord>(records: T[], field: JvQueueSortField = "priority", direction: JvQueueSortDirection = "desc") {
  const multiplier = direction === "asc" ? 1 : -1;
  return [...records].sort((left, right) => {
    let comparison = 0;
    if (field === "priority") comparison = (priorityRank[left.priority || "C"] - priorityRank[right.priority || "C"]);
    if (field === "capital_requested") comparison = (left.indicativeCapitalAmount || 0) - (right.indicativeCapitalAmount || 0);
    if (field === "qualification_status") comparison = (statusRank[left.status || "research"] || 0) - (statusRank[right.status || "research"] || 0);
    if (field === "date_added") comparison = timeValue(left.createdAt) - timeValue(right.createdAt);
    if (field === "last_activity") comparison = timeValue(left.updatedAt) - timeValue(right.updatedAt);
    if (field === "next_action_date") comparison = timeValue(left.nextActionDueAt) - timeValue(right.nextActionDueAt);
    if (field === "region") comparison = compareStrings(left.region, right.region);
    if (comparison === 0) comparison = compareStrings(left.organizationName, right.organizationName);
    return comparison * multiplier;
  });
}

export function paginateJvQualificationQueue<T>(records: T[], requestedPage: number, pageSize = JV_QUEUE_PAGE_SIZE) {
  const total = records.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const page = Math.min(Math.max(1, requestedPage), totalPages);
  const start = total === 0 ? 0 : (page - 1) * pageSize;
  const end = Math.min(start + pageSize, total);
  return { records: records.slice(start, end), total, page, totalPages, start, end };
}

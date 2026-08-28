export const GRANT_QUEUE_PAGE_SIZE = 10;
export type GrantQueueSortField = "priority" | "awardMaximum" | "applicationWindow" | "applicationDeadline" | "governmentLevel" | "researchDate";
export type GrantQueueSortDirection = "asc" | "desc";

type GrantQueueRecord = { priority: "A" | "B" | "C"; awardMaximum?: number | null; applicationWindow: "open" | "upcoming" | "closed" | "unknown"; applicationDeadline?: Date | null; governmentLevel: string; researchDate: Date };
const priorityRank = { A: 0, B: 1, C: 2 } as const;
const windowRank = { open: 0, upcoming: 1, unknown: 2, closed: 3 } as const;

export function sortGrantQualificationQueue<T extends GrantQueueRecord>(records: T[], field: GrantQueueSortField, direction: GrantQueueSortDirection) {
  const multiplier = direction === "asc" ? 1 : -1;
  return [...records].sort((left, right) => {
    const leftValue = field === "priority" ? priorityRank[left.priority] : field === "applicationWindow" ? windowRank[left.applicationWindow] : field === "awardMaximum" ? left.awardMaximum ?? -1 : field === "applicationDeadline" ? left.applicationDeadline?.getTime() ?? Number.MAX_SAFE_INTEGER : field === "researchDate" ? left.researchDate.getTime() : left.governmentLevel;
    const rightValue = field === "priority" ? priorityRank[right.priority] : field === "applicationWindow" ? windowRank[right.applicationWindow] : field === "awardMaximum" ? right.awardMaximum ?? -1 : field === "applicationDeadline" ? right.applicationDeadline?.getTime() ?? Number.MAX_SAFE_INTEGER : field === "researchDate" ? right.researchDate.getTime() : right.governmentLevel;
    if (typeof leftValue === "string" && typeof rightValue === "string") return leftValue.localeCompare(rightValue) * multiplier;
    return (Number(leftValue) - Number(rightValue)) * multiplier;
  });
}

export function paginateGrantQualificationQueue<T>(records: T[], page: number, pageSize = GRANT_QUEUE_PAGE_SIZE) {
  const totalPages = Math.max(1, Math.ceil(records.length / pageSize));
  const safePage = Math.min(Math.max(page, 1), totalPages);
  const start = (safePage - 1) * pageSize;
  return { page: safePage, totalPages, start, end: Math.min(start + pageSize, records.length), records: records.slice(start, start + pageSize) };
}

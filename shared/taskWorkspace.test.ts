import { describe, expect, it } from "vitest";
import { prioritizeTasks, summarizeTaskWorkspace, taskDueBucket, taskWorkstream, type TaskRecord } from "./taskWorkspace";

const now = new Date("2026-10-07T18:00:00.000Z");
const tasks: TaskRecord[] = [
  { id: 1, title: "Past action", status: "open", dueAt: "2026-10-06T12:00:00.000Z", campaignId: 10 },
  { id: 2, title: "Today's action", status: "in_progress", dueAt: "2026-10-07T12:00:00.000Z", capitalOpportunityId: 20 },
  { id: 3, title: "Completed action", status: "done", dueAt: "2026-10-01T12:00:00.000Z", investorId: 30 },
  { id: 4, title: "Undated action", status: "open" },
];
const campaigns = [{ id: 10, name: "Stonepine debt", financeType: "project_debt" }];
const opportunities = [{ id: 20, organizationName: "Regional lender", capitalPath: "equipment_finance" }];

describe("task workspace analytics", () => {
  it("classifies due windows by their recorded date", () => {
    expect(taskDueBucket(tasks[0], now)).toBe("overdue");
    expect(taskDueBucket(tasks[1], now)).toBe("today");
    expect(taskDueBucket(tasks[2], now)).toBe("overdue");
    expect(taskDueBucket(tasks[3], now)).toBe("no_due_date");
  });

  it("preserves campaign and capital-opportunity workstreams", () => {
    expect(taskWorkstream(tasks[0], campaigns, opportunities)).toBe("Project debt");
    expect(taskWorkstream(tasks[1], campaigns, opportunities)).toBe("Equipment finance");
    expect(taskWorkstream(tasks[2], campaigns, opportunities)).toBe("Investor relationship");
  });

  it("summarizes governed task records and prioritizes in-progress work", () => {
    const summary = summarizeTaskWorkspace(tasks, campaigns, opportunities, now);
    expect(summary).toMatchObject({ total: 4, active: 3, inProgress: 1, overdue: 1, dueNext7: 1, noDueDate: 1, completed: 1, linked: 3 });
    expect(prioritizeTasks(tasks, now).map((task) => task.id)).toEqual([2, 1, 4, 3]);
  });
});

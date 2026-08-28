import { describe, expect, it } from "vitest";
import { paginateJvQualificationQueue, sortJvQualificationQueue } from "../shared/jvQualificationQueue";

const records = Array.from({ length: 23 }, (_, index) => ({
  organizationName: `Prospect ${String(index + 1).padStart(2, "0")}`,
  priority: index < 3 ? "A" as const : index < 10 ? "B" as const : "C" as const,
  indicativeCapitalAmount: (index + 1) * 100,
  status: "research",
  region: index % 2 ? "Houston" : "DFW",
}));

describe("JV Qualification Queue", () => {
  it("defaults to deterministic priority-first ranking across the complete record set", () => {
    const sorted = sortJvQualificationQueue(records, "priority", "desc");
    expect(sorted).toHaveLength(23);
    expect(sorted.slice(0, 3).every((record) => record.priority === "A")).toBe(true);
  });

  it("paginates the ranked set at ten records per page without removing underlying records", () => {
    const sorted = sortJvQualificationQueue(records);
    expect(paginateJvQualificationQueue(sorted, 1)).toMatchObject({ total: 23, page: 1, totalPages: 3, start: 0, end: 10 });
    expect(paginateJvQualificationQueue(sorted, 2).records).toHaveLength(10);
    expect(paginateJvQualificationQueue(sorted, 3)).toMatchObject({ start: 20, end: 23 });
  });

  it("applies alternate sort direction before pagination", () => {
    const sorted = sortJvQualificationQueue(records, "capital_requested", "asc");
    expect(sorted[0]?.organizationName).toBe("Prospect 01");
    expect(paginateJvQualificationQueue(sorted, 1).records.map((record) => record.organizationName)).toHaveLength(10);
  });
});

import { describe, expect, it } from "vitest";
import { paginateGrantQualificationQueue, sortGrantQualificationQueue } from "../shared/grantQualificationQueue";

const records = Array.from({ length: 12 }, (_, index) => ({ priority: index === 3 ? "A" as const : index < 8 ? "B" as const : "C" as const, awardMaximum: index * 1000, applicationWindow: index === 3 ? "open" as const : "unknown" as const, applicationDeadline: index === 3 ? new Date("2026-10-01") : null, governmentLevel: index % 2 ? "state" : "federal", researchDate: new Date(2026, 0, index + 1) }));

describe("grant qualification queue", () => {
  it("sorts by recorded priority evidence before applying the fixed ten-record page", () => {
    const sorted = sortGrantQualificationQueue(records, "priority", "asc");
    const page = paginateGrantQualificationQueue(sorted, 1);
    expect(sorted[0].priority).toBe("A");
    expect(page.records).toHaveLength(10);
    expect(page.start).toBe(0);
    expect(page.end).toBe(10);
    expect(page.totalPages).toBe(2);
  });

  it("retains the full result set and clamps unavailable pages", () => {
    const page = paginateGrantQualificationQueue(records, 99);
    expect(page.page).toBe(2);
    expect(page.records).toHaveLength(2);
  });
});

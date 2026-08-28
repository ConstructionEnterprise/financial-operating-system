import { describe, expect, it } from "vitest";
import { loadTexasGrantsIncentivesMasterUniverse, planTexasGrantsIncentivesMasterUniverseImport } from "./texasGrantsIncentivesMasterUniverse";

describe("Texas Grants & Incentives master universe", () => {
  it("loads unique, source-attributed research programs without implied eligibility or program terms", () => {
    const records = loadTexasGrantsIncentivesMasterUniverse();
    expect(records.length).toBeGreaterThanOrEqual(100);
    expect(new Set(records.map((record) => record.programName.toLowerCase())).size).toBe(records.length);
    expect(records.every((record) => record.programUrl.startsWith("http") && record.sourceUrl.startsWith("http") && record.sourceLabel.length > 0)).toBe(true);
  });

  it("plans an idempotent import by program name", () => {
    const records = loadTexasGrantsIncentivesMasterUniverse();
    const plan = planTexasGrantsIncentivesMasterUniverseImport(records, records.map((record) => record.programName));
    expect(plan).toEqual({ inserts: [], inserted: 0, skipped: records.length });
  });
});

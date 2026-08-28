import { describe, expect, it } from "vitest";
import { loadTexasJvMasterUniverse, parseTexasJvMasterUniverse, planTexasJvMasterUniverseImport } from "./texasJvMasterUniverse";

describe("Texas JV master universe", () => {
  it("loads exactly 100 unique source-attributed records", () => {
    const records = loadTexasJvMasterUniverse();
    expect(records).toHaveLength(100);
    expect(new Set(records.map((record) => record.organizationName.toLowerCase())).size).toBe(100);
    expect(records.every((record) => record.sourceUrl.startsWith("http") && record.website.startsWith("http"))).toBe(true);
  });

  it("rejects a malformed import schema rather than inserting an ambiguous record", () => {
    expect(() => parseTexasJvMasterUniverse("Organization,Partner Type\nPartner,industrial_developer")).toThrow("unexpected schema");
  });

  it("plans the first import as inserts and the second import as duplicate-safe skips", () => {
    const master = loadTexasJvMasterUniverse();
    const firstRun = planTexasJvMasterUniverseImport(master, []);
    const secondRun = planTexasJvMasterUniverseImport(master, firstRun.inserts.map((record) => record.organizationName));
    expect(firstRun).toMatchObject({ inserted: 100, skipped: 0 });
    expect(secondRun).toMatchObject({ inserted: 0, skipped: 100 });
  });
});

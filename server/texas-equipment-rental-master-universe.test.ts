import { describe, expect, it } from "vitest";
import { loadTexasEquipmentRentalMasterUniverse, parseTexasEquipmentRentalMasterUniverse, planTexasEquipmentRentalMasterUniverseImport } from "./texasEquipmentRentalMasterUniverse";

describe("Texas equipment rental vendor seed", () => {
  it("loads eight unique source-attributed vendor prospects without pricing, contacts, or approval claims", () => {
    const records = loadTexasEquipmentRentalMasterUniverse();
    expect(records).toHaveLength(8);
    expect(new Set(records.map((record) => record.organizationName)).size).toBe(8);
    expect(records.every((record) => record.website.startsWith("https://") && record.sourceUrl.startsWith("https://"))).toBe(true);
    expect(records.some((record) => record.equipmentCategories.includes("Forklifts"))).toBe(true);
  });

  it("rejects malformed source files and skips duplicate organizations when planning an import", () => {
    expect(() => parseTexasEquipmentRentalMasterUniverse("Organization,Source URL\nExample,https://example.com")).toThrow("unexpected schema");
    const records = loadTexasEquipmentRentalMasterUniverse();
    const first = planTexasEquipmentRentalMasterUniverseImport(records, []);
    const second = planTexasEquipmentRentalMasterUniverseImport(records, records.map((record) => record.organizationName));
    expect(first.inserted).toBe(8);
    expect(second.inserted).toBe(0);
    expect(second.skipped).toBe(8);
  });
});

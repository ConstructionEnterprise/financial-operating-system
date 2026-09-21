import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { GRANT_MECHANISM_TYPES } from "../shared/grantIncentives";

export type TexasGrantsIncentivesMasterRecord = { programName: string; sponsor: string; mechanismType: (typeof GRANT_MECHANISM_TYPES)[number]; governmentLevel: "federal" | "state" | "regional" | "local" | "utility" | "strategic" | "other"; texasRegion: string; industryFocus: string; programUrl: string; sourceUrl: string; sourceLabel: string; researchDate: Date };
const headers = ["Program Name", "Sponsor", "Mechanism Type", "Government Level", "Texas Region", "Industry Focus", "Program URL", "Source URL", "Source Label", "Research Date"];
const levels = ["federal", "state", "regional", "local", "utility", "strategic", "other"] as const;

export function parseTexasGrantsIncentivesMasterUniverse(csv: string): TexasGrantsIncentivesMasterRecord[] {
  const [headerLine, ...lines] = csv.trim().split(/\r?\n/);
  if (!headerLine || headerLine.split(",").map((item) => item.trim()).join("|") !== headers.join("|")) throw new Error("The Grants & Incentives seed file has an unexpected schema.");
  const records = lines.filter(Boolean).map((line, index) => {
    const [programName, sponsor, mechanismType, governmentLevel, texasRegion, industryFocus, programUrl, sourceUrl, sourceLabel, researchDate] = line.split(",").map((item) => item.trim());
    if (!programName || !sponsor || !GRANT_MECHANISM_TYPES.includes(mechanismType as any) || !levels.includes(governmentLevel as any) || !texasRegion || !industryFocus || !programUrl?.startsWith("http") || !sourceUrl?.startsWith("http") || !sourceLabel || !/^\d{4}-\d{2}-\d{2}$/.test(researchDate)) throw new Error(`The Grants & Incentives seed file has an invalid record on line ${index + 2}.`);
    return { programName, sponsor, mechanismType: mechanismType as TexasGrantsIncentivesMasterRecord["mechanismType"], governmentLevel: governmentLevel as TexasGrantsIncentivesMasterRecord["governmentLevel"], texasRegion, industryFocus, programUrl, sourceUrl, sourceLabel, researchDate: new Date(`${researchDate}T00:00:00.000Z`) };
  });
  const uniqueNames = new Set(records.map((record) => record.programName.toLowerCase()));
  if (records.length < 40 || uniqueNames.size !== records.length) throw new Error("The Grants & Incentives seed file must contain at least forty unique source-attributed programs.");
  return records;
}

export function loadTexasGrantsIncentivesMasterUniverse() { return parseTexasGrantsIncentivesMasterUniverse(readFileSync(fileURLToPath(new URL("../docs/CE_FF_Texas_Grants_Incentives_Prospects.csv", import.meta.url)), "utf8")); }
export function planTexasGrantsIncentivesMasterUniverseImport<T extends { programName: string }>(records: T[], existingProgramNames: Iterable<string>) { const known = new Set(Array.from(existingProgramNames, (name) => name.trim().toLowerCase())); const inserts: T[] = []; let skipped = 0; for (const record of records) { const key = record.programName.trim().toLowerCase(); if (known.has(key)) { skipped += 1; continue; } known.add(key); inserts.push(record); } return { inserts, inserted: inserts.length, skipped }; }

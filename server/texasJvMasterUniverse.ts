import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

export type TexasJvMasterRecord = {
  organizationName: string;
  partnerType: string;
  region: string;
  website: string;
  sourceUrl: string;
  status: "prospect" | "research";
};

const MASTER_HEADERS = ["Organization", "Partner Type", "Region", "Website", "Source URL", "Status"];

export function parseTexasJvMasterUniverse(csv: string): TexasJvMasterRecord[] {
  const [headerLine, ...rows] = csv.trim().split(/\r?\n/);
  if (!headerLine || headerLine.split(",").map((value) => value.trim()).join("|") !== MASTER_HEADERS.join("|")) {
    throw new Error("The Texas JV master universe has an unexpected schema.");
  }

  const records = rows.filter(Boolean).map((line, index) => {
    const [organizationName, partnerType, region, website, sourceUrl, status] = line.split(",").map((value) => value.trim());
    if (!organizationName || !partnerType || !region || !website || !sourceUrl || !["prospect", "research"].includes(status || "")) {
      throw new Error(`The Texas JV master universe has an invalid record on line ${index + 2}.`);
    }
    return { organizationName, partnerType, region, website, sourceUrl, status: status as TexasJvMasterRecord["status"] };
  });

  const uniqueOrganizations = new Set(records.map((record) => record.organizationName.toLowerCase()));
  if (records.length !== 100 || uniqueOrganizations.size !== records.length) {
    throw new Error("The Texas JV master universe must contain exactly 100 unique records.");
  }
  return records;
}

export function loadTexasJvMasterUniverse(): TexasJvMasterRecord[] {
  const masterPath = fileURLToPath(new URL("../docs/CE_FF_Texas_JV_Partner_Prospects_MASTER_import.csv", import.meta.url));
  return parseTexasJvMasterUniverse(readFileSync(masterPath, "utf8"));
}

export function planTexasJvMasterUniverseImport<T extends { organizationName: string }>(records: T[], existingOrganizationNames: Iterable<string>) {
  const knownOrganizations = new Set(Array.from(existingOrganizationNames, (organizationName) => organizationName.trim().toLowerCase()));
  const inserts: T[] = [];
  let skipped = 0;
  for (const record of records) {
    const organizationKey = record.organizationName.trim().toLowerCase();
    if (knownOrganizations.has(organizationKey)) { skipped += 1; continue; }
    knownOrganizations.add(organizationKey);
    inserts.push(record);
  }
  return { inserts, inserted: inserts.length, skipped };
}

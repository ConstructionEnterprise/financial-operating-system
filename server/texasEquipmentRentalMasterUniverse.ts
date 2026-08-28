import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

export type TexasEquipmentRentalMasterRecord = { organizationName: string; vendorType: string; region: string; equipmentCategories: string; website: string; sourceUrl: string; deliveryAvailable: "Yes" | "No" | "Unknown"; pickupAvailable: "Yes" | "No" | "Unknown"; operatorServices: "Yes" | "No" | "Unknown"; shortTermRental: "Yes" | "No" | "Unknown"; longTermRental: "Yes" | "No" | "Unknown"; newUsedSales: "Yes" | "No" | "Unknown"; serviceMaintenance: "Yes" | "No" | "Unknown"; strategicFit: "High" | "Medium" | "Low" };

const masterHeaders = ["Organization", "Vendor Type", "Region", "Equipment Categories", "Website", "Source URL", "Delivery", "Pickup", "Operator Services", "Short Term", "Long Term", "Sales", "Service Maintenance", "Strategic Fit"];
const yesNoUnknown = ["Yes", "No", "Unknown"] as const;
const strategicFits = ["High", "Medium", "Low"] as const;

export function parseTexasEquipmentRentalMasterUniverse(csv: string): TexasEquipmentRentalMasterRecord[] {
  const [headerLine, ...rows] = csv.trim().split(/\r?\n/);
  if (!headerLine || headerLine.split(",").map((value) => value.trim()).join("|") !== masterHeaders.join("|")) throw new Error("The Texas rental vendor seed file has an unexpected schema.");
  const records = rows.filter(Boolean).map((line, index) => {
    const [organizationName, vendorType, region, equipmentCategories, website, sourceUrl, deliveryAvailable, pickupAvailable, operatorServices, shortTermRental, longTermRental, newUsedSales, serviceMaintenance, strategicFit] = line.split(",").map((value) => value.trim());
    if (!organizationName || !vendorType || !region || !equipmentCategories || !website?.startsWith("http") || !sourceUrl?.startsWith("http") || !yesNoUnknown.includes(deliveryAvailable as any) || !yesNoUnknown.includes(pickupAvailable as any) || !yesNoUnknown.includes(operatorServices as any) || !yesNoUnknown.includes(shortTermRental as any) || !yesNoUnknown.includes(longTermRental as any) || !yesNoUnknown.includes(newUsedSales as any) || !yesNoUnknown.includes(serviceMaintenance as any) || !strategicFits.includes(strategicFit as any)) throw new Error(`The Texas rental vendor seed file has an invalid record on line ${index + 2}.`);
    return { organizationName, vendorType, region, equipmentCategories, website, sourceUrl, deliveryAvailable: deliveryAvailable as TexasEquipmentRentalMasterRecord["deliveryAvailable"], pickupAvailable: pickupAvailable as TexasEquipmentRentalMasterRecord["pickupAvailable"], operatorServices: operatorServices as TexasEquipmentRentalMasterRecord["operatorServices"], shortTermRental: shortTermRental as TexasEquipmentRentalMasterRecord["shortTermRental"], longTermRental: longTermRental as TexasEquipmentRentalMasterRecord["longTermRental"], newUsedSales: newUsedSales as TexasEquipmentRentalMasterRecord["newUsedSales"], serviceMaintenance: serviceMaintenance as TexasEquipmentRentalMasterRecord["serviceMaintenance"], strategicFit: strategicFit as TexasEquipmentRentalMasterRecord["strategicFit"] };
  });
  const uniqueOrganizations = new Set(records.map((record) => record.organizationName.toLowerCase()));
  if (records.length !== 8 || uniqueOrganizations.size !== records.length) throw new Error("The Texas rental vendor seed file must contain eight unique source-attributed records.");
  return records;
}

export function loadTexasEquipmentRentalMasterUniverse() { return parseTexasEquipmentRentalMasterUniverse(readFileSync(fileURLToPath(new URL("../docs/CE_FF_Texas_Equipment_Rental_Vendors_INITIAL_import.csv", import.meta.url)), "utf8")); }
export function planTexasEquipmentRentalMasterUniverseImport<T extends { organizationName: string }>(records: T[], existingOrganizationNames: Iterable<string>) { const known = new Set(Array.from(existingOrganizationNames, (name) => name.trim().toLowerCase())); const inserts: T[] = []; let skipped = 0; for (const record of records) { const key = record.organizationName.trim().toLowerCase(); if (known.has(key)) { skipped += 1; continue; } known.add(key); inserts.push(record); } return { inserts, inserted: inserts.length, skipped }; }

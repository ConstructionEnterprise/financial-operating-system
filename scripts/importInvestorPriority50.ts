/**
 * One-shot recovery import: loads the "Priority 50" CE/FF investor target list
 * (built by Manus on Aug 20, 2026; recovered from the Manus share replay on
 * Sep 25, 2026) into investor_contacts.
 *
 * Idempotent: createInvestorContact dedupes on (ownerId, email), so re-running
 * this script will not create duplicates.
 *
 * Run: npx tsx scripts/importInvestorPriority50.ts   (from the repo root)
 */
import "dotenv/config";
import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { getWorkspaceUser, createInvestorContact } from "../server/db.ts";

const here = dirname(fileURLToPath(import.meta.url));
const csvPath = join(here, "../data/investor-priority-50/CE_FF_investor_target_list_all_50.csv");

function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') { field += '"'; i++; }
        else inQuotes = false;
      } else {
        field += c;
      }
    } else if (c === '"') {
      inQuotes = true;
    } else if (c === ",") {
      row.push(field);
      field = "";
    } else if (c === "\n") {
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
    } else if (c !== "\r") {
      field += c;
    }
  }
  if (field !== "" || row.length > 0) {
    row.push(field);
    rows.push(row);
  }
  return rows.filter((r) => r.some((cell) => cell.trim() !== ""));
}

function slugify(name: string): string {
  return (
    name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 60) || "firm"
  );
}

function parseCheckSizes(stageCheck: string): { min: number | null; max: number | null } {
  const amounts: number[] = [];
  const re = /\$([\d.]+)\s*([kKmM])/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(stageCheck)) !== null) {
    const mult = m[2].toLowerCase() === "k" ? 1_000 : 1_000_000;
    amounts.push(Math.round(parseFloat(m[1]) * mult));
  }
  return { min: amounts[0] ?? null, max: amounts[1] ?? null };
}

const owner = await getWorkspaceUser();
if (!owner) throw new Error("Owner account not found. Database unavailable.");

const rows = parseCsv(readFileSync(csvPath, "utf8"));
const header = rows[0].map((h) => h.trim());
const col = (name: string) => header.indexOf(name);

let inserted = 0;
let duplicates = 0;
for (const row of rows.slice(1)) {
  const get = (n: string) => (row[col(n)] ?? "").trim();
  const firmName = get("investor");
  if (!firmName) continue;
  const realEmail = get("email").toLowerCase();
  // email is NOT NULL + unique per owner in investor_contacts. Only 6 of the 50
  // firms publish a business email; the rest get an unroutable .invalid placeholder
  // so the full list is preserved. The working contact route lives in notes.
  const email = realEmail || `no-public-email+${slugify(firmName)}@ce-ff.invalid`;
  const rank = get("priority_rank");
  const { min, max } = parseCheckSizes(get("stage_check"));
  const notes = [
    `Manus "Priority 50" CE/FF investor target list \u2014 rank #${rank} of 50 (built Aug 20, 2026; recovered Sep 25, 2026).`,
    get("stage_check") ? `Stage/check signal: ${get("stage_check")}` : "",
    get("public_contact_route") ? `Contact route: ${get("public_contact_route")}` : "",
    realEmail
      ? ""
      : "No public business email found \u2014 use the firm website / LinkedIn / contact-form route above.",
  ]
    .filter(Boolean)
    .join("\n");

  const result = await createInvestorContact(owner.id, {
    firmName,
    email,
    type: get("type") || "VC",
    thesis: get("fit") || undefined,
    checkSizeMin: min ?? undefined,
    checkSizeMax: max ?? undefined,
    source: "Manus Priority 50 (Aug 2026)",
    notes,
  });
  if (result.duplicate) duplicates++;
  else inserted++;
}

console.log(JSON.stringify({ ownerId: owner.id, inserted, duplicates, total: inserted + duplicates }));
process.exit(0);

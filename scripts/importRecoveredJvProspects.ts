/**
 * Partial recovery import: seeds the 6 Texas JV prospects visible in the
 * Sep 25, 2026 screenshots of the Manus "CE/FF Investor Outreach" app's
 * "Texas JV Prospect Universe" qualification queue (100 sourced prospects;
 * only 6 rows were visible/recoverable — the app sits behind sign-in).
 *
 * Uses raw SQL with an explicit column list because drizzle/schema.ts has
 * drifted ahead of the TiDB table (schema declares `nextActionDueAt`, which
 * does not exist in the database yet — run `pnpm db:push` to heal the drift).
 *
 * Clearly labeled as partial so the remaining 94 can be merged later.
 * Idempotent: skips organizationNames already present for the owner.
 *
 * Run: npx tsx scripts/importRecoveredJvProspects.ts   (from the repo root)
 */
import "dotenv/config";
import { getDb, getWorkspaceUser } from "../server/db.ts";
import { jvPartnerProspects } from "../drizzle/schema.ts";
import { eq, sql } from "drizzle-orm";

const SHARE_URL = "https://manus.im/share/JX9wQXBJoJWNSqaNgCuR2c";

const recovered: Array<{ organizationName: string; partnerType: string; region: string }> = [
  { organizationName: "VanTrust Real Estate", partnerType: "industrial developer", region: "San Antonio" },
  { organizationName: "Titan Development", partnerType: "industrial developer", region: "Austin" },
  { organizationName: "Perot Development Company", partnerType: "industrial developer", region: "DFW" },
  { organizationName: "Partners Development", partnerType: "industrial developer", region: "DFW" },
  { organizationName: "Paris Economic Development Corporation", partnerType: "landowner land developer", region: "East Texas" },
  { organizationName: "Mohr Capital", partnerType: "real estate investment development", region: "DFW" },
];

const owner = await getWorkspaceUser();
if (!owner) throw new Error("Owner account not found. Database unavailable.");
const db = await getDb();
if (!db) throw new Error("Database unavailable.");

const existing = await db
  .select({ organizationName: jvPartnerProspects.organizationName })
  .from(jvPartnerProspects)
  .where(eq(jvPartnerProspects.ownerId, owner.id));
const existingNames = new Set(existing.map((r) => r.organizationName.toLowerCase()));

let inserted = 0;
let skipped = 0;
for (const r of recovered) {
  if (existingNames.has(r.organizationName.toLowerCase())) {
    skipped++;
    continue;
  }
  await db.execute(
    sql`INSERT INTO jv_partner_prospects
       (ownerId, organizationName, partnerType, region, strategicFit, priority,
        priorityRationale, jvThesis, source, sourceUrl, researchDate, status, nextAction)
     VALUES (
       ${owner.id},
       ${r.organizationName},
       ${r.partnerType},
       ${r.region},
       ${"Medium"},
       ${"B"},
       ${"Manus Priority B in the Texas JV Prospect Universe qualification queue (partial screenshot recovery, Sep 2026)."},
       ${"Partial recovery from the Manus-hosted CE/FF Investor Outreach app's Texas JV Prospect Universe " +
        "(100 sourced prospects; only the 6 rows visible in the Sep 25, 2026 screenshots were recovered). " +
        "Verify the source before qualifying."},
       ${"Manus app screenshot recovery (Sep 2026) — partial, 6 of 100"},
       ${SHARE_URL},
       ${"2026-09-25"},
       ${"prospect"},
       ${"Verify source"}
     )`
  );
  inserted++;
}

console.log(JSON.stringify({ ownerId: owner.id, inserted, skipped, total: recovered.length }));
process.exit(0);

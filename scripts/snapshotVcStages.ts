/**
 * snapshotVcStages.ts — READ-ONLY VCSD helper.
 *
 * Reads the live `stage` of each VC Sandbox capital opportunity from FOS and
 * writes a small JSON snapshot that the VCSD Godot world polls to keep its
 * FOS stage HUD live.
 *
 *   SHARED_INBOX=chappellintl@gmail.com `
 *   VCSD_SNAPSHOT=D:/GodotProjects/vcsd/fos_stages.json `
 *   npx tsx scripts/snapshotVcStages.ts
 *
 * Output shape:
 *   { "updated_at": "<iso>", "stages": { "<firm>": "<stage>", ... } }
 *
 * Run it on a schedule (or by hand) whenever FOS stages change. It never
 * writes to the database.
 */
import "dotenv/config";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { eq, and } from "drizzle-orm";
import {
  getDb,
  getWorkspaceUser,
  findInvestorContactByEmail,
} from "../server/db.ts";
import { capitalOpportunities } from "../drizzle/schema.ts";

const here = dirname(fileURLToPath(import.meta.url));
const agentsPath = join(here, "../data/vc-investor-sandbox/agents.json");

type Agent = { firm: string; emailLocal: string };

const base = (process.env.SHARED_INBOX || "").trim();
if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(base)) {
  throw new Error(
    "Set SHARED_INBOX to the shared inbox, e.g. SHARED_INBOX=you@gmail.com"
  );
}
const [localPart, domain] = base.split("@");
const sandboxEmail = (a: Agent) => `${localPart}+${a.emailLocal}@${domain}`;

const outPath =
  process.env.VCSD_SNAPSHOT || "D:/GodotProjects/vcsd/fos_stages.json";

const pack = JSON.parse(readFileSync(agentsPath, "utf8")) as {
  agents: Agent[];
};

const owner = await getWorkspaceUser();
if (!owner) throw new Error("Owner account not found. Database unavailable.");
const db = await getDb();
if (!db) throw new Error("Database unavailable.");

const stages: Record<string, string> = {};
for (const a of pack.agents) {
  let stage = "identified";
  try {
    const contact = await findInvestorContactByEmail(owner.id, sandboxEmail(a));
    if (contact) {
      const opps = await db
        .select({ stage: capitalOpportunities.stage })
        .from(capitalOpportunities)
        .where(
          and(
            eq(capitalOpportunities.ownerId, owner.id),
            eq(capitalOpportunities.linkedInvestorId, contact.id)
          )
        )
        .limit(1);
      if (opps[0]?.stage) stage = opps[0].stage;
    }
  } catch (e) {
    console.warn(`stage lookup failed for ${a.firm}:`, (e as Error).message);
  }
  stages[a.firm] = stage;
}

mkdirSync(dirname(outPath), { recursive: true });
writeFileSync(
  outPath,
  JSON.stringify({ updated_at: new Date().toISOString(), stages }, null, 2)
);
console.log(`wrote ${outPath}:`, JSON.stringify(stages));
process.exit(0);

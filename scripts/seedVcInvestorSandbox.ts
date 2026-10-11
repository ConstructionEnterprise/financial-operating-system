/**
 * Seeds the VC Investor Sandbox into FOS:
 *  - one campaign "VC Investor Sandbox — Seed Outreach"
 *  - ten sandbox investor_contacts (one per firm: 5 VCs, 3 private banks,
 *    2 JV partners), each addressed to a plus-addressed variant of ONE
 *    shared inbox, so the FOS email automation can be tested without ever
 *    touching a real investor address
 *  - one capital_opportunity per VC/JV investor at stage "identified"
 *    (banks get contacts only — capitalPath has no debt option yet)
 *
 * Idempotent: dedupes the campaign by name, investors by (ownerId, email),
 * and opportunities by linkedInvestorId. Safe to re-run.
 *
 * Source of truth: data/vc-investor-sandbox/agents.json (personas, theses).
 *
 * Run from the repo root:
 *   SHARED_INBOX=you@gmail.com npx tsx scripts/seedVcInvestorSandbox.ts
 */
import "dotenv/config";
import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { eq, and } from "drizzle-orm";
import {
  getDb,
  getWorkspaceUser,
  findInvestorContactByEmail,
  createInvestorContact,
  createCampaign,
  createCapitalOpportunity,
} from "../server/db.ts";
import { campaigns, capitalOpportunities } from "../drizzle/schema.ts";

const here = dirname(fileURLToPath(import.meta.url));
const agentsPath = join(here, "../data/vc-investor-sandbox/agents.json");

type Agent = {
  id: string;
  type: string;
  firm: string;
  persona: string;
  role: string;
  admin: string;
  emailLocal: string;
  thesis: string;
  checkSizeMin: number;
  checkSizeMax: number;
  stage: string;
  geography: string;
  fitScore: number;
  likelyObjections: string;
  bestPitchAngle: string;
  warmIntroPath: string;
  building: string;
  buildingNote: string;
};

// Sandbox agent type -> FOS investor_contacts.type
const FOS_TYPE: Record<string, string> = {
  VC: "VC",
  Bank: "Bank",
  JV: "JV Partner",
};
// Sandbox agent type -> capital_opportunities.capitalPath (null = no opportunity)
const CAPITAL_PATH: Record<string, "equity" | "facility_jv" | null> = {
  VC: "equity",
  Bank: null, // debt path does not exist in the capitalPath enum yet
  JV: "facility_jv",
};

const base = (process.env.SHARED_INBOX || "").trim();
if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(base)) {
  throw new Error(
    "Set SHARED_INBOX to the one shared inbox, e.g. SHARED_INBOX=you@gmail.com"
  );
}
const [localPart, domain] = base.split("@");
const sandboxEmail = (a: Agent) => `${localPart}+${a.emailLocal}@${domain}`;

const pack = JSON.parse(readFileSync(agentsPath, "utf8")) as {
  agents: Agent[];
  campaign: { name: string; description: string };
  labeling: string;
};

const owner = await getWorkspaceUser();
if (!owner) throw new Error("Owner account not found. Database unavailable.");
const db = await getDb();
if (!db) throw new Error("Database unavailable.");

// Campaign (idempotent by name).
const existing = await db
  .select()
  .from(campaigns)
  .where(
    and(eq(campaigns.ownerId, owner.id), eq(campaigns.name, pack.campaign.name))
  )
  .limit(1);
let campaign = existing[0];
if (!campaign) {
  campaign = await createCampaign(owner.id, {
    name: pack.campaign.name,
    description: `${pack.campaign.description}\n\n${pack.labeling}`,
    financeType: "equity",
    targetAmount: "1000000",
    status: "active",
    groupName: "VC Investor Sandbox",
  });
  console.log(`campaign created: id=${campaign.id}`);
} else {
  console.log(`campaign exists: id=${campaign.id}`);
}

let inserted = 0;
let duplicates = 0;
let opportunities = 0;

for (const a of pack.agents) {
  const email = sandboxEmail(a);
  const fosType = FOS_TYPE[a.type] ?? "VC";
  // NOTE: explicit null check — "??" would turn Bank's intentional null
  // (no debt path in the enum) back into "equity".
  const capitalPath: "equity" | "facility_jv" | null =
    a.type in CAPITAL_PATH ? CAPITAL_PATH[a.type] : "equity";
  let contact = await findInvestorContactByEmail(owner.id, email);
  if (!contact) {
    contact = await createInvestorContact(owner.id, {
      firmName: `[SANDBOX] ${a.firm}`,
      contactName: `${a.persona} (sandbox persona)`,
      email,
      type: fosType,
      fitScore: a.fitScore,
      thesis: a.thesis,
      campaignId: campaign.id,
      relationshipStage: "identified",
      checkSizeMin: a.checkSizeMin,
      checkSizeMax: a.checkSizeMax,
      geography: a.geography,
      relationshipOwner: `Sandbox Admin — ${a.admin}`,
      nextAction: "Draft initial outreach via FOS email automation",
      source: "vc-investor-sandbox",
      notes:
        `CAPITAL SANDBOX — simulated ${fosType.toLowerCase()} investor. Persona "${a.persona}" is fictional; ` +
        `the firm thesis is drawn from Joshua's verified public research (Aug 2026). ` +
        `Diligencing building: ${a.building}. ${a.buildingNote} ` +
        `Sandbox admin: ${a.admin}. Shared test inbox: ${base} (plus-addressed). ` +
        `NEVER treat as a real investor contact; NEVER mail outside the sandbox test.`,
      likelyObjections: a.likelyObjections,
      bestPitchAngle: a.bestPitchAngle,
      warmIntroPath: a.warmIntroPath,
      status: "new",
    });
    inserted++;
    console.log(`investor inserted: ${a.firm} <${email}> [${fosType}]`);
  } else {
    duplicates++;
    console.log(`investor exists: ${a.firm} <${email}>`);
  }

  const existingOpps = await db
    .select()
    .from(capitalOpportunities)
    .where(
      and(
        eq(capitalOpportunities.ownerId, owner.id),
        eq(capitalOpportunities.linkedInvestorId, contact.id)
      )
    )
    .limit(1);
  if (existingOpps.length === 0 && capitalPath !== null) {
    const oppKind = capitalPath === "facility_jv" ? "JV" : "equity";
    await createCapitalOpportunity(owner.id, {
      capitalPath,
      organizationName: `[SANDBOX] ${a.firm}`,
      opportunityName: `${a.firm} — sandbox ${oppKind} conversation`,
      contactName: a.persona,
      contactRole: a.role,
      email,
      stage: "identified",
      requestedAmount: 1000000,
      probability: 10,
      linkedInvestorId: contact.id,
      campaignId: campaign.id,
      source: "vc-investor-sandbox",
      termsNotes: a.thesis,
      nextAction:
        "FOS drafts initial outreach; persona replies in character from the 3D sandbox",
    });
    opportunities++;
  }
}

console.log(
  JSON.stringify({
    campaignId: campaign.id,
    sharedInbox: base,
    inserted,
    duplicates,
    opportunitiesCreated: opportunities,
  })
);

// The mysql2 pool keeps the event loop alive; exit explicitly.
process.exit(0);

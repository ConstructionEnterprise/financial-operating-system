/**
 * Prepares the VC Sandbox's FIRST real outreach campaign in FOS:
 *  - finds/creates campaign "VC Sandbox — First Outreach"
 *  - links all ten sandbox investor_contacts (5 VCs, 3 banks, 2 JV partners)
 *  - drafts a tailored initialSubject/initialBody per capital type on each
 *    contact and marks them "drafted"
 *  - logs an outreach event per contact
 *
 * Sends NOTHING. Gmail OAuth is still unwired; these drafts wait for
 * Joshua's review and approval inside FOS.
 *
 * Idempotent: campaign deduped by name; drafts overwritten on re-run.
 *
 * Run from the repo root:
 *   SHARED_INBOX=you@gmail.com npx tsx scripts/prepareSandboxOutreach.ts
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
  updateInvestorContact,
  createCampaign,
  addOutreachEvent,
} from "../server/db.ts";
import { campaigns } from "../drizzle/schema.ts";

const here = dirname(fileURLToPath(import.meta.url));
const agentsPath = join(here, "../data/vc-investor-sandbox/agents.json");

type Agent = {
  id: string;
  type: string;
  firm: string;
  persona: string;
  role: string;
  emailLocal: string;
  checkSizeMin: number;
  checkSizeMax: number;
  building: string;
  bestPitchAngle: string;
};

const CAMPAIGN_NAME = "VC Sandbox — First Outreach";

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
  labeling: string;
};

const owner = await getWorkspaceUser();
if (!owner) throw new Error("Owner account not found. Database unavailable.");
const db = await getDb();
if (!db) throw new Error("Database unavailable.");

const fmtMoney = (n: number) =>
  n >= 1000000 ? `$${n / 1000000}M` : `$${Math.round(n / 1000)}K`;
const firstName = (p: string) => p.split(" ")[0];

function draftFor(a: Agent): { subject: string; body: string } {
  const range = `${fmtMoney(a.checkSizeMin)}–${fmtMoney(a.checkSizeMax)}`;
  const fn = firstName(a.persona);
  if (a.type === "Bank") {
    return {
      subject: `[SANDBOX] Construction financing inquiry — ${a.building}`,
      body: [
        `Hi ${fn},`,
        ``,
        `I'm Joshua Chappell with Chappell International. We're delivering ${a.building} with factory-built modules, and we're lining up construction financing — phased draws against presale closings, in the ${range} range.`,
        ``,
        `Would welcome a conversation about how ${a.firm} structures phased construction facilities for modular delivery.`,
        ``,
        `Best,`,
        `Joshua`,
      ].join("\n"),
    };
  }
  if (a.type === "JV") {
    return {
      subject: `[SANDBOX] JV opportunity — ${a.building}`,
      body: [
        `Hi ${fn},`,
        ``,
        `I'm Joshua Chappell, founder of Chappell International. We manufacture modular multifamily in-house and we're looking for a JV partner on ${a.building} — our execution, your land and entitlement strength, clean promote economics.`,
        ``,
        `Open to a 20-minute intro call next week?`,
        ``,
        `Best,`,
        `Joshua`,
      ].join("\n"),
    };
  }
  return {
    subject: `[SANDBOX] Factory-built housing — intro`,
    body: [
      `Hi ${fn},`,
      ``,
      `I'm Joshua Chappell, founder of Chappell International. We're manufacturing modular multifamily in a robotic factory cell — ${a.building} is the proof case — and we're raising $1M to scale production.`,
      ``,
      `${a.firm} backs industrial tech at our stage, which is why I'm writing. Would you have 20 minutes next week for an intro?`,
      ``,
      `Best,`,
      `Joshua`,
    ].join("\n"),
  };
}

// Campaign (idempotent by name).
const existing = await db
  .select()
  .from(campaigns)
  .where(and(eq(campaigns.ownerId, owner.id), eq(campaigns.name, CAMPAIGN_NAME)))
  .limit(1);
let campaign = existing[0];
if (!campaign) {
  campaign = await createCampaign(owner.id, {
    name: CAMPAIGN_NAME,
    description:
      `First real outreach across the VC Sandbox's ten capital partners ` +
      `(5 VCs, 3 private banks, 2 JV partners). Every recipient is a ` +
      `plus-addressed sandbox inbox (${base}) — no real investor is ever mailed.\n\n` +
      pack.labeling,
    financeType: "unclassified",
    targetAmount: "1000000",
    status: "active",
    groupName: "VC Investor Sandbox",
  });
  console.log(`campaign created: id=${campaign.id}`);
} else {
  console.log(`campaign exists: id=${campaign.id}`);
}

let linked = 0;
let missing = 0;
for (const a of pack.agents) {
  const email = sandboxEmail(a);
  const contact = await findInvestorContactByEmail(owner.id, email);
  if (!contact) {
    missing++;
    console.log(`contact missing (run seed first): ${a.firm} <${email}>`);
    continue;
  }
  const { subject, body } = draftFor(a);
  await updateInvestorContact(owner.id, contact.id, {
    campaignId: campaign.id,
    initialSubject: subject,
    initialBody: body,
    status: "drafted",
    nextAction: "Review draft in FOS; approve to send once Gmail is connected",
  });
  await addOutreachEvent(
    owner.id,
    contact.id,
    "draft_prepared",
    `First-outreach draft prepared for campaign "${CAMPAIGN_NAME}". Nothing sent.`
  );
  linked++;
  console.log(`draft ready: ${a.firm} <${email}> [${a.type}]`);
}

console.log(
  JSON.stringify({ campaignId: campaign.id, linked, missing })
);

// The mysql2 pool keeps the event loop alive; exit explicitly.
process.exit(0);

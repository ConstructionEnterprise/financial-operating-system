import "dotenv/config";
import { readFileSync } from "node:fs";
import mysql from "mysql2/promise";

if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is required");

const campaignOwner = "Joshua Chappell";
const decisionKey = "stonepine-debt-campaign-owner-joshua-chappell-2026-10-07";
const basis = "Joshua Chappell confirmed in the workspace conversation on 2026-10-07 that he is the internal owner of the Stonepine Residences project-debt campaign. Campaign owner is the accountable CE coordinator, not the lender or legal borrower.";

const db = await mysql.createConnection(process.env.DATABASE_URL);
try {
  const ddl = readFileSync(new URL("../drizzle/campaign-financing-decisions.sql", import.meta.url), "utf8");
  await db.query(ddl);
  await db.beginTransaction();

  const [users] = await db.query("SELECT id FROM users WHERE openId = ?", ["fos-local-workspace"]);
  if (users.length !== 1) throw new Error("Expected exactly one local workspace user");
  const ownerId = users[0].id;
  const [rows] = await db.query(`SELECT c.id, c.campaignOwner, c.loanToCostBps, p.projectName
    FROM campaigns c JOIN internal_projects p ON p.id = c.internalProjectId AND p.ownerId = c.ownerId
    WHERE c.ownerId = ? AND c.financeType = 'project_debt' AND p.projectName = 'Stonepine Residences' FOR UPDATE`, [ownerId]);
  if (rows.length !== 1) throw new Error("Expected exactly one Stonepine project-debt campaign");
  const row = rows[0];
  if (row.campaignOwner && row.campaignOwner !== campaignOwner) throw new Error(`Campaign already has another owner: ${row.campaignOwner}`);
  if (Number(row.loanToCostBps) !== 7_000) throw new Error("Stonepine 70% planning decision is not present");

  const [existing] = await db.query("SELECT id FROM campaign_financing_decisions WHERE ownerId = ? AND decisionKey = ?", [ownerId, decisionKey]);
  if (!existing.length) {
    await db.query("UPDATE campaigns SET campaignOwner = ? WHERE ownerId = ? AND id = ?", [campaignOwner, ownerId, row.id]);
    await db.query(`INSERT INTO campaign_financing_decisions
      (ownerId, campaignId, decisionKey, decisionType, status, basis, decidedBy)
      VALUES (?, ?, ?, ?, ?, ?, ?)`, [ownerId, row.id, decisionKey, "campaign_owner_assignment", "user_confirmed", basis, campaignOwner]);
    console.log(`Recorded ${campaignOwner} as internal campaign owner for Stonepine campaign ${row.id}.`);
  } else {
    if (row.campaignOwner !== campaignOwner) throw new Error("Owner decision is logged but campaign owner field differs");
    console.log(`Campaign owner already recorded as ${campaignOwner}; no changes made.`);
  }
  await db.commit();
} catch (error) {
  await db.rollback();
  throw error;
} finally {
  await db.end();
}

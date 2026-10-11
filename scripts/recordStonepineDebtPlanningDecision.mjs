import "dotenv/config";
import { readFileSync } from "node:fs";
import mysql from "mysql2/promise";

if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is required");
const decisionKey = "stonepine-working-debt-70pct-2026-10-07";
const expectedProjectRequirement = 64_750_000;
const loanToCostBps = 7_000;
const loanTarget = 45_325_000;
const borrowerEquity = 19_425_000;
const decisionNote = "Internal planning decision (2026-10-07): workspace user selected 70% loan-to-cost against Stonepine's recorded $64,750,000 estimated project requirement, giving a $45,325,000 working debt target and $19,425,000 implied borrower-equity requirement. This is a scenario and lender-discussion target, not an offer, approval, commitment, funded amount, or verified cash contribution. Rate, maturity, fees, draw schedule, legal borrower and close date remain open.";

const db = await mysql.createConnection(process.env.DATABASE_URL);
try {
  const ddl = readFileSync(new URL("../drizzle/campaign-financing-decisions.sql", import.meta.url), "utf8");
  await db.query(ddl);
  await db.beginTransaction();
  const [owners] = await db.query("SELECT id FROM users WHERE openId = ?", ["fos-local-workspace"]);
  if (owners.length !== 1) throw new Error("Expected exactly one local workspace owner");
  const ownerId = owners[0].id;
  const [rows] = await db.query(`SELECT c.id,c.targetAmount,c.loanToCostBps,c.borrowerEquity,c.financingTerms,p.id AS projectId,p.projectName,p.capitalRequirement
    FROM campaigns c JOIN internal_projects p ON p.id=c.internalProjectId AND p.ownerId=c.ownerId
    WHERE c.ownerId=? AND c.financeType='project_debt' AND p.projectName='Stonepine Residences' FOR UPDATE`, [ownerId]);
  if (rows.length !== 1) throw new Error("Expected exactly one Stonepine project-debt campaign");
  const row = rows[0];
  if (Number(row.capitalRequirement) !== expectedProjectRequirement) throw new Error("Stonepine project requirement changed; re-underwrite before recording this decision");
  for (const [field, expected] of [["targetAmount", loanTarget], ["loanToCostBps", loanToCostBps], ["borrowerEquity", borrowerEquity]]) {
    if (row[field] != null && Number(row[field]) !== expected) throw new Error(`${field} has another recorded value; refusing to overwrite it`);
  }
  const [existing] = await db.query("SELECT id FROM campaign_financing_decisions WHERE ownerId=? AND decisionKey=?", [ownerId, decisionKey]);
  if (existing.length) {
    console.log(`Planning decision already recorded as ${existing[0].id}; no changes made.`);
  } else {
    const previousTerms = String(row.financingTerms || "").replace("Loan target is unset pending borrower-equity, loan-to-cost, collateral and repayment analysis.", "Loan target is an internal working assumption pending collateral and repayment analysis.");
    await db.query("UPDATE campaigns SET targetAmount=?, loanToCostBps=?, borrowerEquity=?, financingTerms=? WHERE ownerId=? AND id=?", [loanTarget, loanToCostBps, borrowerEquity, `${previousTerms}\n\n${decisionNote}`, ownerId, row.id]);
    await db.query(`INSERT INTO campaign_financing_decisions
      (ownerId,campaignId,decisionKey,decisionType,status,amount,loanToCostBps,borrowerEquity,basis,decidedBy)
      VALUES (?,?,?,?,?,?,?,?,?,?)`, [ownerId,row.id,decisionKey,"working_loan_sizing","internal_planning",loanTarget,loanToCostBps,borrowerEquity,decisionNote,"Workspace user, confirmed in conversation"]);
    console.log(`Recorded 70% internal planning decision for campaign ${row.id}; no lender rate or term recorded.`);
  }
  await db.commit();
} catch (error) {
  await db.rollback();
  throw error;
} finally {
  await db.end();
}

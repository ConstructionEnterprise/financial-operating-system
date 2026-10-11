import "dotenv/config";
import mysql from "mysql2/promise";

if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is required");
const db = await mysql.createConnection(process.env.DATABASE_URL);
try {
  const [columns] = await db.query("SHOW COLUMNS FROM campaigns");
  const existing = new Set(columns.map(column => column.Field));
  const fields = { financeType: "VARCHAR(32) NOT NULL DEFAULT 'unclassified'", recipientEntity: "VARCHAR(255) NULL", targetAmount: "DECIMAL(16,2) NULL", internalProjectId: "INT NULL", campaignOwner: "VARCHAR(255) NULL", targetDate: "VARCHAR(10) NULL", financingTerms: "TEXT NULL", preMoneyValuation: "DECIMAL(16,2) NULL", ownershipOfferedBps: "INT NULL", monthlyBurn: "DECIMAL(16,2) NULL", currentCash: "DECIMAL(16,2) NULL", plannedHeadcount: "INT NULL", interestRateBps: "INT NULL", termMonths: "INT NULL", loanToCostBps: "INT NULL", borrowerEquity: "DECIMAL(16,2) NULL", partnerContribution: "DECIMAL(16,2) NULL", ceContribution: "DECIMAL(16,2) NULL", preferredReturnBps: "INT NULL", downPayment: "DECIMAL(16,2) NULL", monthlyPayment: "DECIMAL(16,2) NULL", expectedUtilizationBps: "INT NULL", grantMatchAmount: "DECIMAL(16,2) NULL", grantRequestedAmount: "DECIMAL(16,2) NULL" };
  for (const [field, definition] of Object.entries(fields)) {
    if (!existing.has(field)) await db.query(`ALTER TABLE campaigns ADD COLUMN ${field} ${definition}`);
  }
  const [allocationColumns] = await db.query("SHOW COLUMNS FROM capital_allocations");
  if (!new Set(allocationColumns.map(column => column.Field)).has("campaignId")) await db.query("ALTER TABLE capital_allocations ADD COLUMN campaignId INT NULL AFTER ownerId");
  console.log("Campaign finance fields ready; existing records preserved.");
} finally { await db.end(); }

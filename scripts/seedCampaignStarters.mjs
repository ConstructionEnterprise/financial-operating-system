import "dotenv/config";
import mysql from "mysql2/promise";

const db = await mysql.createConnection(process.env.DATABASE_URL);
try {
  await db.beginTransaction();
  const [users] = await db.query("SELECT id FROM users WHERE openId = ?", ["fos-local-workspace"]);
  if (users.length !== 1) throw new Error("Expected exactly one local workspace owner");
  const owner = users[0].id;
  const [projects] = await db.query("SELECT id, projectName FROM internal_projects WHERE ownerId = ?", [owner]);
  const project = name => projects.find(row => row.projectName === name)?.id ?? null;
  const [buckets] = await db.query("SELECT targetAmount FROM capital_buckets WHERE ownerId = ? AND capitalPath = 'equity'", [owner]);
  const starters = [
    { type: "company_equity", name: "CE — Team & Technology Equity Raise", entity: "Construction Enterprises", project: null, target: buckets[0]?.targetAmount > 0 ? buckets[0].targetAmount : null,
      objective: "Capitalize the CE operating company for employees, engineering, software, robotics and operating runway.",
      terms: "Planning campaign. Target copied from the saved company-equity capital bucket. Valuation, ownership offered, hiring budget and runway require underwriting. Existing equity opportunities are research prospects, not commitments.",
      tasks: ["Approve hiring and operating-use budget", "Set equity valuation and ownership parameters", "Review investor research and contact readiness"] },
    { type: "project_debt", name: "Stonepine — Construction & Permanent Financing", entity: "Stonepine project entity — legal borrower to confirm", project: project("Stonepine Residences"), target: null,
      objective: "Arrange project-level construction financing and evaluate permanent financing for the retained rental homes.",
      terms: "Planning campaign. Loan target is unset pending borrower-equity, loan-to-cost, collateral and repayment analysis. Project development cost is not a loan request. No lender relationship, approval, rate or agency eligibility is assumed.",
      tasks: ["Set borrower equity and proposed loan sizing", "Prepare lender package and repayment scenarios", "Build bank and agency-lending shortlist"] },
    { type: "project_equity", name: "CE Manufacturing Facility — JV Partner Formation", entity: "Facility project entity — structure to confirm", project: project("Chappell International Manufacturing Facility"), target: null,
      objective: "Qualify land, facility and development partners for the manufacturing facility and define project-level contributions.",
      terms: "Planning campaign. JV ownership, valuations, contribution amounts and distribution waterfall are unset. Sourced JV prospects require explicit qualification before conversion into capital opportunities.",
      tasks: ["Define facility JV contribution requirements", "Review sourced JV partners for facility fit", "Draft ownership and distribution alternatives"] },
    { type: "equipment", name: "CE — Production Equipment Financing", entity: "Equipment borrower / lessee — to confirm", project: project("Chappell International Manufacturing Facility"), target: null,
      objective: "Define and finance productive machinery, robotics, fabrication and material-handling equipment for the facility.",
      terms: "Planning campaign. Acquisition budget, lender or lessor, deposits, payment terms and collateral remain unrecorded. Rental vendors are sourcing context, not financing commitments.",
      tasks: ["Approve equipment schedule and obtain quotes", "Compare loan, lease and rental structures", "Confirm borrower, collateral and financing target"] },
    { type: "grants", name: "CE — Manufacturing & Workforce Incentives", entity: "Construction Enterprises — applicant eligibility to confirm", project: null, target: null,
      objective: "Evaluate manufacturing, workforce and technology programs against CE project and operating needs.",
      terms: "Planning campaign. Program eligibility, matching funds and application deadlines require review. Program ceilings are not awards or a campaign funding target.",
      tasks: ["Screen saved programs for CE eligibility", "Match eligible costs and required contributions", "Select applications and record verified deadlines"] },
  ];
  for (const item of starters) {
    const [prior] = await db.query("SELECT id FROM campaigns WHERE ownerId = ? AND financeType = ? ORDER BY id LIMIT 1 FOR UPDATE", [owner, item.type]);
    if (prior.length) { console.log(`${item.type}: existing campaign preserved`); continue; }
    const [result] = await db.execute("INSERT INTO campaigns (ownerId,name,financeType,recipientEntity,internalProjectId,targetAmount,description,financingTerms,status,groupName) VALUES (?,?,?,?,?,?,?,?,?,?)", [owner,item.name,item.type,item.entity,item.project,item.target,item.objective,item.terms,"active","Capital formation"]);
    const campaignId = result.insertId;
    for (const title of item.tasks) await db.execute("INSERT INTO tasks (ownerId,campaignId,title,description,status) VALUES (?,?,?,?,?)", [owner,campaignId,title,"Starter planning action; owner and due date to be assigned.","open"]);
    if (item.type === "company_equity") {
      await db.execute("UPDATE capital_opportunities SET campaignId = ? WHERE ownerId = ? AND capitalPath = 'equity' AND campaignId IS NULL", [campaignId,owner]);
      await db.execute("UPDATE investor_contacts SET campaignId = ? WHERE ownerId = ? AND campaignId IS NULL", [campaignId,owner]);
    }
    console.log(`${item.type}: created campaign ${campaignId} and ${item.tasks.length} planning tasks`);
  }
  await db.commit();
} catch (error) { await db.rollback(); throw error; }
finally { await db.end(); }

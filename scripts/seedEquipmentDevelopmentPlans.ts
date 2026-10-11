import "dotenv/config";
import mysql from "mysql2/promise";
import { readFileSync } from "node:fs";
import { equipmentPlanSeeds } from "../shared/equipmentPlanSeed.ts";
import { equipmentPlanTotals, equipmentPlanSchema } from "../shared/equipmentPlan.ts";

const dryRun = process.argv.includes("--dry-run"), verify = process.argv.includes("--verify");
if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL required");
const db = await mysql.createConnection(process.env.DATABASE_URL);
try {
  const [users]: any = await db.query("SELECT id FROM users WHERE openId=?", ["fos-local-workspace"]);
  if (users.length !== 1) throw new Error("Expected one local workspace owner");
  const ownerId = users[0].id;
  if (!dryRun && !verify) for (const ddl of readFileSync(new URL("../drizzle/equipment-development-plans.sql", import.meta.url), "utf8").split(";").filter(s => s.trim())) await db.query(ddl);
  await db.beginTransaction();
  for (const seed of equipmentPlanSeeds) {
    const [projects]: any = await db.query("SELECT id,programAreaSqFt,programUnitCount FROM internal_projects WHERE ownerId=? AND projectName=? FOR UPDATE", [ownerId, seed.projectName]);
    if (projects.length !== 1) throw new Error(`Project not uniquely resolved: ${seed.projectName}`);
    const p = projects[0];
    if (seed.projectName.startsWith("Stonepine") && (p.programUnitCount !== 200 || p.programAreaSqFt !== 350000)) throw new Error("Stonepine scope changed; rescope equipment first");
    if (seed.projectName.startsWith("Chappell") && p.programAreaSqFt !== 100000) throw new Error("Chappell scope changed; rescope equipment first");
    if (dryRun) { console.log(JSON.stringify({ project: seed.projectName, lines: seed.plan.items.length, ...equipmentPlanTotals(seed.plan.items) })); continue; }
    const [existing]: any = await db.query("SELECT id,payload,revision FROM equipment_development_plans WHERE ownerId=? AND projectId=?", [ownerId,p.id]);
    if (verify || existing.length) {
      if (!existing.length) throw new Error(`Missing plan for ${seed.projectName}`);
      const plan = equipmentPlanSchema.parse(JSON.parse(existing[0].payload));
      const [logs]: any = await db.query("SELECT id FROM equipment_development_plan_audit WHERE ownerId=? AND planId=? AND revision=?", [ownerId,existing[0].id,existing[0].revision]);
      if (logs.length !== 1) throw new Error("Missing current revision audit");
      console.log(JSON.stringify({ project: seed.projectName, preserved: true, revision: existing[0].revision, lines: plan.items.length, ...equipmentPlanTotals(plan.items) })); continue;
    }
    const payload = JSON.stringify(seed.plan);
    const [result]: any = await db.query("INSERT INTO equipment_development_plans (ownerId,projectId,payload) VALUES (?,?,?)", [ownerId,p.id,payload]);
    await db.query("INSERT INTO equipment_development_plan_audit (ownerId,planId,revision,actor,reason,payload) VALUES (?,?,1,?,?,?)", [ownerId,result.insertId,"FOS planning assistant", "User requested full-development equipment scope for Chappell and Stonepine with finance/rent strategies. Analyst estimates and published references; no orders, quotes, loans or budget increments created.",payload]);
    console.log(JSON.stringify({ project: seed.projectName, created: true, lines: seed.plan.items.length, ...equipmentPlanTotals(seed.plan.items) }));
  }
  if (dryRun || verify) await db.rollback(); else await db.commit();
} catch (error) { await db.rollback(); throw error; }
finally { await db.end(); }

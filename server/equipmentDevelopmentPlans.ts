import { and, desc, eq } from "drizzle-orm";
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { equipmentDevelopmentPlans as plans, equipmentDevelopmentPlanAudit as audit, internalProjects } from "../drizzle/schema";
import { equipmentPlanItemSchema, equipmentPlanSchema } from "../shared/equipmentPlan";
import { getDb } from "./db";

export async function listEquipmentDevelopmentPlans(ownerId: number) {
  const db = await getDb(); if (!db) throw new Error("Database unavailable");
  const rows = await db.select({ id: plans.id, projectId: plans.projectId, revision: plans.revision,
    payload: plans.payload, updatedAt: plans.updatedAt, projectName: internalProjects.projectName })
    .from(plans).innerJoin(internalProjects, and(eq(internalProjects.id, plans.projectId), eq(internalProjects.ownerId, ownerId)))
    .where(eq(plans.ownerId, ownerId));
  return rows.map(({ payload, ...row }) => ({ ...row, plan: equipmentPlanSchema.parse(JSON.parse(payload)) }));
}
export const equipmentPlanUpdateInput = z.object({
  id: z.number().int().positive(), revision: z.number().int().positive(), item: equipmentPlanItemSchema,
  reason: z.string().trim().min(5).max(2000),
});
export async function updateEquipmentDevelopmentPlan(ownerId: number, actor: string, input: z.infer<typeof equipmentPlanUpdateInput>) {
  const db = await getDb(); if (!db) throw new Error("Database unavailable");
  return db.transaction(async tx => {
    const [row] = await tx.select().from(plans).where(and(eq(plans.id, input.id), eq(plans.ownerId, ownerId))).for("update");
    if (!row) throw new TRPCError({ code: "NOT_FOUND", message: "Equipment plan not found" });
    if (row.revision !== input.revision) throw new TRPCError({ code: "CONFLICT", message: "This plan changed. Reload before saving your revision." });
    const plan = equipmentPlanSchema.parse(JSON.parse(row.payload));
    if (!plan.items.some(i => i.key === input.item.key)) throw new Error("Equipment line not found");
    // Edits remain planning estimates; original source is preserved in the audit snapshot.
    const changed = { ...input.item, basis: `User-revised planning estimate. ${input.reason}`, sourceUrl: null };
    const next = equipmentPlanSchema.parse({ ...plan, items: plan.items.map(i => i.key === changed.key ? changed : i) });
    const payload = JSON.stringify(next), revision = row.revision + 1;
    await tx.update(plans).set({ payload, revision }).where(and(eq(plans.id, row.id), eq(plans.ownerId, ownerId)));
    await tx.insert(audit).values({ ownerId, planId: row.id, revision, actor, reason: input.reason, payload });
    return { revision };
  });
}
export async function equipmentPlanHistory(ownerId: number, planId: number) {
  const db = await getDb(); if (!db) throw new Error("Database unavailable");
  return db.select({ revision: audit.revision, actor: audit.actor, reason: audit.reason, createdAt: audit.createdAt })
    .from(audit).where(and(eq(audit.ownerId, ownerId), eq(audit.planId, planId))).orderBy(desc(audit.revision)).limit(20);
}

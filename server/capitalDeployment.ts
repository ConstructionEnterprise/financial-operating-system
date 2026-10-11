import { and, desc, eq } from "drizzle-orm";
import { z } from "zod";
import { campaigns, capitalAllocations, capitalPayments, capitalOpportunities, internalProjects } from "../drizzle/schema";
import { getDb } from "./db";

const amount = z.number().finite().min(0).max(999_999_999_999).refine((value) => Math.abs(value * 100 - Math.round(value * 100)) < 0.001, "Use at most two decimal places");
export const allocationInput = z.object({
  id: z.number().int().positive().optional(),
  campaignId: z.number().int().positive().nullable().optional(),
  sourceOpportunityId: z.number().int().positive().nullable(),
  internalProjectId: z.number().int().positive().nullable(),
  purpose: z.string().trim().min(1).max(255),
  category: z.enum(["construction", "land_site", "equipment", "payroll", "insurance", "software", "professional_services", "working_capital", "contingency", "other"]),
  equipmentName: z.string().trim().max(255).nullable(),
  plannedAmount: amount,
  committedAmount: amount.nullable(),
  plannedMonth: z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/).nullable(),
  reference: z.string().trim().max(500).nullable(), notes: z.string().max(10_000).nullable(),
});
const calendarDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/).refine((value) => { const date = new Date(`${value}T00:00:00Z`); return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value; }, "Enter a valid payment date");
export const paymentInput = z.object({ allocationId: z.number().int().positive(), requestKey: z.string().uuid(), amount: amount.refine((value) => value > 0, "Payment must be greater than zero"), paidOn: calendarDate, reference: z.string().trim().min(1).max(500) });

export async function listCapitalDeployment(ownerId: number) {
  const db = await getDb(); if (!db) throw new Error("Database unavailable");
  const [allocations, payments] = await Promise.all([
    db.select().from(capitalAllocations).where(eq(capitalAllocations.ownerId, ownerId)).orderBy(desc(capitalAllocations.updatedAt)),
    db.select().from(capitalPayments).where(eq(capitalPayments.ownerId, ownerId)).orderBy(desc(capitalPayments.paidOn), desc(capitalPayments.id)),
  ]);
  return { allocations, payments };
}

export async function saveCapitalAllocation(ownerId: number, input: z.infer<typeof allocationInput>) {
  const db = await getDb(); if (!db) throw new Error("Database unavailable");
  if (input.category === "equipment" && !input.equipmentName?.trim()) throw new Error("Name the equipment or asset being funded.");
  if (input.sourceOpportunityId) {
    const [source] = await db.select().from(capitalOpportunities).where(and(eq(capitalOpportunities.ownerId, ownerId), eq(capitalOpportunities.id, input.sourceOpportunityId)));
    if (!source) throw new Error("Funding source not found in this workspace.");
  }
  if (input.campaignId) {
    const [campaign] = await db.select().from(campaigns).where(and(eq(campaigns.ownerId, ownerId), eq(campaigns.id, input.campaignId)));
    if (!campaign) throw new Error("Campaign not found in this workspace.");
  }
  if (input.internalProjectId) {
    const [project] = await db.select().from(internalProjects).where(and(eq(internalProjects.ownerId, ownerId), eq(internalProjects.id, input.internalProjectId)));
    if (!project) throw new Error("Project not found in this workspace.");
  }
  return db.transaction(async (tx) => {
    const { id, ...fields } = input;
    const values = { ...fields, campaignId: input.campaignId ?? null, ownerId, plannedAmount: input.plannedAmount.toFixed(2), committedAmount: input.committedAmount?.toFixed(2) ?? null };
    if (id) {
      const [existing] = await tx.select().from(capitalAllocations).where(and(eq(capitalAllocations.ownerId, ownerId), eq(capitalAllocations.id, id))).for("update");
      if (!existing) throw new Error("Allocation not found in this workspace.");
      const payments = await tx.select().from(capitalPayments).where(and(eq(capitalPayments.ownerId, ownerId), eq(capitalPayments.allocationId, id)));
      if (payments.length && (existing.campaignId !== (input.campaignId ?? null) || existing.sourceOpportunityId !== input.sourceOpportunityId || existing.internalProjectId !== input.internalProjectId || existing.category !== input.category || existing.equipmentName !== input.equipmentName)) throw new Error("This allocation has payment history. Its campaign, source, project, use category, and equipment identity are fixed; create another allocation for a different destination.");
      await tx.update(capitalAllocations).set(values).where(and(eq(capitalAllocations.ownerId, ownerId), eq(capitalAllocations.id, id)));
      return { id };
    }
    const result = await tx.insert(capitalAllocations).values(values);
    return { id: Number(result[0].insertId) };
  });
}

export async function recordCapitalPayment(ownerId: number, input: z.infer<typeof paymentInput>) {
  const db = await getDb(); if (!db) throw new Error("Database unavailable");
  return db.transaction(async (tx) => {
    const [allocation] = await tx.select().from(capitalAllocations).where(and(eq(capitalAllocations.ownerId, ownerId), eq(capitalAllocations.id, input.allocationId))).for("update");
    if (!allocation) throw new Error("Allocation not found in this workspace.");
    const [prior] = await tx.select().from(capitalPayments).where(and(eq(capitalPayments.ownerId, ownerId), eq(capitalPayments.requestKey, input.requestKey)));
    if (prior) {
      if (prior.allocationId !== input.allocationId || Number(prior.amount) !== input.amount || prior.paidOn !== input.paidOn || prior.reference !== input.reference) throw new Error("Payment request already used with different details. Refresh before recording another payment.");
      return { id: prior.id };
    }
    const result = await tx.insert(capitalPayments).values({ ...input, ownerId, amount: input.amount.toFixed(2) });
    return { id: Number(result[0].insertId) };
  });
}

export async function setCapitalPaymentVoided(ownerId: number, id: number, voided: boolean) {
  const db = await getDb(); if (!db) throw new Error("Database unavailable");
  const [payment] = await db.select().from(capitalPayments).where(and(eq(capitalPayments.ownerId, ownerId), eq(capitalPayments.id, id)));
  if (!payment) throw new Error("Payment not found in this workspace.");
  await db.update(capitalPayments).set({ voided }).where(and(eq(capitalPayments.ownerId, ownerId), eq(capitalPayments.id, id)));
  return { id, voided };
}

import { and, asc, eq } from "drizzle-orm";
import { fundraisingDocuments, projectEconomicsInputDocuments, projectEconomicsInputs, projectEconomicsModels, projectEconomicsMonthlyItems } from "../drizzle/schema";
import { summarizeProjectEconomicsReadiness } from "../shared/projectEconomics";
import { getCapitalOpportunity, getDb } from "./db";
import { getInternalProject } from "./internalProjects";

type ModelInput = Omit<typeof projectEconomicsInputs.$inferInsert, "id" | "ownerId" | "createdAt" | "updatedAt">;
type MonthlyItemInput = Omit<typeof projectEconomicsMonthlyItems.$inferInsert, "id" | "ownerId" | "createdAt" | "updatedAt">;

export async function getProjectEconomicsModelForProject(ownerId: number, internalProjectId: number) {
  const db = await getDb(); if (!db) return null;
  const rows = await db.select().from(projectEconomicsModels).where(and(eq(projectEconomicsModels.ownerId, ownerId), eq(projectEconomicsModels.internalProjectId, internalProjectId))).limit(1);
  return rows[0] ?? null;
}

async function getOwnedProjectEconomicsModel(ownerId: number, modelId: number) {
  const db = await getDb(); if (!db) return null;
  const rows = await db.select().from(projectEconomicsModels).where(and(eq(projectEconomicsModels.ownerId, ownerId), eq(projectEconomicsModels.id, modelId))).limit(1);
  return rows[0] ?? null;
}

export async function initializeProjectEconomicsModel(ownerId: number, internalProjectId: number) {
  const db = await getDb(); if (!db) throw new Error("Database unavailable");
  const project = await getInternalProject(ownerId, internalProjectId);
  if (!project) throw new Error("Internal Project not found for this workspace owner.");
  const existing = await getProjectEconomicsModelForProject(ownerId, internalProjectId);
  if (existing) return existing;
  const result = await db.insert(projectEconomicsModels).values({ ownerId, internalProjectId, modelName: `${project.projectName} — 36-Month Project Economics Model`, modelStatus: "shell", horizonMonths: 36, modelStartDataState: "missing" });
  return getOwnedProjectEconomicsModel(ownerId, Number(result[0].insertId));
}

export async function initializeChappellProjectEconomicsModel(ownerId: number, internalProjectId: number) {
  const project = await getInternalProject(ownerId, internalProjectId);
  if (!project) throw new Error("Internal Project not found for this workspace owner.");
  if (project.projectName !== "Chappell International Manufacturing Facility") throw new Error("The 36-month project-economics pilot is currently limited to Chappell International Manufacturing Facility.");
  return initializeProjectEconomicsModel(ownerId, internalProjectId);
}

export async function listProjectEconomicsInputs(ownerId: number, modelId?: number) {
  const db = await getDb(); if (!db) return [];
  const condition = modelId === undefined ? eq(projectEconomicsInputs.ownerId, ownerId) : and(eq(projectEconomicsInputs.ownerId, ownerId), eq(projectEconomicsInputs.modelId, modelId));
  return db.select().from(projectEconomicsInputs).where(condition).orderBy(asc(projectEconomicsInputs.inputArea), asc(projectEconomicsInputs.sortOrder), asc(projectEconomicsInputs.id));
}

export async function saveProjectEconomicsInput(ownerId: number, input: ModelInput & { id?: number }) {
  const db = await getDb(); if (!db) throw new Error("Database unavailable");
  const model = await getOwnedProjectEconomicsModel(ownerId, input.modelId);
  if (!model) throw new Error("Project-economics model not found for this workspace owner.");
  if (input.dataState !== "missing" && (input.value === null || input.value === undefined)) throw new Error("Record a value before assigning an actual, projected, or estimated state.");
  if (input.linkedCapitalOpportunityId !== null && input.linkedCapitalOpportunityId !== undefined && !await getCapitalOpportunity(ownerId, input.linkedCapitalOpportunityId)) throw new Error("Linked capital opportunity not found for this workspace owner.");
  const { id, ...values } = input;
  let inputId = id;
  if (id) await db.update(projectEconomicsInputs).set(values).where(and(eq(projectEconomicsInputs.ownerId, ownerId), eq(projectEconomicsInputs.id, id)));
  else { const result = await db.insert(projectEconomicsInputs).values({ ...values, ownerId }); inputId = Number(result[0].insertId); }
  const rows = await db.select().from(projectEconomicsInputs).where(and(eq(projectEconomicsInputs.ownerId, ownerId), eq(projectEconomicsInputs.id, inputId!))).limit(1);
  return rows[0];
}

export async function listProjectEconomicsMonthlyItems(ownerId: number, modelId?: number) {
  const db = await getDb(); if (!db) return [];
  const condition = modelId === undefined ? eq(projectEconomicsMonthlyItems.ownerId, ownerId) : and(eq(projectEconomicsMonthlyItems.ownerId, ownerId), eq(projectEconomicsMonthlyItems.modelId, modelId));
  return db.select().from(projectEconomicsMonthlyItems).where(condition).orderBy(asc(projectEconomicsMonthlyItems.monthIndex), asc(projectEconomicsMonthlyItems.category));
}

export async function saveProjectEconomicsMonthlyItem(ownerId: number, input: MonthlyItemInput) {
  const db = await getDb(); if (!db) throw new Error("Database unavailable");
  const model = await getOwnedProjectEconomicsModel(ownerId, input.modelId);
  if (!model) throw new Error("Project-economics model not found for this workspace owner.");
  if (input.monthIndex < 1 || input.monthIndex > model.horizonMonths) throw new Error(`Month must be between 1 and ${model.horizonMonths}.`);
  if (input.dataState !== "missing" && (input.amount === null || input.amount === undefined)) throw new Error("Record an amount before assigning an actual, projected, or estimated state.");
  await db.insert(projectEconomicsMonthlyItems).values({ ...input, ownerId }).onDuplicateKeyUpdate({ set: { phase: input.phase, amount: input.amount, dataState: input.dataState, sourceReference: input.sourceReference, effectiveAt: input.effectiveAt, ownerName: input.ownerName, notes: input.notes } });
  const rows = await db.select().from(projectEconomicsMonthlyItems).where(and(eq(projectEconomicsMonthlyItems.ownerId, ownerId), eq(projectEconomicsMonthlyItems.modelId, input.modelId), eq(projectEconomicsMonthlyItems.monthIndex, input.monthIndex), eq(projectEconomicsMonthlyItems.category, input.category))).limit(1);
  return rows[0];
}

export async function listProjectEconomicsInputDocuments(ownerId: number, modelInputId?: number) {
  const db = await getDb(); if (!db) return [];
  const condition = modelInputId === undefined ? eq(projectEconomicsInputDocuments.ownerId, ownerId) : and(eq(projectEconomicsInputDocuments.ownerId, ownerId), eq(projectEconomicsInputDocuments.modelInputId, modelInputId));
  return db.select().from(projectEconomicsInputDocuments).where(condition);
}

export async function linkDocumentToProjectEconomicsInput(ownerId: number, modelInputId: number, documentId: number) {
  const db = await getDb(); if (!db) throw new Error("Database unavailable");
  const [inputs, documents] = await Promise.all([db.select({ id: projectEconomicsInputs.id }).from(projectEconomicsInputs).where(and(eq(projectEconomicsInputs.ownerId, ownerId), eq(projectEconomicsInputs.id, modelInputId))).limit(1), db.select({ id: fundraisingDocuments.id }).from(fundraisingDocuments).where(and(eq(fundraisingDocuments.ownerId, ownerId), eq(fundraisingDocuments.id, documentId), eq(fundraisingDocuments.status, "current"))).limit(1)]);
  if (!inputs[0] || !documents[0]) throw new Error("Model input or current library document not found.");
  await db.insert(projectEconomicsInputDocuments).values({ ownerId, modelInputId, documentId }).onDuplicateKeyUpdate({ set: { createdAt: new Date() } });
  return { success: true } as const;
}

export async function unlinkDocumentFromProjectEconomicsInput(ownerId: number, modelInputId: number, documentId: number) {
  const db = await getDb(); if (!db) throw new Error("Database unavailable");
  await db.delete(projectEconomicsInputDocuments).where(and(eq(projectEconomicsInputDocuments.ownerId, ownerId), eq(projectEconomicsInputDocuments.modelInputId, modelInputId), eq(projectEconomicsInputDocuments.documentId, documentId)));
  return { success: true } as const;
}

export async function getProjectEconomicsReadiness(ownerId: number, modelId: number) {
  const [model, inputs, monthlyItems] = await Promise.all([getOwnedProjectEconomicsModel(ownerId, modelId), listProjectEconomicsInputs(ownerId, modelId), listProjectEconomicsMonthlyItems(ownerId, modelId)]);
  if (!model) throw new Error("Project-economics model not found for this workspace owner.");
  return { model, ...summarizeProjectEconomicsReadiness(inputs, monthlyItems) };
}

import { and, desc, eq } from "drizzle-orm";
import { fundraisingDocuments, internalProjectCapitalNeeds, internalProjectCapitalNeedStrategies, internalProjectDocuments, internalProjects, capitalOpportunities, roiProjects } from "../drizzle/schema";
import { type InternalProjectStrategyType, summarizeInternalProjectCapitalStack } from "../shared/internalProjects";
import { initialInternalProjectSeed } from "../shared/internalProjectSeed";
import { getDb } from "./db";

type InternalProjectInput = Omit<typeof internalProjects.$inferInsert, "id" | "ownerId" | "createdAt" | "updatedAt">;
type CapitalNeedInput = Omit<typeof internalProjectCapitalNeeds.$inferInsert, "id" | "ownerId" | "createdAt" | "updatedAt"> & { strategyTypes?: InternalProjectStrategyType[] };

export async function listInternalProjects(ownerId: number) {
  const db = await getDb(); if (!db) return [];
  return db.select().from(internalProjects).where(eq(internalProjects.ownerId, ownerId)).orderBy(desc(internalProjects.updatedAt));
}

export async function getInternalProject(ownerId: number, id: number) {
  const db = await getDb(); if (!db) return undefined;
  const rows = await db.select().from(internalProjects).where(and(eq(internalProjects.ownerId, ownerId), eq(internalProjects.id, id))).limit(1);
  return rows[0];
}

async function assertOwnedRoiProject(ownerId: number, roiProjectId: number | null | undefined) {
  if (roiProjectId === null || roiProjectId === undefined) return;
  const db = await getDb(); if (!db) throw new Error("Database unavailable");
  const rows = await db.select({ id: roiProjects.id }).from(roiProjects).where(and(eq(roiProjects.ownerId, ownerId), eq(roiProjects.id, roiProjectId))).limit(1);
  if (!rows[0]) throw new Error("ROI / Returns project not found for this workspace owner.");
}

export async function createInternalProject(ownerId: number, input: InternalProjectInput) {
  const db = await getDb(); if (!db) throw new Error("Database unavailable");
  await assertOwnedRoiProject(ownerId, input.roiProjectId);
  const result = await db.insert(internalProjects).values({ ...input, ownerId });
  return getInternalProject(ownerId, Number(result[0].insertId));
}

export async function seedInitialInternalProjects(ownerId: number) {
  const db = await getDb(); if (!db) throw new Error("Database unavailable");
  const existing = await listInternalProjects(ownerId);
  const existingNames = new Set(existing.map((project) => project.projectName));
  const seedRecords = initialInternalProjectSeed.filter((project) => !existingNames.has(project.projectName));
  if (seedRecords.length) await db.insert(internalProjects).values(seedRecords.map((project) => ({ ...project, ownerId })));
  return { inserted: seedRecords.length, skipped: initialInternalProjectSeed.length - seedRecords.length, projects: await listInternalProjects(ownerId) };
}

export async function updateInternalProject(ownerId: number, id: number, patch: Partial<InternalProjectInput>) {
  const db = await getDb(); if (!db) throw new Error("Database unavailable");
  await assertOwnedRoiProject(ownerId, patch.roiProjectId);
  await db.update(internalProjects).set(patch).where(and(eq(internalProjects.ownerId, ownerId), eq(internalProjects.id, id)));
  return getInternalProject(ownerId, id);
}

export async function listInternalProjectCapitalNeeds(ownerId: number, internalProjectId?: number) {
  const db = await getDb(); if (!db) return [];
  const condition = internalProjectId === undefined ? eq(internalProjectCapitalNeeds.ownerId, ownerId) : and(eq(internalProjectCapitalNeeds.ownerId, ownerId), eq(internalProjectCapitalNeeds.internalProjectId, internalProjectId));
  return db.select().from(internalProjectCapitalNeeds).where(condition).orderBy(internalProjectCapitalNeeds.sortOrder, internalProjectCapitalNeeds.createdAt);
}

export async function listInternalProjectCapitalNeedStrategies(ownerId: number, capitalNeedId?: number) {
  const db = await getDb(); if (!db) return [];
  const condition = capitalNeedId === undefined ? eq(internalProjectCapitalNeedStrategies.ownerId, ownerId) : and(eq(internalProjectCapitalNeedStrategies.ownerId, ownerId), eq(internalProjectCapitalNeedStrategies.capitalNeedId, capitalNeedId));
  return db.select().from(internalProjectCapitalNeedStrategies).where(condition);
}

export async function saveInternalProjectCapitalNeed(ownerId: number, input: CapitalNeedInput & { id?: number }) {
  const db = await getDb(); if (!db) throw new Error("Database unavailable");
  const project = await getInternalProject(ownerId, input.internalProjectId);
  if (!project) throw new Error("Internal Project not found for this workspace owner.");
  if (input.amountDataState !== "missing" && (input.amount === null || input.amount === undefined)) throw new Error("Record an amount before assigning an actual, projected, or estimated data state.");
  const { strategyTypes = [], id, ...values } = input;
  let capitalNeedId = id;
  if (id) {
    await db.update(internalProjectCapitalNeeds).set(values).where(and(eq(internalProjectCapitalNeeds.ownerId, ownerId), eq(internalProjectCapitalNeeds.id, id)));
  } else {
    const result = await db.insert(internalProjectCapitalNeeds).values({ ...values, ownerId });
    capitalNeedId = Number(result[0].insertId);
  }
  if (!capitalNeedId) throw new Error("Capital need could not be saved.");
  await db.delete(internalProjectCapitalNeedStrategies).where(and(eq(internalProjectCapitalNeedStrategies.ownerId, ownerId), eq(internalProjectCapitalNeedStrategies.capitalNeedId, capitalNeedId)));
  const deduplicated = Array.from(new Set(strategyTypes));
  if (deduplicated.length) await db.insert(internalProjectCapitalNeedStrategies).values(deduplicated.map((strategyType) => ({ ownerId, capitalNeedId: capitalNeedId!, strategyType })));
  const rows = await db.select().from(internalProjectCapitalNeeds).where(and(eq(internalProjectCapitalNeeds.ownerId, ownerId), eq(internalProjectCapitalNeeds.id, capitalNeedId))).limit(1);
  return rows[0];
}

export async function listInternalProjectDocumentLinks(ownerId: number, internalProjectId?: number) {
  const db = await getDb(); if (!db) return [];
  const condition = internalProjectId === undefined ? eq(internalProjectDocuments.ownerId, ownerId) : and(eq(internalProjectDocuments.ownerId, ownerId), eq(internalProjectDocuments.internalProjectId, internalProjectId));
  return db.select().from(internalProjectDocuments).where(condition);
}

export async function linkDocumentToInternalProject(ownerId: number, internalProjectId: number, documentId: number) {
  const db = await getDb(); if (!db) throw new Error("Database unavailable");
  const [project, documents] = await Promise.all([getInternalProject(ownerId, internalProjectId), db.select({ id: fundraisingDocuments.id }).from(fundraisingDocuments).where(and(eq(fundraisingDocuments.ownerId, ownerId), eq(fundraisingDocuments.id, documentId), eq(fundraisingDocuments.status, "current"))).limit(1)]);
  if (!project || !documents[0]) throw new Error("Internal Project or current document not found.");
  await db.insert(internalProjectDocuments).values({ ownerId, internalProjectId, documentId }).onDuplicateKeyUpdate({ set: { createdAt: new Date() } });
  return { success: true } as const;
}

export async function unlinkDocumentFromInternalProject(ownerId: number, internalProjectId: number, documentId: number) {
  const db = await getDb(); if (!db) throw new Error("Database unavailable");
  await db.delete(internalProjectDocuments).where(and(eq(internalProjectDocuments.ownerId, ownerId), eq(internalProjectDocuments.internalProjectId, internalProjectId), eq(internalProjectDocuments.documentId, documentId)));
  return { success: true } as const;
}

export async function getInternalProjectCapitalStack(ownerId: number, internalProjectId: number) {
  const project = await getInternalProject(ownerId, internalProjectId);
  if (!project) throw new Error("Internal Project not found for this workspace owner.");
  const [capitalNeeds, capitalNeedStrategies, opportunities] = await Promise.all([
    listInternalProjectCapitalNeeds(ownerId, internalProjectId),
    listInternalProjectCapitalNeedStrategies(ownerId),
    (async () => { const db = await getDb(); return db ? db.select().from(capitalOpportunities).where(eq(capitalOpportunities.ownerId, ownerId)) : []; })(),
  ]);
  return summarizeInternalProjectCapitalStack({ projectId: project.id, projectName: project.projectName, capitalRequirement: project.capitalRequirement, capitalNeeds, capitalNeedStrategies, opportunities });
}

import { and, desc, eq } from "drizzle-orm";
import { capitalOpportunities, equipmentActiveRentals, equipmentRentalQuotes, equipmentRentalRequirements, roiEquipmentReturnDetails, roiEquityReturnDetails, roiGrantReturnDetails, roiJvContributionComponents, roiJvReturnDetails, roiProjectCapitalSources, roiProjectCashFlows, roiProjectScenarios, roiProjects } from "../drizzle/schema";
import { getDb } from "./db";
import { summarizeCrossDomainRoi } from "../shared/crossDomainRoi";

type RoiProjectInput = Omit<typeof roiProjects.$inferInsert, "id" | "ownerId" | "createdAt" | "updatedAt">;
type RoiCapitalSourceInput = Omit<typeof roiProjectCapitalSources.$inferInsert, "id" | "ownerId" | "createdAt" | "updatedAt">;
type RoiCashFlowInput = Omit<typeof roiProjectCashFlows.$inferInsert, "id" | "ownerId" | "createdAt" | "updatedAt">;
type RoiScenarioInput = Omit<typeof roiProjectScenarios.$inferInsert, "id" | "ownerId" | "createdAt" | "updatedAt">;

export async function listRoiProjects(ownerId: number) {
  const db = await getDb(); if (!db) return [];
  return db.select().from(roiProjects).where(eq(roiProjects.ownerId, ownerId)).orderBy(desc(roiProjects.updatedAt));
}

export async function getRoiProject(ownerId: number, id: number) {
  const db = await getDb(); if (!db) return undefined;
  const rows = await db.select().from(roiProjects).where(and(eq(roiProjects.ownerId, ownerId), eq(roiProjects.id, id))).limit(1);
  return rows[0];
}

export async function getCrossDomainRoiSnapshot(ownerId: number, projectId: number) {
  const db = await getDb(); if (!db) throw new Error("Database unavailable");
  const project = await getRoiProject(ownerId, projectId);
  if (!project) throw new Error("ROI project not found.");
  const [sources, opportunities, rentalRequirements, rentalQuotes, activeRentals] = await Promise.all([
    db.select().from(roiProjectCapitalSources).where(and(eq(roiProjectCapitalSources.ownerId, ownerId), eq(roiProjectCapitalSources.projectId, projectId))),
    db.select().from(capitalOpportunities).where(eq(capitalOpportunities.ownerId, ownerId)),
    db.select().from(equipmentRentalRequirements).where(eq(equipmentRentalRequirements.ownerId, ownerId)),
    db.select().from(equipmentRentalQuotes).where(eq(equipmentRentalQuotes.ownerId, ownerId)),
    db.select().from(equipmentActiveRentals).where(eq(equipmentActiveRentals.ownerId, ownerId)),
  ]);
  return summarizeCrossDomainRoi({ project, sources, opportunities, rentalRequirements, rentalQuotes, activeRentals });
}

export async function createRoiProject(ownerId: number, project: RoiProjectInput) {
  const db = await getDb(); if (!db) throw new Error("Database unavailable");
  await db.insert(roiProjects).values({ ...project, ownerId });
  const rows = await db.select().from(roiProjects).where(and(eq(roiProjects.ownerId, ownerId), eq(roiProjects.projectName, project.projectName))).limit(1);
  return rows[0];
}

export async function updateRoiProject(ownerId: number, id: number, patch: Partial<RoiProjectInput>) {
  const db = await getDb(); if (!db) throw new Error("Database unavailable");
  await db.update(roiProjects).set(patch).where(and(eq(roiProjects.ownerId, ownerId), eq(roiProjects.id, id)));
  return getRoiProject(ownerId, id);
}

export async function listRoiCapitalSources(ownerId: number, projectId?: number) {
  const db = await getDb(); if (!db) return [];
  const condition = projectId === undefined ? eq(roiProjectCapitalSources.ownerId, ownerId) : and(eq(roiProjectCapitalSources.ownerId, ownerId), eq(roiProjectCapitalSources.projectId, projectId));
  return db.select().from(roiProjectCapitalSources).where(condition).orderBy(desc(roiProjectCapitalSources.updatedAt));
}

export async function getRoiCapitalSource(ownerId: number, id: number) {
  const db = await getDb(); if (!db) return undefined;
  const rows = await db.select().from(roiProjectCapitalSources).where(and(eq(roiProjectCapitalSources.ownerId, ownerId), eq(roiProjectCapitalSources.id, id))).limit(1);
  return rows[0];
}

export async function createRoiCapitalSource(ownerId: number, source: RoiCapitalSourceInput) {
  const db = await getDb(); if (!db) throw new Error("Database unavailable");
  if (!(await getRoiProject(ownerId, source.projectId))) throw new Error("ROI project not found.");
  const result = await db.insert(roiProjectCapitalSources).values({ ...source, ownerId });
  return getRoiCapitalSource(ownerId, Number(result[0].insertId));
}

export async function updateRoiCapitalSource(ownerId: number, id: number, patch: Partial<RoiCapitalSourceInput>) {
  const db = await getDb(); if (!db) throw new Error("Database unavailable");
  await db.update(roiProjectCapitalSources).set(patch).where(and(eq(roiProjectCapitalSources.ownerId, ownerId), eq(roiProjectCapitalSources.id, id)));
  return getRoiCapitalSource(ownerId, id);
}

export async function listRoiCashFlows(ownerId: number, projectId?: number) {
  const db = await getDb(); if (!db) return [];
  const condition = projectId === undefined ? eq(roiProjectCashFlows.ownerId, ownerId) : and(eq(roiProjectCashFlows.ownerId, ownerId), eq(roiProjectCashFlows.projectId, projectId));
  return db.select().from(roiProjectCashFlows).where(condition).orderBy(roiProjectCashFlows.monthIndex, roiProjectCashFlows.id);
}

export async function upsertRoiCashFlow(ownerId: number, flow: RoiCashFlowInput) {
  const db = await getDb(); if (!db) throw new Error("Database unavailable");
  if (!(await getRoiProject(ownerId, flow.projectId))) throw new Error("ROI project not found.");
  const flowType = flow.flowType ?? "forecast";
  await db.insert(roiProjectCashFlows).values({ ...flow, flowType, ownerId }).onDuplicateKeyUpdate({ set: { amount: flow.amount, notes: flow.notes } });
  const rows = await db.select().from(roiProjectCashFlows).where(and(eq(roiProjectCashFlows.ownerId, ownerId), eq(roiProjectCashFlows.projectId, flow.projectId), eq(roiProjectCashFlows.monthIndex, flow.monthIndex), eq(roiProjectCashFlows.flowType, flowType))).limit(1);
  return rows[0];
}

export async function listRoiScenarios(ownerId: number, projectId?: number) {
  const db = await getDb(); if (!db) return [];
  const condition = projectId === undefined ? eq(roiProjectScenarios.ownerId, ownerId) : and(eq(roiProjectScenarios.ownerId, ownerId), eq(roiProjectScenarios.projectId, projectId));
  return db.select().from(roiProjectScenarios).where(condition).orderBy(roiProjectScenarios.scenarioType, roiProjectScenarios.scenarioName);
}

export async function createRoiScenario(ownerId: number, scenario: RoiScenarioInput) {
  const db = await getDb(); if (!db) throw new Error("Database unavailable");
  if (!(await getRoiProject(ownerId, scenario.projectId))) throw new Error("ROI project not found.");
  await db.insert(roiProjectScenarios).values({ ...scenario, ownerId });
  const rows = await db.select().from(roiProjectScenarios).where(and(eq(roiProjectScenarios.ownerId, ownerId), eq(roiProjectScenarios.projectId, scenario.projectId), eq(roiProjectScenarios.scenarioName, scenario.scenarioName))).limit(1);
  return rows[0];
}

export async function updateRoiScenario(ownerId: number, id: number, patch: Partial<RoiScenarioInput>) {
  const db = await getDb(); if (!db) throw new Error("Database unavailable");
  await db.update(roiProjectScenarios).set(patch).where(and(eq(roiProjectScenarios.ownerId, ownerId), eq(roiProjectScenarios.id, id)));
  const rows = await db.select().from(roiProjectScenarios).where(and(eq(roiProjectScenarios.ownerId, ownerId), eq(roiProjectScenarios.id, id))).limit(1);
  return rows[0];
}

async function assertRoiCapitalSource(ownerId: number, capitalSourceId: number) {
  if (!(await getRoiCapitalSource(ownerId, capitalSourceId))) throw new Error("ROI capital source not found.");
}

export async function upsertRoiEquityReturnDetail(ownerId: number, capitalSourceId: number, patch: Omit<typeof roiEquityReturnDetails.$inferInsert, "id" | "ownerId" | "capitalSourceId" | "createdAt" | "updatedAt">) {
  const db = await getDb(); if (!db) throw new Error("Database unavailable"); await assertRoiCapitalSource(ownerId, capitalSourceId);
  await db.insert(roiEquityReturnDetails).values({ ownerId, capitalSourceId, ...patch }).onDuplicateKeyUpdate({ set: patch });
  return (await db.select().from(roiEquityReturnDetails).where(and(eq(roiEquityReturnDetails.ownerId, ownerId), eq(roiEquityReturnDetails.capitalSourceId, capitalSourceId))).limit(1))[0];
}

export async function upsertRoiJvReturnDetail(ownerId: number, capitalSourceId: number, patch: Omit<typeof roiJvReturnDetails.$inferInsert, "id" | "ownerId" | "capitalSourceId" | "createdAt" | "updatedAt">) {
  const db = await getDb(); if (!db) throw new Error("Database unavailable"); await assertRoiCapitalSource(ownerId, capitalSourceId);
  await db.insert(roiJvReturnDetails).values({ ownerId, capitalSourceId, ...patch }).onDuplicateKeyUpdate({ set: patch });
  return (await db.select().from(roiJvReturnDetails).where(and(eq(roiJvReturnDetails.ownerId, ownerId), eq(roiJvReturnDetails.capitalSourceId, capitalSourceId))).limit(1))[0];
}

export async function listRoiJvContributionComponents(ownerId: number, capitalSourceId?: number) {
  const db = await getDb(); if (!db) return [];
  const condition = capitalSourceId === undefined ? eq(roiJvContributionComponents.ownerId, ownerId) : and(eq(roiJvContributionComponents.ownerId, ownerId), eq(roiJvContributionComponents.capitalSourceId, capitalSourceId));
  return db.select().from(roiJvContributionComponents).where(condition).orderBy(roiJvContributionComponents.contributor, roiJvContributionComponents.componentType);
}

export async function createRoiJvContributionComponent(ownerId: number, component: Omit<typeof roiJvContributionComponents.$inferInsert, "id" | "ownerId" | "createdAt" | "updatedAt">) {
  const db = await getDb(); if (!db) throw new Error("Database unavailable"); await assertRoiCapitalSource(ownerId, component.capitalSourceId);
  const result = await db.insert(roiJvContributionComponents).values({ ...component, ownerId });
  const rows = await db.select().from(roiJvContributionComponents).where(and(eq(roiJvContributionComponents.ownerId, ownerId), eq(roiJvContributionComponents.id, Number(result[0].insertId)))).limit(1);
  return rows[0];
}

export async function updateRoiJvContributionComponent(ownerId: number, id: number, patch: Partial<Omit<typeof roiJvContributionComponents.$inferInsert, "id" | "ownerId" | "createdAt" | "updatedAt">>) {
  const db = await getDb(); if (!db) throw new Error("Database unavailable");
  await db.update(roiJvContributionComponents).set(patch).where(and(eq(roiJvContributionComponents.ownerId, ownerId), eq(roiJvContributionComponents.id, id)));
  const rows = await db.select().from(roiJvContributionComponents).where(and(eq(roiJvContributionComponents.ownerId, ownerId), eq(roiJvContributionComponents.id, id))).limit(1);
  return rows[0];
}

export async function upsertRoiEquipmentReturnDetail(ownerId: number, capitalSourceId: number, patch: Omit<typeof roiEquipmentReturnDetails.$inferInsert, "id" | "ownerId" | "capitalSourceId" | "createdAt" | "updatedAt">) {
  const db = await getDb(); if (!db) throw new Error("Database unavailable"); await assertRoiCapitalSource(ownerId, capitalSourceId);
  await db.insert(roiEquipmentReturnDetails).values({ ownerId, capitalSourceId, ...patch }).onDuplicateKeyUpdate({ set: patch });
  return (await db.select().from(roiEquipmentReturnDetails).where(and(eq(roiEquipmentReturnDetails.ownerId, ownerId), eq(roiEquipmentReturnDetails.capitalSourceId, capitalSourceId))).limit(1))[0];
}

export async function upsertRoiGrantReturnDetail(ownerId: number, capitalSourceId: number, patch: Omit<typeof roiGrantReturnDetails.$inferInsert, "id" | "ownerId" | "capitalSourceId" | "createdAt" | "updatedAt">) {
  const db = await getDb(); if (!db) throw new Error("Database unavailable"); await assertRoiCapitalSource(ownerId, capitalSourceId);
  await db.insert(roiGrantReturnDetails).values({ ownerId, capitalSourceId, ...patch }).onDuplicateKeyUpdate({ set: patch });
  return (await db.select().from(roiGrantReturnDetails).where(and(eq(roiGrantReturnDetails.ownerId, ownerId), eq(roiGrantReturnDetails.capitalSourceId, capitalSourceId))).limit(1))[0];
}

export async function listRoiReturnDetails(ownerId: number) {
  const db = await getDb(); if (!db) return { equity: [], jv: [], equipment: [], grants: [] };
  const [equity, jv, equipment, grants] = await Promise.all([
    db.select().from(roiEquityReturnDetails).where(eq(roiEquityReturnDetails.ownerId, ownerId)),
    db.select().from(roiJvReturnDetails).where(eq(roiJvReturnDetails.ownerId, ownerId)),
    db.select().from(roiEquipmentReturnDetails).where(eq(roiEquipmentReturnDetails.ownerId, ownerId)),
    db.select().from(roiGrantReturnDetails).where(eq(roiGrantReturnDetails.ownerId, ownerId)),
  ]);
  return { equity, jv, equipment, grants };
}

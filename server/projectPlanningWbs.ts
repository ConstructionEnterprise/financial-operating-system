import { and, asc, eq } from "drizzle-orm";
import { internalProjects, projectEconomicsModels, projectPlanningWbsLines, projectProjectionScenarios } from "../drizzle/schema";
import { assertCedarwoodHistoricalPlanningWbs, cedarwoodHistoricalPlanningOwner, cedarwoodHistoricalPlanningSource, cedarwoodHistoricalPlanningWbs } from "../shared/cedarwoodHistoricalPlanning";
import { historicalPlanningMarker } from "../shared/historicalPlanning";
import { getDb } from "./db";

async function getOwnedScenarioContext(ownerId: number, scenarioId: number) {
  const db = await getDb();
  if (!db) return null;
  const rows = await db.select({ scenarioId: projectProjectionScenarios.id, internalProjectId: projectEconomicsModels.internalProjectId, scenarioNotes: projectProjectionScenarios.notes, projectName: internalProjects.projectName }).from(projectProjectionScenarios).innerJoin(projectEconomicsModels, eq(projectEconomicsModels.id, projectProjectionScenarios.modelId)).innerJoin(internalProjects, eq(internalProjects.id, projectEconomicsModels.internalProjectId)).where(and(eq(projectProjectionScenarios.ownerId, ownerId), eq(projectProjectionScenarios.id, scenarioId), eq(projectEconomicsModels.ownerId, ownerId), eq(internalProjects.ownerId, ownerId))).limit(1);
  return rows[0] ?? null;
}

export async function listProjectPlanningWbsLines(ownerId: number, scenarioId?: number) {
  const db = await getDb();
  if (!db) return [];
  const condition = scenarioId === undefined ? eq(projectPlanningWbsLines.ownerId, ownerId) : and(eq(projectPlanningWbsLines.ownerId, ownerId), eq(projectPlanningWbsLines.projectionScenarioId, scenarioId));
  return db.select().from(projectPlanningWbsLines).where(condition).orderBy(asc(projectPlanningWbsLines.sortOrder), asc(projectPlanningWbsLines.wbsCode));
}

export async function getProjectPlanningWbsSummary(ownerId: number, scenarioId: number) {
  const [context, lines] = await Promise.all([getOwnedScenarioContext(ownerId, scenarioId), listProjectPlanningWbsLines(ownerId, scenarioId)]);
  if (!context) throw new Error("Projection scenario not found for this workspace owner.");
  const total = lines.reduce((sum, line) => sum + line.allocatedAmount, 0);
  const byCategory = Object.values(lines.reduce<Record<string, { costCategory: string; amount: number; lineCount: number }>>((groups, line) => {
    const group = groups[line.costCategory] ?? { costCategory: line.costCategory, amount: 0, lineCount: 0 };
    group.amount += line.allocatedAmount; group.lineCount += 1; groups[line.costCategory] = group; return groups;
  }, {}));
  return { context, lineCount: lines.length, total, byCategory, lines };
}

export async function seedCedarwoodHistoricalPlanningWbs(ownerId: number, scenarioId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  const context = await getOwnedScenarioContext(ownerId, scenarioId);
  if (!context || context.projectName !== "Cedarwood Flats" || !context.scenarioNotes?.includes(historicalPlanningMarker)) throw new Error("Cedarwood historical planning WBS may only be seeded into its owned historical planning scenario.");
  assertCedarwoodHistoricalPlanningWbs();
  for (let index = 0; index < cedarwoodHistoricalPlanningWbs.length; index += 1) {
    const line = cedarwoodHistoricalPlanningWbs[index]!;
    await db.insert(projectPlanningWbsLines).values({ ownerId, internalProjectId: context.internalProjectId, projectionScenarioId: scenarioId, ...line, dataState: "estimated", sourceClassification: "reverse_engineered_allocation", sourceReference: cedarwoodHistoricalPlanningSource, effectiveAt: null, ownerName: cedarwoodHistoricalPlanningOwner, sortOrder: index + 1 }).onDuplicateKeyUpdate({ set: { description: line.description, costCategory: line.costCategory, phase: line.phase, buildingApplicability: line.buildingApplicability, quantity: line.quantity, quantityUnit: line.quantityUnit, unitCost: line.unitCost, allocatedAmount: line.allocatedAmount, dataState: "estimated", sourceClassification: "reverse_engineered_allocation", sourceReference: cedarwoodHistoricalPlanningSource, effectiveAt: null, ownerName: cedarwoodHistoricalPlanningOwner, notes: line.notes, sortOrder: index + 1 } });
  }
  return getProjectPlanningWbsSummary(ownerId, scenarioId);
}

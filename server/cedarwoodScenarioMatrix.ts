import { and, asc, eq } from "drizzle-orm";
import { internalProjects, projectEconomicsModels, projectPlanningFinancingTerms, projectPlanningScheduleMonths, projectPlanningWbsLines, projectProjectionAssumptions, projectProjectionScenarios, projectProjectionUnitMixes } from "../drizzle/schema";
import { buildCedarwoodScenarioMatrix, type CedarwoodScenarioMatrixInput } from "../shared/cedarwoodScenarioMatrix";
import { getDb } from "./db";

export type CedarwoodUnitMixInput = {
  scenarioId: number; unitType: string; unitCount: number; averageSqFt?: number | null; monthlyRent?: number | null;
  dataState: "projected" | "estimated"; sourceReference: string; effectiveAt?: Date | null; ownerName: string; notes?: string;
};

async function getOwnedCedarwoodScenario(ownerId: number, scenarioId: number) {
  const db = await getDb(); if (!db) return null;
  const rows = await db.select({ id: projectProjectionScenarios.id, modelId: projectProjectionScenarios.modelId, projectName: internalProjects.projectName, internalProjectId: internalProjects.id }).from(projectProjectionScenarios).innerJoin(projectEconomicsModels, eq(projectEconomicsModels.id, projectProjectionScenarios.modelId)).innerJoin(internalProjects, eq(internalProjects.id, projectEconomicsModels.internalProjectId)).where(and(eq(projectProjectionScenarios.ownerId, ownerId), eq(projectProjectionScenarios.id, scenarioId), eq(projectEconomicsModels.ownerId, ownerId), eq(internalProjects.ownerId, ownerId))).limit(1);
  return rows[0]?.projectName === "Cedarwood Flats" ? rows[0] : null;
}

export async function listCedarwoodScenarioUnitMix(ownerId: number, scenarioId: number) {
  const db = await getDb(); if (!db) return [];
  return db.select().from(projectProjectionUnitMixes).where(and(eq(projectProjectionUnitMixes.ownerId, ownerId), eq(projectProjectionUnitMixes.scenarioId, scenarioId))).orderBy(asc(projectProjectionUnitMixes.unitType));
}

export async function saveCedarwoodScenarioUnitMix(ownerId: number, input: CedarwoodUnitMixInput) {
  const db = await getDb(); if (!db) throw new Error("Database unavailable");
  if (!await getOwnedCedarwoodScenario(ownerId, input.scenarioId)) throw new Error("Unit mix may only be saved to an owned Cedarwood scenario.");
  if (!input.sourceReference.trim() || !input.ownerName.trim()) throw new Error("Unit-mix drivers require a source reference and owner.");
  await db.insert(projectProjectionUnitMixes).values({ ...input, ownerId, averageSqFt: input.averageSqFt ?? null, monthlyRent: input.monthlyRent ?? null, sourceReference: input.sourceReference.trim(), ownerName: input.ownerName.trim(), effectiveAt: input.effectiveAt ?? null, notes: input.notes?.trim() || null }).onDuplicateKeyUpdate({ set: { unitCount: input.unitCount, averageSqFt: input.averageSqFt ?? null, monthlyRent: input.monthlyRent ?? null, dataState: input.dataState, sourceReference: input.sourceReference.trim(), ownerName: input.ownerName.trim(), effectiveAt: input.effectiveAt ?? null, notes: input.notes?.trim() || null } });
  return listCedarwoodScenarioUnitMix(ownerId, input.scenarioId);
}

export async function getCedarwoodScenarioMatrix(ownerId: number, modelId: number) {
  const db = await getDb(); if (!db) return [];
  const ownedModel = await db.select({ id: projectEconomicsModels.id, projectName: internalProjects.projectName }).from(projectEconomicsModels).innerJoin(internalProjects, eq(internalProjects.id, projectEconomicsModels.internalProjectId)).where(and(eq(projectEconomicsModels.ownerId, ownerId), eq(projectEconomicsModels.id, modelId), eq(internalProjects.ownerId, ownerId))).limit(1);
  if (ownedModel[0]?.projectName !== "Cedarwood Flats") throw new Error("Scenario matrix is only available for Cedarwood Flats.");
  const [scenarios, assumptions, unitMix, schedules, financing, wbs] = await Promise.all([
    db.select().from(projectProjectionScenarios).where(and(eq(projectProjectionScenarios.ownerId, ownerId), eq(projectProjectionScenarios.modelId, modelId))).orderBy(asc(projectProjectionScenarios.id)),
    db.select().from(projectProjectionAssumptions).where(eq(projectProjectionAssumptions.ownerId, ownerId)),
    db.select().from(projectProjectionUnitMixes).where(eq(projectProjectionUnitMixes.ownerId, ownerId)),
    db.select().from(projectPlanningScheduleMonths).where(eq(projectPlanningScheduleMonths.ownerId, ownerId)),
    db.select().from(projectPlanningFinancingTerms).where(eq(projectPlanningFinancingTerms.ownerId, ownerId)),
    db.select().from(projectPlanningWbsLines).where(eq(projectPlanningWbsLines.ownerId, ownerId)),
  ]);
  const inputs: CedarwoodScenarioMatrixInput[] = scenarios.map((scenario) => ({
    id: scenario.id, scenarioName: scenario.scenarioName, scenarioType: scenario.scenarioType, scenarioStatus: scenario.scenarioStatus, notes: scenario.notes,
    assumptions: assumptions.filter((item) => item.scenarioId === scenario.id), unitMix: unitMix.filter((item) => item.scenarioId === scenario.id),
    schedule: schedules.filter((item) => item.projectionScenarioId === scenario.id), financing: financing.find((item) => item.projectionScenarioId === scenario.id) ?? null,
    wbsTotal: wbs.filter((item) => item.projectionScenarioId === scenario.id).reduce((sum, item) => sum + item.allocatedAmount, 0),
  }));
  return buildCedarwoodScenarioMatrix(inputs);
}

export async function cloneCedarwoodScenario(ownerId: number, sourceScenarioId: number, scenarioName: string) {
  const db = await getDb(); if (!db) throw new Error("Database unavailable");
  const source = await getOwnedCedarwoodScenario(ownerId, sourceScenarioId);
  if (!source) throw new Error("A Cedarwood scenario is required as the source for a new model case.");
  const result = await db.insert(projectProjectionScenarios).values({ ownerId, modelId: source.modelId, scenarioName, scenarioType: "custom", scenarioStatus: "draft", notes: `SCENARIO MATRIX CLONE | Source scenario ${sourceScenarioId}. Values remain scenario-isolated; replace any inherited planning driver with its own source when available.` });
  const scenarioId = Number(result[0].insertId);
  const [assumptions, unitMix, schedule, financing] = await Promise.all([
    db.select().from(projectProjectionAssumptions).where(and(eq(projectProjectionAssumptions.ownerId, ownerId), eq(projectProjectionAssumptions.scenarioId, sourceScenarioId))),
    db.select().from(projectProjectionUnitMixes).where(and(eq(projectProjectionUnitMixes.ownerId, ownerId), eq(projectProjectionUnitMixes.scenarioId, sourceScenarioId))),
    db.select().from(projectPlanningScheduleMonths).where(and(eq(projectPlanningScheduleMonths.ownerId, ownerId), eq(projectPlanningScheduleMonths.projectionScenarioId, sourceScenarioId))),
    db.select().from(projectPlanningFinancingTerms).where(and(eq(projectPlanningFinancingTerms.ownerId, ownerId), eq(projectPlanningFinancingTerms.projectionScenarioId, sourceScenarioId))).limit(1),
  ]);
  for (const item of assumptions) await db.insert(projectProjectionAssumptions).values({ ownerId, scenarioId, assumptionCategory: item.assumptionCategory, metric: item.metric, value: item.value, valueUnit: item.valueUnit, periodStartMonth: item.periodStartMonth, periodEndMonth: item.periodEndMonth, dataState: item.dataState, sourceReference: item.sourceReference, effectiveAt: item.effectiveAt, ownerName: item.ownerName, notes: `${item.notes || ""} Inherited from Cedarwood scenario ${sourceScenarioId}; review before relying on this case.`.trim(), sortOrder: item.sortOrder });
  for (const item of unitMix) await db.insert(projectProjectionUnitMixes).values({ ownerId, scenarioId, unitType: item.unitType, unitCount: item.unitCount, averageSqFt: item.averageSqFt, monthlyRent: item.monthlyRent, dataState: item.dataState, sourceReference: item.sourceReference, effectiveAt: item.effectiveAt, ownerName: item.ownerName, notes: `${item.notes || ""} Inherited from Cedarwood scenario ${sourceScenarioId}; review before relying on this case.`.trim() });
  for (const item of schedule) await db.insert(projectPlanningScheduleMonths).values({ ownerId, internalProjectId: source.internalProjectId, projectionScenarioId: scenarioId, monthIndex: item.monthIndex, phase: item.phase, constructionSpendBps: item.constructionSpendBps, occupancyBps: item.occupancyBps, dataState: item.dataState, sourceReference: item.sourceReference, effectiveAt: item.effectiveAt, ownerName: item.ownerName, notes: `${item.notes || ""} Inherited from Cedarwood scenario ${sourceScenarioId}; review before relying on this case.`.trim() });
  if (financing[0]) {
    const item = financing[0];
    await db.insert(projectPlanningFinancingTerms).values({ ownerId, internalProjectId: source.internalProjectId, projectionScenarioId: scenarioId, loanAmount: item.loanAmount, annualInterestRateBps: item.annualInterestRateBps, financingFeeBps: item.financingFeeBps, termMonths: item.termMonths, amortizationMonths: item.amortizationMonths, interestOnlyMonths: item.interestOnlyMonths, closingMonth: item.closingMonth, dataState: item.dataState, sourceReference: item.sourceReference, effectiveAt: item.effectiveAt, ownerName: item.ownerName, notes: `${item.notes || ""} Inherited from Cedarwood scenario ${sourceScenarioId}; review before relying on this case.`.trim() });
  }
  const rows = await db.select().from(projectProjectionScenarios).where(and(eq(projectProjectionScenarios.ownerId, ownerId), eq(projectProjectionScenarios.id, scenarioId))).limit(1);
  return rows[0];
}

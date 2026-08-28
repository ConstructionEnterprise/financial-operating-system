import { and, asc, eq } from "drizzle-orm";
import { internalProjects, projectEconomicsModels, projectPlanningFinancingTerms, projectPlanningScheduleMonths, projectProjectionScenarios } from "../drizzle/schema";
import { calculateCedarwoodDevelopmentCashFlow, type CedarwoodFinancingTerms, type CedarwoodScheduleRow } from "../shared/cedarwoodScheduleFinancing";
import { getDb } from "./db";
import { getProjectPlanningWbsSummary } from "./projectPlanningWbs";

type ScheduleSaveInput = { scenarioId: number; sourceReference: string; effectiveAt?: Date | null; ownerName: string; dataState: "projected" | "estimated"; notes?: string; rows: Array<CedarwoodScheduleRow> };
type FinancingSaveInput = CedarwoodFinancingTerms & { scenarioId: number; sourceReference: string; effectiveAt?: Date | null; ownerName: string; dataState: "projected" | "estimated"; notes?: string };

async function getCedarwoodScenarioContext(ownerId: number, scenarioId: number) {
  const db = await getDb();
  if (!db) return null;
  const rows = await db.select({ scenarioId: projectProjectionScenarios.id, projectName: internalProjects.projectName, internalProjectId: internalProjects.id, horizonMonths: projectEconomicsModels.horizonMonths, scenarioNotes: projectProjectionScenarios.notes }).from(projectProjectionScenarios).innerJoin(projectEconomicsModels, eq(projectEconomicsModels.id, projectProjectionScenarios.modelId)).innerJoin(internalProjects, eq(internalProjects.id, projectEconomicsModels.internalProjectId)).where(and(eq(projectProjectionScenarios.ownerId, ownerId), eq(projectProjectionScenarios.id, scenarioId), eq(projectEconomicsModels.ownerId, ownerId), eq(internalProjects.ownerId, ownerId))).limit(1);
  const context = rows[0] ?? null;
  if (!context || context.projectName !== "Cedarwood Flats") return null;
  return context;
}

export async function listProjectPlanningScheduleMonths(ownerId: number, scenarioId: number) {
  const db = await getDb(); if (!db) return [];
  return db.select().from(projectPlanningScheduleMonths).where(and(eq(projectPlanningScheduleMonths.ownerId, ownerId), eq(projectPlanningScheduleMonths.projectionScenarioId, scenarioId))).orderBy(asc(projectPlanningScheduleMonths.monthIndex));
}

export async function getProjectPlanningFinancingTerms(ownerId: number, scenarioId: number) {
  const db = await getDb(); if (!db) return null;
  const rows = await db.select().from(projectPlanningFinancingTerms).where(and(eq(projectPlanningFinancingTerms.ownerId, ownerId), eq(projectPlanningFinancingTerms.projectionScenarioId, scenarioId))).limit(1);
  return rows[0] ?? null;
}

export async function saveProjectPlanningScheduleMonths(ownerId: number, input: ScheduleSaveInput) {
  const db = await getDb(); if (!db) throw new Error("Database unavailable");
  const context = await getCedarwoodScenarioContext(ownerId, input.scenarioId); if (!context) throw new Error("Schedule may only be saved to an owned Cedarwood scenario.");
  if (!input.sourceReference.trim() || !input.ownerName.trim()) throw new Error("Schedule inputs require source reference and owner.");
  const monthIndexes = new Set<number>();
  for (const row of input.rows) {
    if (row.monthIndex < 1 || row.monthIndex > context.horizonMonths || monthIndexes.has(row.monthIndex)) throw new Error(`Schedule months must be unique between 1 and ${context.horizonMonths}.`);
    if (!row.phase) throw new Error("Each saved schedule month requires a lifecycle phase.");
    if (row.constructionSpendBps !== null && (row.constructionSpendBps < 0 || row.constructionSpendBps > 10_000)) throw new Error("Construction allocation must be between 0% and 100%.");
    if (row.occupancyBps !== null && (row.occupancyBps < 0 || row.occupancyBps > 10_000)) throw new Error("Occupancy must be between 0% and 100%.");
    monthIndexes.add(row.monthIndex);
    await db.insert(projectPlanningScheduleMonths).values({ ownerId, internalProjectId: context.internalProjectId, projectionScenarioId: input.scenarioId, monthIndex: row.monthIndex, phase: row.phase as any, constructionSpendBps: row.constructionSpendBps, occupancyBps: row.occupancyBps, dataState: input.dataState, sourceReference: input.sourceReference.trim(), effectiveAt: input.effectiveAt ?? null, ownerName: input.ownerName.trim(), notes: input.notes?.trim() || null }).onDuplicateKeyUpdate({ set: { phase: row.phase as any, constructionSpendBps: row.constructionSpendBps, occupancyBps: row.occupancyBps, dataState: input.dataState, sourceReference: input.sourceReference.trim(), effectiveAt: input.effectiveAt ?? null, ownerName: input.ownerName.trim(), notes: input.notes?.trim() || null } });
  }
  return listProjectPlanningScheduleMonths(ownerId, input.scenarioId);
}

export async function saveProjectPlanningFinancingTerms(ownerId: number, input: FinancingSaveInput) {
  const db = await getDb(); if (!db) throw new Error("Database unavailable");
  const context = await getCedarwoodScenarioContext(ownerId, input.scenarioId); if (!context) throw new Error("Financing terms may only be saved to an owned Cedarwood scenario.");
  if (!input.sourceReference.trim() || !input.ownerName.trim()) throw new Error("Financing terms require source reference and owner.");
  const validation = calculateCedarwoodDevelopmentCashFlow({ totalDevelopmentCost: 1, rows: Array.from({ length: context.horizonMonths }, (_, index) => ({ monthIndex: index + 1, phase: "construction", constructionSpendBps: index === 0 ? 10_000 : 0, occupancyBps: 0 })), terms: input, horizonMonths: context.horizonMonths }).financing;
  if (!validation.complete) throw new Error(validation.reasons.join(" "));
  await db.insert(projectPlanningFinancingTerms).values({ ownerId, internalProjectId: context.internalProjectId, projectionScenarioId: input.scenarioId, loanAmount: input.loanAmount, annualInterestRateBps: input.annualInterestRateBps, financingFeeBps: input.financingFeeBps ?? null, termMonths: input.termMonths, amortizationMonths: input.amortizationMonths, interestOnlyMonths: input.interestOnlyMonths, closingMonth: input.closingMonth, dataState: input.dataState, sourceReference: input.sourceReference.trim(), effectiveAt: input.effectiveAt ?? null, ownerName: input.ownerName.trim(), notes: input.notes?.trim() || null }).onDuplicateKeyUpdate({ set: { loanAmount: input.loanAmount, annualInterestRateBps: input.annualInterestRateBps, financingFeeBps: input.financingFeeBps ?? null, termMonths: input.termMonths, amortizationMonths: input.amortizationMonths, interestOnlyMonths: input.interestOnlyMonths, closingMonth: input.closingMonth, dataState: input.dataState, sourceReference: input.sourceReference.trim(), effectiveAt: input.effectiveAt ?? null, ownerName: input.ownerName.trim(), notes: input.notes?.trim() || null } });
  return getProjectPlanningFinancingTerms(ownerId, input.scenarioId);
}

export async function getCedarwoodScheduleFinancingSnapshot(ownerId: number, scenarioId: number) {
  const context = await getCedarwoodScenarioContext(ownerId, scenarioId); if (!context) throw new Error("Cedarwood historical planning scenario not found for this workspace owner.");
  const [scheduleMonths, financingTerms, wbs] = await Promise.all([listProjectPlanningScheduleMonths(ownerId, scenarioId), getProjectPlanningFinancingTerms(ownerId, scenarioId), getProjectPlanningWbsSummary(ownerId, scenarioId)]);
  const calculation = calculateCedarwoodDevelopmentCashFlow({ totalDevelopmentCost: wbs.total, rows: scheduleMonths, terms: financingTerms, horizonMonths: context.horizonMonths });
  return { context, wbsTotal: wbs.total, scheduleMonths, financingTerms, calculation };
}

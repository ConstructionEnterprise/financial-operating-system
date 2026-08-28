import { and, asc, eq } from "drizzle-orm";
import { internalProjects, projectEconomicsModels, projectPlanningScheduleMonths, projectPlanningWbsLines, projectProjectionAssumptions, projectProjectionMonthlyLines, projectProjectionScenarios } from "../drizzle/schema";
import { calculateProjectionComparison, calculateProjectionScenarioSnapshot } from "../shared/projections";
import { buildHistoricalPlanningComparison } from "../shared/historicalPlanning";
import { getDb } from "./db";

type ScenarioInput = Omit<typeof projectProjectionScenarios.$inferInsert, "id" | "ownerId" | "createdAt" | "updatedAt">;
type AssumptionInput = Omit<typeof projectProjectionAssumptions.$inferInsert, "id" | "ownerId" | "createdAt" | "updatedAt">;
type MonthlyLineInput = Omit<typeof projectProjectionMonthlyLines.$inferInsert, "id" | "ownerId" | "createdAt" | "updatedAt" | "deploymentCategory"> & { deploymentCategory?: "land_site" | "building" | "furniture_fixtures_equipment" | "equipment" | "robotics_automation" | "technology" | "soft_costs" | "contingency" | "working_capital" | "other" | null };

async function getOwnedModel(ownerId: number, modelId: number) {
  const db = await getDb(); if (!db) return undefined;
  const rows = await db.select().from(projectEconomicsModels).where(and(eq(projectEconomicsModels.ownerId, ownerId), eq(projectEconomicsModels.id, modelId))).limit(1);
  return rows[0];
}

async function getOwnedScenario(ownerId: number, scenarioId: number) {
  const db = await getDb(); if (!db) return undefined;
  const rows = await db.select().from(projectProjectionScenarios).where(and(eq(projectProjectionScenarios.ownerId, ownerId), eq(projectProjectionScenarios.id, scenarioId))).limit(1);
  return rows[0];
}

export async function listProjectionScenarios(ownerId: number, modelId?: number) {
  const db = await getDb(); if (!db) return [];
  const condition = modelId === undefined ? eq(projectProjectionScenarios.ownerId, ownerId) : and(eq(projectProjectionScenarios.ownerId, ownerId), eq(projectProjectionScenarios.modelId, modelId));
  return db.select().from(projectProjectionScenarios).where(condition).orderBy(asc(projectProjectionScenarios.scenarioType), asc(projectProjectionScenarios.id));
}

export async function ensureProjectionScenarioShells(ownerId: number, modelId: number) {
  const db = await getDb(); if (!db) throw new Error("Database unavailable");
  if (!await getOwnedModel(ownerId, modelId)) throw new Error("Project-economics model not found for this workspace owner.");
  const templates = [{ scenarioName: "Downside Case", scenarioType: "downside" as const }, { scenarioName: "Base Case", scenarioType: "base" as const }, { scenarioName: "Upside Case", scenarioType: "upside" as const }];
  for (const template of templates) await db.insert(projectProjectionScenarios).values({ ownerId, modelId, ...template, scenarioStatus: "draft" }).onDuplicateKeyUpdate({ set: { scenarioStatus: "draft" } });
  return listProjectionScenarios(ownerId, modelId);
}

export async function createProjectionScenario(ownerId: number, input: ScenarioInput) {
  const db = await getDb(); if (!db) throw new Error("Database unavailable");
  if (!await getOwnedModel(ownerId, input.modelId)) throw new Error("Project-economics model not found for this workspace owner.");
  const result = await db.insert(projectProjectionScenarios).values({ ...input, ownerId });
  const rows = await db.select().from(projectProjectionScenarios).where(and(eq(projectProjectionScenarios.ownerId, ownerId), eq(projectProjectionScenarios.id, Number(result[0].insertId)))).limit(1);
  return rows[0];
}

export async function updateProjectionScenario(ownerId: number, scenarioId: number, patch: Partial<ScenarioInput>) {
  const db = await getDb(); if (!db) throw new Error("Database unavailable");
  if (!await getOwnedScenario(ownerId, scenarioId)) throw new Error("Projection scenario not found for this workspace owner.");
  await db.update(projectProjectionScenarios).set(patch).where(and(eq(projectProjectionScenarios.ownerId, ownerId), eq(projectProjectionScenarios.id, scenarioId)));
  const rows = await db.select().from(projectProjectionScenarios).where(and(eq(projectProjectionScenarios.ownerId, ownerId), eq(projectProjectionScenarios.id, scenarioId))).limit(1);
  return rows[0];
}

export async function listProjectionAssumptions(ownerId: number, scenarioId?: number) {
  const db = await getDb(); if (!db) return [];
  const condition = scenarioId === undefined ? eq(projectProjectionAssumptions.ownerId, ownerId) : and(eq(projectProjectionAssumptions.ownerId, ownerId), eq(projectProjectionAssumptions.scenarioId, scenarioId));
  return db.select().from(projectProjectionAssumptions).where(condition).orderBy(asc(projectProjectionAssumptions.sortOrder), asc(projectProjectionAssumptions.id));
}

export async function saveProjectionAssumption(ownerId: number, input: AssumptionInput & { id?: number }) {
  const db = await getDb(); if (!db) throw new Error("Database unavailable");
  if (!await getOwnedScenario(ownerId, input.scenarioId)) throw new Error("Projection scenario not found for this workspace owner.");
  if (input.value === null || input.value === undefined) throw new Error("Projection assumptions require a value. Leave the assumption unrecorded until a supported value exists.");
  if (input.periodStartMonth && input.periodEndMonth && input.periodStartMonth > input.periodEndMonth) throw new Error("Assumption period start cannot be after its period end.");
  const { id, ...values } = input; let assumptionId = id;
  if (id) await db.update(projectProjectionAssumptions).set(values).where(and(eq(projectProjectionAssumptions.ownerId, ownerId), eq(projectProjectionAssumptions.id, id)));
  else { const result = await db.insert(projectProjectionAssumptions).values({ ...values, ownerId }); assumptionId = Number(result[0].insertId); }
  const rows = await db.select().from(projectProjectionAssumptions).where(and(eq(projectProjectionAssumptions.ownerId, ownerId), eq(projectProjectionAssumptions.id, assumptionId!))).limit(1);
  return rows[0];
}

export async function listProjectionMonthlyLines(ownerId: number, scenarioId?: number) {
  const db = await getDb(); if (!db) return [];
  const condition = scenarioId === undefined ? eq(projectProjectionMonthlyLines.ownerId, ownerId) : and(eq(projectProjectionMonthlyLines.ownerId, ownerId), eq(projectProjectionMonthlyLines.scenarioId, scenarioId));
  return db.select().from(projectProjectionMonthlyLines).where(condition).orderBy(asc(projectProjectionMonthlyLines.monthIndex), asc(projectProjectionMonthlyLines.metricCategory));
}

export async function saveProjectionMonthlyLine(ownerId: number, input: MonthlyLineInput) {
  const db = await getDb(); if (!db) throw new Error("Database unavailable");
  const scenario = await getOwnedScenario(ownerId, input.scenarioId); if (!scenario) throw new Error("Projection scenario not found for this workspace owner.");
  const model = await getOwnedModel(ownerId, scenario.modelId); if (!model) throw new Error("Project-economics model not found for this projection scenario.");
  if (input.monthIndex < 1 || input.monthIndex > model.horizonMonths) throw new Error(`Month must be between 1 and ${model.horizonMonths}.`);
  if (input.amount === null || input.amount === undefined) throw new Error("Projection lines require an amount. Do not substitute zero for a missing value.");
  const positiveMetrics = ["revenue", "funding_draw", "ce_distribution"] as const;
  const negativeMetrics = ["operating_cost", "capital_deployment", "financing_cost", "ce_capital_contribution"] as const;
  if (positiveMetrics.includes(input.metricCategory as typeof positiveMetrics[number]) && input.amount < 0) throw new Error("Revenue, funding draw, and CE distribution amounts must be positive or zero.");
  if (negativeMetrics.includes(input.metricCategory as typeof negativeMetrics[number]) && input.amount > 0) throw new Error("Operating cost, capital deployment, financing cost, and CE capital contribution amounts must be negative or zero.");
  if (input.metricCategory === "capital_deployment" && !input.deploymentCategory) throw new Error("Capital deployment lines require a deployment category.");
  if (input.metricCategory !== "capital_deployment" && input.deploymentCategory) throw new Error("Deployment category is only permitted on capital deployment lines.");
  const deploymentCategory = input.metricCategory === "capital_deployment" ? input.deploymentCategory! : "not_applicable";
  await db.insert(projectProjectionMonthlyLines).values({ ...input, deploymentCategory, ownerId }).onDuplicateKeyUpdate({ set: { phase: input.phase, amount: input.amount, dataState: input.dataState, sourceReference: input.sourceReference, effectiveAt: input.effectiveAt, ownerName: input.ownerName, notes: input.notes } });
  const rows = await db.select().from(projectProjectionMonthlyLines).where(and(eq(projectProjectionMonthlyLines.ownerId, ownerId), eq(projectProjectionMonthlyLines.scenarioId, input.scenarioId), eq(projectProjectionMonthlyLines.monthIndex, input.monthIndex), eq(projectProjectionMonthlyLines.metricCategory, input.metricCategory), eq(projectProjectionMonthlyLines.deploymentCategory, deploymentCategory))).limit(1);
  return rows[0];
}

export async function getProjectionSnapshot(ownerId: number, modelId: number) {
  const model = await getOwnedModel(ownerId, modelId); if (!model) throw new Error("Project-economics model not found for this workspace owner.");
  const scenarios = await listProjectionScenarios(ownerId, modelId);
  const linePairs = await Promise.all(scenarios.map(async (scenario) => [scenario.id, await listProjectionMonthlyLines(ownerId, scenario.id)] as const));
  return { model, scenarios: calculateProjectionComparison(scenarios, Object.fromEntries(linePairs), model.horizonMonths) };
}

export async function getHistoricalPlanningBudgetComparison(ownerId: number) {
  const db = await getDb();
  if (!db) return [];
  const [projects, models, scenarios, assumptions] = await Promise.all([
    db.select({ id: internalProjects.id, projectName: internalProjects.projectName }).from(internalProjects).where(eq(internalProjects.ownerId, ownerId)),
    db.select({ id: projectEconomicsModels.id, internalProjectId: projectEconomicsModels.internalProjectId }).from(projectEconomicsModels).where(eq(projectEconomicsModels.ownerId, ownerId)),
    db.select({ id: projectProjectionScenarios.id, modelId: projectProjectionScenarios.modelId, scenarioName: projectProjectionScenarios.scenarioName, scenarioStatus: projectProjectionScenarios.scenarioStatus, notes: projectProjectionScenarios.notes }).from(projectProjectionScenarios).where(eq(projectProjectionScenarios.ownerId, ownerId)),
    db.select({ scenarioId: projectProjectionAssumptions.scenarioId, metric: projectProjectionAssumptions.metric, value: projectProjectionAssumptions.value, dataState: projectProjectionAssumptions.dataState, sourceReference: projectProjectionAssumptions.sourceReference, effectiveAt: projectProjectionAssumptions.effectiveAt, ownerName: projectProjectionAssumptions.ownerName }).from(projectProjectionAssumptions).where(eq(projectProjectionAssumptions.ownerId, ownerId)),
  ]);
  return buildHistoricalPlanningComparison(projects, models, scenarios, assumptions);
}

function metricValue(rows: Array<{ metric: string; value: number | null }>, ...metrics: string[]) {
  return rows.find((row) => metrics.includes(row.metric))?.value ?? null;
}

/**
 * Summarizes only stored scenario-isolated planning data. Capital-stage records stay
 * separate: a planning requirement is never reported as actual, committed, or funded.
 */
export async function getFinancialOsPortfolioSnapshot(ownerId: number) {
  const db = await getDb();
  if (!db) return { projects: [], totals: { developmentCost: 0, annualRevenue: 0, annualNoi: 0, monthlyCashFlow: 0, projectsWithPlanningData: 0 } };
  const [projects, models, scenarios, assumptions, lines, wbs, scheduleMonths] = await Promise.all([
    db.select({ id: internalProjects.id, projectName: internalProjects.projectName, projectType: internalProjects.projectType, projectStatus: internalProjects.projectStatus, developmentStage: internalProjects.developmentStage, totalProjectCost: internalProjects.totalProjectCost, totalProjectCostDataState: internalProjects.totalProjectCostDataState, capitalRequirement: internalProjects.capitalRequirement, capitalRequirementDataState: internalProjects.capitalRequirementDataState }).from(internalProjects).where(eq(internalProjects.ownerId, ownerId)),
    db.select().from(projectEconomicsModels).where(eq(projectEconomicsModels.ownerId, ownerId)),
    db.select().from(projectProjectionScenarios).where(eq(projectProjectionScenarios.ownerId, ownerId)),
    db.select({ scenarioId: projectProjectionAssumptions.scenarioId, metric: projectProjectionAssumptions.metric, value: projectProjectionAssumptions.value, dataState: projectProjectionAssumptions.dataState, sourceReference: projectProjectionAssumptions.sourceReference }).from(projectProjectionAssumptions).where(eq(projectProjectionAssumptions.ownerId, ownerId)),
    db.select({ scenarioId: projectProjectionMonthlyLines.scenarioId, monthIndex: projectProjectionMonthlyLines.monthIndex, metricCategory: projectProjectionMonthlyLines.metricCategory, deploymentCategory: projectProjectionMonthlyLines.deploymentCategory, amount: projectProjectionMonthlyLines.amount, dataState: projectProjectionMonthlyLines.dataState }).from(projectProjectionMonthlyLines).where(eq(projectProjectionMonthlyLines.ownerId, ownerId)),
    db.select({ scenarioId: projectPlanningWbsLines.projectionScenarioId, allocatedAmount: projectPlanningWbsLines.allocatedAmount }).from(projectPlanningWbsLines).where(eq(projectPlanningWbsLines.ownerId, ownerId)),
    db.select({ scenarioId: projectPlanningScheduleMonths.projectionScenarioId, monthIndex: projectPlanningScheduleMonths.monthIndex, constructionSpendBps: projectPlanningScheduleMonths.constructionSpendBps, occupancyBps: projectPlanningScheduleMonths.occupancyBps }).from(projectPlanningScheduleMonths).where(eq(projectPlanningScheduleMonths.ownerId, ownerId)),
  ]);
  const modelByProject = new Map(models.map((model) => [model.internalProjectId, model]));
  const scenariosByModel = new Map<number, typeof scenarios>();
  scenarios.forEach((scenario) => scenariosByModel.set(scenario.modelId, [...(scenariosByModel.get(scenario.modelId) ?? []), scenario]));
  const assumptionsByScenario = new Map<number, typeof assumptions>();
  assumptions.forEach((row) => assumptionsByScenario.set(row.scenarioId, [...(assumptionsByScenario.get(row.scenarioId) ?? []), row]));
  const linesByScenario = new Map<number, typeof lines>();
  lines.forEach((row) => linesByScenario.set(row.scenarioId, [...(linesByScenario.get(row.scenarioId) ?? []), row]));
  const wbsByScenario = new Map<number, number>();
  wbs.forEach((row) => wbsByScenario.set(row.scenarioId, (wbsByScenario.get(row.scenarioId) ?? 0) + row.allocatedAmount));
  const scheduleByScenario = new Map<number, typeof scheduleMonths>();
  scheduleMonths.forEach((row) => scheduleByScenario.set(row.scenarioId, [...(scheduleByScenario.get(row.scenarioId) ?? []), row]));

  const projectRows = projects.map((project) => {
    const model = modelByProject.get(project.id);
    const projectScenarios = model ? scenariosByModel.get(model.id) ?? [] : [];
    const scenarioRows = projectScenarios.map((scenario) => {
      const scenarioAssumptions = assumptionsByScenario.get(scenario.id) ?? [];
      const snapshot = calculateProjectionScenarioSnapshot(scenario, linesByScenario.get(scenario.id) ?? [], model?.horizonMonths ?? 36);
      const developmentCost = wbsByScenario.get(scenario.id) ?? metricValue(scenarioAssumptions, "development_cost", "total_cost") ?? null;
      const unitCount = metricValue(scenarioAssumptions, "program_units", "unit_count");
      const squareFeet = metricValue(scenarioAssumptions, "program_gross_sf", "program_residential_sf", "residential_sq_ft");
      const annualRevenue = metricValue(scenarioAssumptions, "annual_effective_gross_income", "annual_potential_gross_revenue", "annual_residential_revenue");
      const annualNoi = metricValue(scenarioAssumptions, "annual_net_operating_income", "net_operating_income", "historical_annual_noi_reference");
      const endRoiBps = snapshot.ceRoiSeries.at(-1)?.ceRoiBps ?? null;
      const annualCashFlow = snapshot.cashFlowSeriesReady ? snapshot.cashFlowSeries.reduce((sum, month) => sum + month.monthlyCashFlow, 0) : null;
      const deploymentSeries = (scheduleByScenario.get(scenario.id) ?? []).sort((left, right) => left.monthIndex - right.monthIndex).map((month) => ({ monthIndex: month.monthIndex, constructionDeployment: developmentCost !== null && month.constructionSpendBps !== null ? Math.round(developmentCost * month.constructionSpendBps / 10_000) : null, occupancyBps: month.occupancyBps }));
      return {
        scenarioId: scenario.id, scenarioName: scenario.scenarioName, scenarioType: scenario.scenarioType, scenarioStatus: scenario.scenarioStatus,
        developmentCost, unitCount, squareFeet, costPerUnit: developmentCost !== null && unitCount ? Math.round(developmentCost / unitCount) : null,
        costPerSf: developmentCost !== null && squareFeet ? Math.round(developmentCost / squareFeet) : null,
        annualRevenue, annualNoi, annualCashFlow, ceRoiBps: endRoiBps, projectedPaybackMonth: snapshot.projectedPaybackMonth,
        cashFlowSeriesReady: snapshot.cashFlowSeriesReady, operatingSeriesReady: snapshot.operatingSeriesReady, ceRoiSeriesReady: snapshot.ceRoiSeriesReady,
        capitalDeployment: snapshot.capitalDeployment, deploymentSeries,
        sourceReference: scenarioAssumptions[0]?.sourceReference ?? null,
      };
    });
    const populatedScenarioRows = scenarioRows.filter((row) => row.developmentCost !== null || row.annualRevenue !== null || row.annualNoi !== null || row.deploymentSeries.length > 0);
    const primaryCandidates = populatedScenarioRows.length ? populatedScenarioRows : scenarioRows;
    const primary = primaryCandidates.find((row) => row.scenarioType === "base") ?? primaryCandidates.find((row) => /base|optimized|facility capex/i.test(row.scenarioName)) ?? primaryCandidates[0] ?? null;
    return {
      projectId: project.id, projectName: project.projectName, projectType: project.projectType, projectStatus: project.projectStatus, developmentStage: project.developmentStage,
      planningDataState: primary ? "estimated" : "missing", primaryScenarioId: primary?.scenarioId ?? null, primaryScenarioName: primary?.scenarioName ?? null,
      developmentCost: primary?.developmentCost ?? null, capitalRequirement: primary?.developmentCost ?? project.capitalRequirement ?? null,
      capitalRequirementState: primary ? "estimated" : project.capitalRequirementDataState,
      planningFundingGap: primary?.developmentCost ?? null, recordedCommittedCapital: null, recordedFundedCapital: null,
      unitCount: primary?.unitCount ?? null, squareFeet: primary?.squareFeet ?? null, costPerUnit: primary?.costPerUnit ?? null, costPerSf: primary?.costPerSf ?? null,
      annualRevenue: primary?.annualRevenue ?? null, annualNoi: primary?.annualNoi ?? null, annualCashFlow: primary?.annualCashFlow ?? null,
      ceRoiBps: primary?.ceRoiBps ?? null, projectedPaybackMonth: primary?.projectedPaybackMonth ?? null,
      scenarios: scenarioRows,
    };
  });
  const totals = projectRows.reduce((sum, row) => ({
    developmentCost: sum.developmentCost + (row.developmentCost ?? 0), annualRevenue: sum.annualRevenue + (row.annualRevenue ?? 0), annualNoi: sum.annualNoi + (row.annualNoi ?? 0), monthlyCashFlow: sum.monthlyCashFlow + (row.annualCashFlow ?? 0), projectsWithPlanningData: sum.projectsWithPlanningData + (row.planningDataState === "estimated" ? 1 : 0),
  }), { developmentCost: 0, annualRevenue: 0, annualNoi: 0, monthlyCashFlow: 0, projectsWithPlanningData: 0 });
  return { projects: projectRows, totals };
}

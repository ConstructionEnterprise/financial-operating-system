import fs from "node:fs";
import path from "node:path";
import { and, eq } from "drizzle-orm";
import {
  internalProjects,
  internalProjectCapitalNeeds,
  projectEconomicsModels,
  projectPlanningFinancingTerms,
  projectPlanningScheduleMonths,
  projectPlanningWbsLines,
  projectProjectionAssumptions,
  projectProjectionMonthlyLines,
  projectProjectionScenarios,
  projectProjectionUnitMixes,
} from "../drizzle/schema";
import { getDb } from "./db";

export const internalProjectCsvImportDirectory = "/home/ubuntu/ceff-deliverables/internal-project-csvs";

export type FinancialOsCsvRecord = {
  project_id: string;
  project_name: string;
  project_type: string;
  scenario_name: string;
  scenario_type: "downside" | "base" | "upside" | "custom";
  record_group: string;
  sku_id: string;
  metric: string;
  description: string;
  value: string;
  unit: string;
  data_state: "estimated" | "projected";
  source_reference: string;
  effective_date: string;
  owner_name: string;
  month_start: string;
  month_end: string;
  phase: string;
  include_in_model: string;
  notes: string;
};

type ScenarioRows = {
  projectId: number;
  projectName: string;
  scenarioName: string;
  scenarioType: FinancialOsCsvRecord["scenario_type"];
  sourceReference: string;
  ownerName: string;
  notes: string;
  rows: FinancialOsCsvRecord[];
};

const phaseValues = new Set(["predevelopment", "design_entitlement", "construction", "building_completion", "lease_up_stabilization", "commissioning", "operating_ramp", "stabilized_operations"]);
const assumptionGroups = new Set(["project_identity", "scenario_driver", "calculated_output", "operations", "budget_summary", "sales_program", "industrial_driver"]);
const unitMap = new Map<string, "usd" | "units" | "percentage_bps" | "months" | "other">([
  ["usd", "usd"], ["units", "units"], ["percentage_bps", "percentage_bps"], ["months", "months"],
]);

function csvToRows(text: string): FinancialOsCsvRecord[] {
  const cells: string[][] = [];
  let cell = ""; let row: string[] = []; let quoted = false;
  for (let index = 0; index < text.length; index += 1) {
    const character = text[index];
    const next = text[index + 1];
    if (quoted && character === '"' && next === '"') { cell += '"'; index += 1; }
    else if (character === '"') quoted = !quoted;
    else if (character === "," && !quoted) { row.push(cell); cell = ""; }
    else if ((character === "\n" || character === "\r") && !quoted) {
      if (character === "\r" && next === "\n") index += 1;
      row.push(cell); if (row.some((value) => value !== "")) cells.push(row); row = []; cell = "";
    } else cell += character;
  }
  if (cell || row.length) { row.push(cell); cells.push(row); }
  const [headers, ...data] = cells;
  return data.map((values) => Object.fromEntries(headers.map((header, index) => [header, values[index] ?? ""]))) as FinancialOsCsvRecord[];
}

function parseValue(value: string): number | null {
  if (value === "" || value === undefined) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? Math.round(parsed) : null;
}

function normalizePhase(phase: string): "predevelopment" | "design_entitlement" | "construction" | "building_completion" | "lease_up_stabilization" | "commissioning" | "operating_ramp" | "stabilized_operations" {
  return phaseValues.has(phase) ? phase as ReturnType<typeof normalizePhase> : "construction";
}

function scenarioKey(row: FinancialOsCsvRecord) { return `${row.project_id}::${row.scenario_name}`; }

export function groupFinancialOsCsvRows(rows: FinancialOsCsvRecord[]): ScenarioRows[] {
  const groups = new Map<string, ScenarioRows>();
  for (const row of rows.filter((record) => record.include_in_model === "yes")) {
    const key = scenarioKey(row);
    const existing = groups.get(key);
    if (existing) existing.rows.push(row);
    else groups.set(key, {
      projectId: Number(row.project_id), projectName: row.project_name, scenarioName: row.scenario_name,
      scenarioType: row.scenario_type, sourceReference: row.source_reference, ownerName: row.owner_name, notes: row.notes, rows: [row],
    });
  }
  return Array.from(groups.values());
}

export function scenarioImportSummary(group: ScenarioRows) {
  const wbs = group.rows.filter((row) => row.record_group === "wbs_budget");
  const monthly = group.rows.filter((row) => row.sku_id.startsWith("SCH-"));
  const months = new Set(monthly.map((row) => row.month_start));
  const wbsTotal = wbs.reduce((sum, row) => sum + (parseValue(row.value) ?? 0), 0);
  return { wbsCount: wbs.length, wbsTotal, scheduleMonthCount: months.size, unitMixRecordCount: group.rows.filter((row) => row.record_group === "unit_mix").length };
}

function scenarioMetric(rows: FinancialOsCsvRecord[], metric: string) {
  return parseValue(rows.find((row) => row.metric === metric)?.value ?? "");
}

function ownerScopedScenarioRows(rows: FinancialOsCsvRecord[], group: string) { return rows.filter((row) => row.record_group === group); }

function importableCsvFiles(directory: string) {
  return fs.readdirSync(directory).filter((file) => /_financial_model_inputs\.csv$/.test(file)).sort();
}

export async function importInternalProjectCsvPackages(ownerId: number, directory = internalProjectCsvImportDirectory) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  const files = importableCsvFiles(directory);
  if (files.length !== 6) throw new Error(`Expected six financial-model input files; received ${files.length}.`);
  const csvRows = files.flatMap((file) => csvToRows(fs.readFileSync(path.join(directory, file), "utf8")));
  const groups = groupFinancialOsCsvRows(csvRows);
  if (!groups.length) throw new Error("No importable scenario records found.");

  const result = { files, scenarioCount: groups.length, imported: [] as Array<{ projectName: string; scenarioName: string; modelId: number; scenarioId: number; wbsTotal: number }> };
  const primaryGroupByProject = new Map<number, ScenarioRows>();
  for (const group of groups) {
    const prior = primaryGroupByProject.get(group.projectId);
    const score = (candidate: ScenarioRows) => candidate.scenarioType === "base" ? 4 : /optimized/i.test(candidate.scenarioName) ? 3 : /base|baseline|facility capex/i.test(candidate.scenarioName) ? 2 : 1;
    if (!prior || score(group) > score(prior)) primaryGroupByProject.set(group.projectId, group);
  }
  await db.transaction(async (tx) => {
    for (const group of groups) {
      const project = await tx.select().from(internalProjects).where(and(eq(internalProjects.id, group.projectId), eq(internalProjects.ownerId, ownerId))).limit(1);
      if (!project[0]) throw new Error(`Missing owned Internal Project ${group.projectId} (${group.projectName}).`);
      if (project[0].projectName !== group.projectName) throw new Error(`Project name mismatch for ID ${group.projectId}: ${group.projectName}.`);

      const existingModel = await tx.select().from(projectEconomicsModels).where(and(eq(projectEconomicsModels.ownerId, ownerId), eq(projectEconomicsModels.internalProjectId, group.projectId))).limit(1);
      let modelId = existingModel[0]?.id;
      if (!modelId) {
        const insert = await tx.insert(projectEconomicsModels).values({ ownerId, internalProjectId: group.projectId, modelName: `${group.projectName} Financial OS Model`, modelStatus: "active", horizonMonths: 36, modelStartAt: null, modelStartDataState: "estimated", notes: "CSV-ingested estimated planning model. Values remain scenario-isolated and are not actual results, commitments, or funded capital." });
        modelId = Number(insert[0].insertId);
      } else {
        await tx.update(projectEconomicsModels).set({ modelStatus: "active", horizonMonths: 36, modelStartDataState: "estimated", notes: "CSV-ingested estimated planning model. Values remain scenario-isolated and are not actual results, commitments, or funded capital." }).where(and(eq(projectEconomicsModels.ownerId, ownerId), eq(projectEconomicsModels.id, modelId)));
      }

      const existingScenario = await tx.select().from(projectProjectionScenarios).where(and(eq(projectProjectionScenarios.ownerId, ownerId), eq(projectProjectionScenarios.modelId, modelId), eq(projectProjectionScenarios.scenarioName, group.scenarioName))).limit(1);
      let scenarioId = existingScenario[0]?.id;
      if (!scenarioId) {
        const insert = await tx.insert(projectProjectionScenarios).values({ ownerId, modelId, scenarioName: group.scenarioName, scenarioType: group.scenarioType, scenarioStatus: "active", notes: group.notes });
        scenarioId = Number(insert[0].insertId);
      } else {
        await tx.update(projectProjectionScenarios).set({ scenarioType: group.scenarioType, scenarioStatus: "active", notes: group.notes }).where(and(eq(projectProjectionScenarios.ownerId, ownerId), eq(projectProjectionScenarios.id, scenarioId)));
      }

      await tx.delete(projectProjectionAssumptions).where(and(eq(projectProjectionAssumptions.ownerId, ownerId), eq(projectProjectionAssumptions.scenarioId, scenarioId)));
      await tx.delete(projectProjectionUnitMixes).where(and(eq(projectProjectionUnitMixes.ownerId, ownerId), eq(projectProjectionUnitMixes.scenarioId, scenarioId)));
      await tx.delete(projectPlanningWbsLines).where(and(eq(projectPlanningWbsLines.ownerId, ownerId), eq(projectPlanningWbsLines.projectionScenarioId, scenarioId)));
      await tx.delete(projectPlanningScheduleMonths).where(and(eq(projectPlanningScheduleMonths.ownerId, ownerId), eq(projectPlanningScheduleMonths.projectionScenarioId, scenarioId)));
      await tx.delete(projectPlanningFinancingTerms).where(and(eq(projectPlanningFinancingTerms.ownerId, ownerId), eq(projectPlanningFinancingTerms.projectionScenarioId, scenarioId)));
      await tx.delete(projectProjectionMonthlyLines).where(and(eq(projectProjectionMonthlyLines.ownerId, ownerId), eq(projectProjectionMonthlyLines.scenarioId, scenarioId)));

      const assumptionRows = group.rows.filter((row) => assumptionGroups.has(row.record_group) && parseValue(row.value) !== null).map((row, sortOrder) => ({
        ownerId, scenarioId, assumptionCategory: row.record_group, metric: row.metric, value: parseValue(row.value), valueUnit: unitMap.get(row.unit) ?? "other" as const,
        periodStartMonth: row.month_start ? Number(row.month_start) : null, periodEndMonth: row.month_end ? Number(row.month_end) : null,
        dataState: row.data_state === "projected" ? "projected" as const : "estimated" as const, sourceReference: row.source_reference, effectiveAt: null, ownerName: row.owner_name || String(ownerId), notes: row.notes, sortOrder,
      }));
      if (assumptionRows.length) await tx.insert(projectProjectionAssumptions).values(assumptionRows);

      const unitRows = ownerScopedScenarioRows(group.rows, "unit_mix");
      const unitTypes = new Map<string, { unitCount?: number; averageSqFt?: number; monthlyRent?: number; sourceReference: string; ownerName: string; notes: string; dataState: "estimated" | "projected" }>();
      for (const row of unitRows) {
        const [unitType] = row.description.split(" — ");
        const unit = unitTypes.get(unitType) ?? { sourceReference: row.source_reference, ownerName: row.owner_name, notes: row.notes, dataState: row.data_state };
        const value = parseValue(row.value);
        if (row.metric === "unit_count") unit.unitCount = value ?? undefined;
        if (row.metric === "average_unit_sf") unit.averageSqFt = value ?? undefined;
        if (row.metric === "monthly_rent") unit.monthlyRent = value ?? undefined;
        unitTypes.set(unitType, unit);
      }
      const validUnitMix = Array.from(unitTypes.entries()).filter(([, unit]) => unit.unitCount && unit.unitCount > 0);
      if (validUnitMix.length) await tx.insert(projectProjectionUnitMixes).values(validUnitMix.map(([unitType, unit]) => ({ ownerId, scenarioId, unitType, unitCount: unit.unitCount!, averageSqFt: unit.averageSqFt ?? null, monthlyRent: unit.monthlyRent ?? null, dataState: unit.dataState === "projected" ? "projected" as const : "estimated" as const, sourceReference: unit.sourceReference, effectiveAt: null, ownerName: unit.ownerName || String(ownerId), notes: unit.notes })));

      const wbsRows = ownerScopedScenarioRows(group.rows, "wbs_budget");
      if (wbsRows.length) await tx.insert(projectPlanningWbsLines).values(wbsRows.map((row, sortOrder) => ({ ownerId, internalProjectId: group.projectId, projectionScenarioId: scenarioId, wbsCode: row.sku_id.replace("WBS-", ""), description: row.description, costCategory: "standardized_wbs", phase: row.phase || "construction", buildingApplicability: "Project-wide", quantity: 1, quantityUnit: "planning_allowance", unitCost: parseValue(row.value) ?? 0, allocatedAmount: parseValue(row.value) ?? 0, dataState: "estimated" as const, sourceClassification: "reverse_engineered_allocation" as const, sourceReference: row.source_reference, effectiveAt: null, ownerName: row.owner_name || String(ownerId), notes: row.notes, sortOrder })));

      const scheduleByMonth = new Map<number, { phase: string; cumulativeBps: number; occupancyBps: number; sourceReference: string; ownerName: string; notes: string; dataState: "estimated" | "projected" }>();
      for (const row of group.rows.filter((item) => item.sku_id.startsWith("SCH-"))) {
        const month = Number(row.month_start);
        if (!month) continue;
        const item = scheduleByMonth.get(month) ?? { phase: row.phase, cumulativeBps: 0, occupancyBps: 0, sourceReference: row.source_reference, ownerName: row.owner_name, notes: row.notes, dataState: row.data_state };
        if (row.metric === "cumulative_deployment_bps") item.cumulativeBps = parseValue(row.value) ?? 0;
        if (row.metric === "occupancy_bps") item.occupancyBps = parseValue(row.value) ?? 0;
        if (row.phase) item.phase = row.phase;
        scheduleByMonth.set(month, item);
      }
      let priorCumulativeBps = 0;
      const scheduleRows = Array.from(scheduleByMonth.entries()).sort(([a], [b]) => a - b).map(([monthIndex, row]) => {
        const constructionSpendBps = row.cumulativeBps - priorCumulativeBps;
        priorCumulativeBps = row.cumulativeBps;
        return { ownerId, internalProjectId: group.projectId, projectionScenarioId: scenarioId, monthIndex, phase: normalizePhase(row.phase), constructionSpendBps, occupancyBps: row.occupancyBps, dataState: row.dataState === "projected" ? "projected" as const : "estimated" as const, sourceReference: row.sourceReference, effectiveAt: null, ownerName: row.ownerName || String(ownerId), notes: row.notes };
      });
      if (scheduleRows.length) await tx.insert(projectPlanningScheduleMonths).values(scheduleRows);

      const loanAmount = scenarioMetric(group.rows, "construction_debt_commitment");
      const rate = scenarioMetric(group.rows, "construction_interest_rate_bps");
      const fee = scenarioMetric(group.rows, "financing_fee_bps");
      const io = scenarioMetric(group.rows, "construction_interest_only_months");
      const amortization = scenarioMetric(group.rows, "amortization_months");
      if (loanAmount !== null || rate !== null) await tx.insert(projectPlanningFinancingTerms).values({ ownerId, internalProjectId: group.projectId, projectionScenarioId: scenarioId, loanAmount, annualInterestRateBps: rate, financingFeeBps: fee, termMonths: 36, amortizationMonths: amortization, interestOnlyMonths: io, closingMonth: scheduleRows.find((row) => row.constructionSpendBps > 0)?.monthIndex ?? 1, dataState: "estimated", sourceReference: group.sourceReference, effectiveAt: null, ownerName: group.ownerName || String(ownerId), notes: `${group.notes} Imported from standardized Financial OS CSV; not committed or funded capital.` });

      const monthRows = new Map<number, Record<string, FinancialOsCsvRecord>>();
      for (const row of group.rows.filter((item) => item.sku_id.startsWith("SCH-"))) {
        const month = Number(row.month_start);
        if (!month) continue;
        const record = monthRows.get(month) ?? {};
        record[row.metric] = row; monthRows.set(month, record);
      }
      const totalCost = scenarioMetric(group.rows, "development_cost") ?? scenarioMetric(group.rows, "total_cost") ?? 0;
      const modeledDebt = loanAmount ?? 0;
      const equityRatio = totalCost > 0 ? Math.max(0, (totalCost - modeledDebt) / totalCost) : 0;
      const projectionRows = Array.from(monthRows.entries()).sort(([a], [b]) => a - b).flatMap(([monthIndex, metrics]) => {
        const common = { ownerId, scenarioId, monthIndex, phase: normalizePhase(metrics.monthly_development_spend?.phase || metrics.monthly_effective_revenue?.phase || "construction"), dataState: "estimated" as const, sourceReference: group.sourceReference, effectiveAt: null, ownerName: group.ownerName || String(ownerId), notes: `${group.notes} Imported from standardized CSV; estimated planning series only.` };
        const revenue = parseValue(metrics.monthly_effective_revenue?.value ?? "") ?? 0;
        const operatingExpense = parseValue(metrics.monthly_operating_expense?.value ?? "") ?? 0;
        const capex = parseValue(metrics.monthly_development_spend?.value ?? "") ?? 0;
        const interest = parseValue(metrics.monthly_interest?.value ?? "") ?? 0;
        const draw = parseValue(metrics.monthly_debt_draw?.value ?? "") ?? 0;
        const leveredCashFlow = revenue - operatingExpense - capex - interest;
        return [
          { ...common, metricCategory: "revenue" as const, deploymentCategory: "not_applicable" as const, amount: revenue },
          { ...common, metricCategory: "operating_cost" as const, deploymentCategory: "not_applicable" as const, amount: -operatingExpense },
          { ...common, metricCategory: "capital_deployment" as const, deploymentCategory: common.phase === "predevelopment" ? "land_site" as const : "building" as const, amount: -capex },
          { ...common, metricCategory: "financing_cost" as const, deploymentCategory: "not_applicable" as const, amount: -interest },
          { ...common, metricCategory: "funding_draw" as const, deploymentCategory: "not_applicable" as const, amount: draw },
          { ...common, metricCategory: "ce_capital_contribution" as const, deploymentCategory: "not_applicable" as const, amount: -Math.round(capex * equityRatio) },
          { ...common, metricCategory: "ce_distribution" as const, deploymentCategory: "not_applicable" as const, amount: Math.max(0, leveredCashFlow) },
        ];
      });
      if (projectionRows.length) await tx.insert(projectProjectionMonthlyLines).values(projectionRows);

      result.imported.push({ projectName: group.projectName, scenarioName: group.scenarioName, modelId, scenarioId, wbsTotal: scenarioImportSummary(group).wbsTotal });
    }
    for (const [projectId, group] of Array.from(primaryGroupByProject.entries())) {
      const requirement = scenarioImportSummary(group).wbsTotal;
      await tx.update(internalProjects).set({ totalProjectCost: requirement, totalProjectCostDataState: "estimated", capitalRequirement: requirement, capitalRequirementDataState: "estimated", notes: `Financial OS CSV import · ${group.scenarioName} · estimated planning requirement only; not actual spend, a capital commitment, or funded capital.` }).where(and(eq(internalProjects.ownerId, ownerId), eq(internalProjects.id, projectId)));
      await tx.delete(internalProjectCapitalNeeds).where(and(eq(internalProjectCapitalNeeds.ownerId, ownerId), eq(internalProjectCapitalNeeds.internalProjectId, projectId), eq(internalProjectCapitalNeeds.requirementName, "Financial OS planning requirement")));
      await tx.insert(internalProjectCapitalNeeds).values({ ownerId, internalProjectId: projectId, requirementName: "Financial OS planning requirement", requirementCategory: "development_budget", amount: requirement, amountDataState: "estimated", notes: `Imported from ${group.scenarioName}. This is an estimated planning use of capital; it is not a capital commitment or funded capital.`, sortOrder: 0 });
    }
  });
  return result;
}

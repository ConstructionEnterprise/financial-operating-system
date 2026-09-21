import { and, eq, inArray } from "drizzle-orm";
import { internalProjects, projectEconomicsModels, projectPlanningFinancingTerms, projectPlanningScheduleMonths, projectProjectionAssumptions, projectProjectionMonthlyLines, projectProjectionScenarios, projectProjectionUnitMixes } from "../drizzle/schema";
import { cedarwoodBasePlanningOperatingExpenses, cedarwoodBasePlanningOwner, cedarwoodBasePlanningProgram, cedarwoodBasePlanningSource, cedarwoodBasePlanningUnitMix, cedarwoodPlanningScenarioDefinitions, getCedarwoodScenarioSchedule, scaleBps } from "../shared/cedarwoodBasePlanningCase";
import { calculateCedarwoodDevelopmentCashFlow } from "../shared/cedarwoodScheduleFinancing";
import { getDb } from "./db";

const assumptionsNote = "Estimated Planning Assumption from the user-supplied Cedarwood Base Planning Case. This is an underwriting input, not an actual result, capital commitment, or funded-capital record.";
const monthlyLineNote = "Estimated Planning Assumption derived from the user-supplied Cedarwood Base Planning Case. This scenario-isolated monthly line is not actual project cash flow, a capital commitment, or funded capital.";
const scenarioNotes = `Historical planning scenario · user-supplied Base Planning Case · effective date unknown · calculated as an estimated underwriting model only. SOURCE: ${cedarwoodBasePlanningSource} | Includes user-supplied unit mix, rents, ancillary income, operating expenses, 36-month S-curve, lease-up, and financing terms. Estimated exit cap rate and sale costs are planning assumptions; no capital is classified as committed or funded.`;

function buildAssumptions(definition: (typeof cedarwoodPlanningScenarioDefinitions)[number]) {
  const developmentCost = scaleBps(cedarwoodBasePlanningProgram.developmentCost, definition.developmentCostBps);
  const annualOperatingExpenses = scaleBps(cedarwoodBasePlanningProgram.annualOperatingExpenses, definition.operatingExpenseBps);
  const modeledDebt = scaleBps(cedarwoodBasePlanningProgram.modeledConstructionDebt, definition.debtBps);
  const modeledEquity = developmentCost - modeledDebt;
  const base = [
    ["development_cost_control", developmentCost, "usd", "development"], ["total_cost", developmentCost, "usd", "development"],
    ["unit_count", cedarwoodBasePlanningProgram.units, "units", "program"], ["building_count", cedarwoodBasePlanningProgram.buildings, "units", "program"],
    ["residential_sq_ft", cedarwoodBasePlanningProgram.residentialSqFt, "other", "program"], ["historical_annual_noi_reference", cedarwoodBasePlanningProgram.historicalNoiReference, "usd", "operations"],
    ["net_operating_income", cedarwoodBasePlanningProgram.historicalNoiReference, "usd", "operations"], ["other_income_per_unit_month", cedarwoodBasePlanningProgram.otherIncomePerUnitMonth, "usd", "operations"],
    ["annual_operating_expenses", annualOperatingExpenses, "usd", "operations"], ["stabilized_occupancy_bps", definition.occupancyBps, "percentage_bps", "operations"],
    ["historical_financing_reference", cedarwoodBasePlanningProgram.financingFacilityReference, "usd", "financing"], ["modeled_construction_debt", modeledDebt, "usd", "financing"],
    ["modeled_sponsor_equity", modeledEquity, "usd", "capital_structure"], ["exit_cap_rate_bps", definition.exitCapRateBps, "percentage_bps", "exit"],
    ["sale_cost_bps", definition.saleCostBps, "percentage_bps", "exit"], ["ce_distribution_share_bps", definition.ceDistributionShareBps, "percentage_bps", "capital_structure"],
  ] as Array<[string, number, "usd" | "units" | "percentage_bps" | "months" | "other", string]>;
  return [...base, ...cedarwoodBasePlanningOperatingExpenses.map((item) => [`annual_${item.metric}`, scaleBps(item.value, definition.operatingExpenseBps), "usd", "operating_expenses"] as [string, number, "usd", string])];
}

export async function applyCedarwoodBasePlanningCase(ownerId: number, modelId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  const model = await db.select({ modelId: projectEconomicsModels.id, internalProjectId: internalProjects.id, projectName: internalProjects.projectName }).from(projectEconomicsModels).innerJoin(internalProjects, eq(internalProjects.id, projectEconomicsModels.internalProjectId)).where(and(eq(projectEconomicsModels.ownerId, ownerId), eq(projectEconomicsModels.id, modelId), eq(internalProjects.ownerId, ownerId))).limit(1);
  if (model[0]?.projectName !== "Cedarwood Flats") throw new Error("The Base Planning Case may only be applied to an owned Cedarwood Flats model.");
  const scenarios = await db.select().from(projectProjectionScenarios).where(and(eq(projectProjectionScenarios.ownerId, ownerId), eq(projectProjectionScenarios.modelId, modelId)));
  const scenarioByName = new Map(scenarios.map((scenario) => [scenario.scenarioName, scenario]));
  const required = cedarwoodPlanningScenarioDefinitions.map((definition) => ({ definition, scenario: scenarioByName.get(definition.scenarioName) }));
  if (required.some(({ scenario }) => !scenario)) throw new Error("Create the Cedarwood Downside, Base, Upside, and Historical Planning scenarios before applying the Base Planning Case.");

  await db.transaction(async (tx) => {
    for (const { definition, scenario } of required) {
      if (!scenario) continue;
      const developmentCost = scaleBps(cedarwoodBasePlanningProgram.developmentCost, definition.developmentCostBps);
      const modeledDebt = scaleBps(cedarwoodBasePlanningProgram.modeledConstructionDebt, definition.debtBps);
      const modeledEquity = developmentCost - modeledDebt;
      const schedule = getCedarwoodScenarioSchedule(definition);
      const terms = { loanAmount: modeledDebt, annualInterestRateBps: definition.annualInterestRateBps, financingFeeBps: definition.financingFeeBps, termMonths: cedarwoodBasePlanningProgram.termMonths, amortizationMonths: cedarwoodBasePlanningProgram.amortizationMonths, interestOnlyMonths: cedarwoodBasePlanningProgram.interestOnlyMonths, closingMonth: cedarwoodBasePlanningProgram.closingMonth };
      const debt = calculateCedarwoodDevelopmentCashFlow({ totalDevelopmentCost: developmentCost, rows: schedule, terms, horizonMonths: 36 });
      if (!debt.eligible) throw new Error(`Cedarwood ${definition.scenarioName} debt schedule is incomplete: ${debt.reasons.join(" ")}`);

      await tx.update(projectProjectionScenarios).set({ notes: scenarioNotes }).where(and(eq(projectProjectionScenarios.ownerId, ownerId), eq(projectProjectionScenarios.id, scenario.id)));

      await tx.delete(projectProjectionAssumptions).where(and(eq(projectProjectionAssumptions.ownerId, ownerId), eq(projectProjectionAssumptions.scenarioId, scenario.id)));
      await tx.delete(projectProjectionUnitMixes).where(and(eq(projectProjectionUnitMixes.ownerId, ownerId), eq(projectProjectionUnitMixes.scenarioId, scenario.id)));
      await tx.delete(projectPlanningScheduleMonths).where(and(eq(projectPlanningScheduleMonths.ownerId, ownerId), eq(projectPlanningScheduleMonths.projectionScenarioId, scenario.id)));
      await tx.delete(projectPlanningFinancingTerms).where(and(eq(projectPlanningFinancingTerms.ownerId, ownerId), eq(projectPlanningFinancingTerms.projectionScenarioId, scenario.id)));
      await tx.delete(projectProjectionMonthlyLines).where(and(eq(projectProjectionMonthlyLines.ownerId, ownerId), eq(projectProjectionMonthlyLines.scenarioId, scenario.id)));

      await tx.insert(projectProjectionAssumptions).values(buildAssumptions(definition).map(([metric, value, valueUnit, assumptionCategory], sortOrder) => ({ ownerId, scenarioId: scenario.id, assumptionCategory, metric, value, valueUnit, periodStartMonth: null, periodEndMonth: null, dataState: "estimated" as const, sourceReference: cedarwoodBasePlanningSource, effectiveAt: null, ownerName: cedarwoodBasePlanningOwner, notes: assumptionsNote, sortOrder })));
      await tx.insert(projectProjectionUnitMixes).values(cedarwoodBasePlanningUnitMix.map((unit) => ({ ownerId, scenarioId: scenario.id, unitType: unit.unitType, unitCount: unit.unitCount, averageSqFt: unit.averageSqFt, monthlyRent: scaleBps(unit.monthlyRent, definition.rentBps), dataState: "estimated" as const, sourceReference: cedarwoodBasePlanningSource, effectiveAt: null, ownerName: cedarwoodBasePlanningOwner, notes: assumptionsNote })));
      await tx.insert(projectPlanningScheduleMonths).values(schedule.map((row) => ({ ownerId, internalProjectId: model[0]!.internalProjectId, projectionScenarioId: scenario.id, monthIndex: row.monthIndex, phase: row.phase, constructionSpendBps: row.constructionSpendBps, occupancyBps: row.occupancyBps, dataState: "estimated" as const, sourceReference: cedarwoodBasePlanningSource, effectiveAt: null, ownerName: cedarwoodBasePlanningOwner, notes: assumptionsNote })));
      await tx.insert(projectPlanningFinancingTerms).values({ ownerId, internalProjectId: model[0]!.internalProjectId, projectionScenarioId: scenario.id, ...terms, dataState: "estimated", sourceReference: cedarwoodBasePlanningSource, effectiveAt: null, ownerName: cedarwoodBasePlanningOwner, notes: `Modeled construction debt is ${modeledDebt.toLocaleString()} while the separate historical financing-facility reference is ${cedarwoodBasePlanningProgram.financingFacilityReference.toLocaleString()}. Neither is classified as funded capital.` });

      const monthlyPotentialRent = cedarwoodBasePlanningUnitMix.reduce((sum, unit) => sum + unit.unitCount * scaleBps(unit.monthlyRent, definition.rentBps), 0);
      const annualOperatingExpenses = scaleBps(cedarwoodBasePlanningProgram.annualOperatingExpenses, definition.operatingExpenseBps);
      const monthlyOperatingExpenses = annualOperatingExpenses / 12;
      const debtByMonth = new Map(debt.months.map((month) => [month.monthIndex, month]));
      const monthlyLines = schedule.flatMap((row) => {
        const month = debtByMonth.get(row.monthIndex)!;
        const occupancy = row.occupancyBps / 10_000;
        const operating = occupancy > 0;
        const egi = operating ? Math.round((monthlyPotentialRent + cedarwoodBasePlanningProgram.units * cedarwoodBasePlanningProgram.otherIncomePerUnitMonth) * occupancy) : 0;
        const operatingExpenses = operating ? -Math.round(monthlyOperatingExpenses) : 0;
        const terminalNoi = operating ? egi + operatingExpenses : 0;
        const terminalNetProceeds = row.monthIndex === 36 && terminalNoi > 0 ? Math.round((terminalNoi * 12 / (definition.exitCapRateBps / 10_000)) * (1 - definition.saleCostBps / 10_000) - month.endingBalance) : 0;
        const revenue = egi + terminalNetProceeds;
        const financingCost = -Math.round(month.debtService + month.financingFee);
        const capitalDeployment = -Math.round(month.constructionSpend);
        const fundingDraw = Math.round(month.loanDraw);
        const cashFlowAvailableForDistribution = revenue + operatingExpenses + capitalDeployment + financingCost;
        const ceContribution = -Math.round(month.constructionSpend * (modeledEquity / developmentCost));
        const ceDistribution = Math.max(0, Math.round(cashFlowAvailableForDistribution * definition.ceDistributionShareBps / 10_000));
        const common = { ownerId, scenarioId: scenario.id, monthIndex: row.monthIndex, phase: row.phase, dataState: "estimated" as const, sourceReference: cedarwoodBasePlanningSource, effectiveAt: null, ownerName: cedarwoodBasePlanningOwner, notes: monthlyLineNote };
        return [
          { ...common, metricCategory: "revenue" as const, deploymentCategory: "not_applicable" as const, amount: revenue },
          { ...common, metricCategory: "operating_cost" as const, deploymentCategory: "not_applicable" as const, amount: operatingExpenses },
          { ...common, metricCategory: "capital_deployment" as const, deploymentCategory: row.phase === "predevelopment" ? "land_site" as const : row.phase === "design_entitlement" ? "soft_costs" as const : row.phase === "lease_up_stabilization" ? "other" as const : "building" as const, amount: capitalDeployment },
          { ...common, metricCategory: "financing_cost" as const, deploymentCategory: "not_applicable" as const, amount: financingCost },
          { ...common, metricCategory: "funding_draw" as const, deploymentCategory: "not_applicable" as const, amount: fundingDraw },
          { ...common, metricCategory: "ce_capital_contribution" as const, deploymentCategory: "not_applicable" as const, amount: ceContribution },
          { ...common, metricCategory: "ce_distribution" as const, deploymentCategory: "not_applicable" as const, amount: ceDistribution },
        ];
      });
      await tx.insert(projectProjectionMonthlyLines).values(monthlyLines);
    }
  });

  return { appliedScenarioCount: required.length, sourceReference: cedarwoodBasePlanningSource };
}

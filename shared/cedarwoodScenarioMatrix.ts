export const cedarwoodControlCaseSource = "pasted_content_22.txt, user-supplied Cedarwood base planning briefing, received 2026-08-21";
export const cedarwoodControlCaseOwner = "jchappell2120";
export const cedarwoodControlCaseName = "Control Case — $40M Historical Planning";
export const cedarwoodControlCaseTarget = 40_000_000;

export const cedarwoodControlCaseProgram = {
  buildings: 5,
  units: 280,
  residentialSqFt: 258_300,
  historicalAnnualNoiReference: 4_750_000,
  historicalFinancingReference: 55_000_000,
} as const;

export type CedarwoodScenarioMatrixInput = {
  id: number;
  scenarioName: string;
  scenarioType: string;
  scenarioStatus: string;
  notes: string | null;
  assumptions: Array<{ metric: string; value: number | null; valueUnit: string; dataState: string; sourceReference: string | null }>;
  unitMix: Array<{ unitType: string; unitCount: number; averageSqFt: number | null; monthlyRent: number | null; sourceReference: string | null }>;
  schedule: Array<{ monthIndex: number; phase: string; constructionSpendBps: number | null; occupancyBps: number | null }>;
  financing: { loanAmount: number | null; annualInterestRateBps: number | null; financingFeeBps: number | null; termMonths: number | null; amortizationMonths: number | null; interestOnlyMonths: number | null; closingMonth: number | null; sourceReference?: string | null } | null;
  wbsTotal: number;
};

const assumption = (input: CedarwoodScenarioMatrixInput, metric: string) => input.assumptions.find((item) => item.metric === metric);
const assumptionValue = (input: CedarwoodScenarioMatrixInput, metric: string) => assumption(input, metric)?.value ?? null;
const firstAssumptionValue = (input: CedarwoodScenarioMatrixInput, metrics: string[]) => metrics.map((metric) => assumptionValue(input, metric)).find((value) => value !== null) ?? null;
const sourceRecorded = (value: string | null | undefined) => Boolean(value?.trim());
const sourceLabeledAssumption = (input: CedarwoodScenarioMatrixInput, metric: string) => {
  const item = assumption(input, metric);
  return item?.value !== null && item?.value !== undefined && sourceRecorded(item.sourceReference);
};

export function calculateCedarwoodScenarioMonthlyModel(input: CedarwoodScenarioMatrixInput) {
  const developmentCost = firstAssumptionValue(input, ["development_cost_control", "total_cost"]) ?? (input.wbsTotal > 0 ? input.wbsTotal : null);
  const totalUnits = input.unitMix.reduce((sum, item) => sum + item.unitCount, 0) || assumptionValue(input, "unit_count");
  const rentableSqFt = input.unitMix.reduce((sum, item) => sum + (item.averageSqFt ?? 0) * item.unitCount, 0) || assumptionValue(input, "residential_sq_ft");
  const rentDriversReady = input.unitMix.length > 0 && input.unitMix.every((item) => item.monthlyRent !== null && sourceRecorded(item.sourceReference));
  const operationsReady = rentDriversReady && sourceLabeledAssumption(input, "other_income_per_unit_month") && sourceLabeledAssumption(input, "annual_operating_expenses");
  const debt = developmentCost !== null ? calculateCedarwoodDevelopmentCashFlow({ totalDevelopmentCost: developmentCost, rows: input.schedule as CedarwoodScheduleRow[], terms: input.financing, horizonMonths: 36 }) : null;
  const monthlyPotentialRent = rentDriversReady ? input.unitMix.reduce((sum, item) => sum + item.unitCount * item.monthlyRent!, 0) : null;
  const monthlyOtherIncomeAtStabilization = operationsReady && totalUnits !== null ? totalUnits * assumptionValue(input, "other_income_per_unit_month")! : null;
  const monthlyOperatingExpenses = operationsReady ? assumptionValue(input, "annual_operating_expenses")! / 12 : null;
  const exitCapRateBps = assumptionValue(input, "exit_cap_rate_bps");
  const saleCostBps = assumptionValue(input, "sale_cost_bps");
  const finalMonthIndex = debt?.months.at(-1)?.monthIndex;
  const monthlyOperations = operationsReady && monthlyPotentialRent !== null && monthlyOtherIncomeAtStabilization !== null && monthlyOperatingExpenses !== null && debt?.eligible ? debt.months.map((month) => {
    const occupancy = month.occupancyBps / 10_000;
    const grossRent = monthlyPotentialRent * occupancy;
    const otherIncome = monthlyOtherIncomeAtStabilization * occupancy;
    const effectiveGrossIncome = grossRent + otherIncome;
    const noi = effectiveGrossIncome - monthlyOperatingExpenses;
    const grossSaleValue = month.monthIndex === finalMonthIndex && exitCapRateBps && exitCapRateBps > 0 ? noi * 12 / (exitCapRateBps / 10_000) : 0;
    const saleCosts = grossSaleValue * (saleCostBps ?? 0) / 10_000;
    const terminalNetProceeds = grossSaleValue - saleCosts - (grossSaleValue ? month.endingBalance : 0);
    const leveredCashFlow = noi + month.netCashFlowBeforeOperations + terminalNetProceeds;
    return { monthIndex: month.monthIndex, occupancyBps: month.occupancyBps, grossRent, otherIncome, effectiveGrossIncome, operatingExpenses: monthlyOperatingExpenses, noi, debtService: month.debtService, constructionSpend: month.constructionSpend, loanDraw: month.loanDraw, financingFee: month.financingFee, grossSaleValue, saleCosts, terminalNetProceeds, leveredCashFlow };
  }) : [];
  const finalMonth = monthlyOperations.at(-1) ?? null;
  const total = (key: keyof typeof monthlyOperations[number]) => monthlyOperations.reduce((sum, item) => sum + (typeof item[key] === "number" ? item[key] as number : 0), 0);
  const totalLeveredCashFlow = monthlyOperations.length ? total("leveredCashFlow") : null;
  const totalDebtService = monthlyOperations.length ? total("debtService") : null;
  const totalEgi = monthlyOperations.length ? total("effectiveGrossIncome") : null;
  const totalNoi = monthlyOperations.length ? total("noi") : null;
  const monthlyIrr = monthlyOperations.length ? calculateMonthlyIrr(monthlyOperations.map((item) => ({ monthIndex: item.monthIndex, amount: item.leveredCashFlow, flowType: "forecast" as const }))) : null;
  const annualIrr = monthlyIrr === null ? null : (1 + monthlyIrr) ** 12 - 1;
  const contributedEquity = monthlyOperations.length ? Math.abs(monthlyOperations.filter((item) => item.leveredCashFlow < 0).reduce((sum, item) => sum + item.leveredCashFlow, 0)) : null;
  const distributions = monthlyOperations.length ? monthlyOperations.filter((item) => item.leveredCashFlow > 0).reduce((sum, item) => sum + item.leveredCashFlow, 0) : null;
  const equityMultiple = contributedEquity && distributions ? distributions / contributedEquity : null;
  return { developmentCost, totalUnits, rentableSqFt, rentDriversReady, operationsReady, scheduleReady: Boolean(debt?.schedule.complete), financingReady: Boolean(debt?.financing.complete), debtReady: Boolean(debt?.eligible), monthlyPotentialRent, monthlyOperations, totalEffectiveGrossIncome: totalEgi, totalNoi, totalDebtService, totalLeveredCashFlow, annualizedFinalMonthEgi: finalMonth ? finalMonth.effectiveGrossIncome * 12 : null, annualizedFinalMonthNoi: finalMonth ? finalMonth.noi * 12 : null, yieldOnCost: finalMonth && developmentCost && developmentCost > 0 ? finalMonth.noi * 12 / developmentCost : null, grossSaleValue: finalMonth?.grossSaleValue ?? null, terminalNetProceeds: finalMonth?.terminalNetProceeds ?? null, monthlyIrr, annualIrr, equityMultiple };
}

export function summarizeCedarwoodScenarioMatrix(input: CedarwoodScenarioMatrixInput) {
  const model = calculateCedarwoodScenarioMonthlyModel(input);
  const grossRentRequiresMarketData = !model.rentDriversReady;
  const controlVariance = model.developmentCost === null ? null : model.developmentCost - cedarwoodControlCaseTarget;
  const eligibleForMonthlyOperations = model.scheduleReady && model.operationsReady;
  const eligibleForDebtCashFlow = model.debtReady && model.operationsReady;
  return {
    scenarioId: input.id,
    scenarioName: input.scenarioName,
    scenarioType: input.scenarioType,
    scenarioStatus: input.scenarioStatus,
    developmentCost: model.developmentCost,
    controlVariance,
    totalUnits: model.totalUnits,
    rentableSqFt: model.rentableSqFt,
    scheduleReady: model.scheduleReady,
    financingReady: model.financingReady,
    operationsReady: model.operationsReady,
    grossRentRequiresMarketData,
    eligibleForMonthlyOperations,
    eligibleForDebtCashFlow,
    monthlyOperations: model.monthlyOperations,
    totalEffectiveGrossIncome: model.totalEffectiveGrossIncome,
    totalNoi: model.totalNoi,
    totalDebtService: model.totalDebtService,
    totalLeveredCashFlow: model.totalLeveredCashFlow,
    annualizedFinalMonthEgi: model.annualizedFinalMonthEgi,
    annualizedFinalMonthNoi: model.annualizedFinalMonthNoi,
    yieldOnCost: model.yieldOnCost,
    grossSaleValue: model.grossSaleValue,
    terminalNetProceeds: model.terminalNetProceeds,
    annualIrr: model.annualIrr,
    equityMultiple: model.equityMultiple,
    historicalNoiReference: firstAssumptionValue(input, ["historical_annual_noi_reference", "net_operating_income"]),
    historicalControlUnitCount: assumptionValue(input, "unit_count"),
    historicalControlBuildingCount: assumptionValue(input, "building_count"),
    messages: [
      ...(model.developmentCost === null ? ["Enter a scenario development-cost control or link a reconciled WBS."] : []),
      ...(grossRentRequiresMarketData ? ["Enter source-labeled market rent for every unit type; unit counts and square feet alone do not calculate revenue."] : []),
      ...(!sourceLabeledAssumption(input, "other_income_per_unit_month") ? ["Enter source-labeled other-income assumptions before calculating operations."] : []),
      ...(!sourceLabeledAssumption(input, "annual_operating_expenses") ? ["Enter source-labeled operating expenses before calculating NOI."] : []),
      ...(!model.scheduleReady ? ["Complete 36 monthly construction and occupancy rows before calculating the scenario schedule."] : []),
      ...(!model.financingReady ? ["Enter complete financing terms before calculating debt service and levered cash flow."] : []),
    ],
  };
}

export function buildCedarwoodScenarioMatrix(inputs: CedarwoodScenarioMatrixInput[]) {
  return inputs.map(summarizeCedarwoodScenarioMatrix);
}
import { calculateCedarwoodDevelopmentCashFlow, type CedarwoodScheduleRow } from "./cedarwoodScheduleFinancing";
import { calculateMonthlyIrr } from "./roiReturns";

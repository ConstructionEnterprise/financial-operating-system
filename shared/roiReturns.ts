export type RoiDataState = "actual" | "projected" | "estimated" | "missing";
export type RoiCapitalPath = "equity" | "facility_jv" | "equipment_finance" | "grants";

type ProjectInput = { capitalRequirement?: number | null; capitalDeployedActual?: number | null; projectedRevenue?: number | null; actualRevenue?: number | null; projectedCost?: number | null; actualCost?: number | null };
type CapitalSourceInput = { id: number; capitalPath: RoiCapitalPath; capitalCommitted?: number | null; capitalDeployed?: number | null; costOfCapital?: number | null; expectedCeReturn?: number | null; actualCeReturn?: number | null };
type CashFlowInput = { monthIndex: number; amount: number; flowType: "forecast" | "actual" };
type ScenarioInput = { id: number; scenarioName: string; scenarioType: "base" | "upside" | "downside" | "custom"; revenue?: number | null; cost?: number | null; capitalRequired?: number | null; periodMonths?: number | null };
type ContributionInput = { capitalSourceId: number; contributor: "ce" | "partner"; amount: number };
type ReturnDetails = { equity: Array<{ capitalSourceId: number; expectedInvestorReturn?: number | null }>; jv: Array<{ capitalSourceId: number; ceContribution?: number | null; partnerContribution?: number | null; ceOwnershipBps?: number | null; expectedDistributions?: number | null; actualDistributions?: number | null }>; equipment: Array<{ capitalSourceId: number; equipmentCost?: number | null; financingCost?: number | null; annualProductivityValue?: number | null; incrementalRevenue?: number | null }>; grants: Array<{ capitalSourceId: number; awardAmount?: number | null; matchAmount?: number | null; administrativeCost?: number | null; projectValueEnabled?: number | null }> };

export function formatRoiPercent(value: number | null | undefined) { return value === null || value === undefined || !Number.isFinite(value) ? "Unavailable" : `${(value * 100).toFixed(1)}%`; }
export function formatRoiMultiple(value: number | null | undefined) { return value === null || value === undefined || !Number.isFinite(value) ? "Unavailable" : `${value.toFixed(2)}x`; }

function complete(...values: Array<number | null | undefined>) { return values.every((value) => typeof value === "number" && Number.isFinite(value)); }
function sum(values: Array<number | null | undefined>) { return values.reduce<number>((total, value) => total + (typeof value === "number" && Number.isFinite(value) ? value : 0), 0); }
function ratio(numerator?: number | null, denominator?: number | null) { return complete(numerator, denominator) && denominator! > 0 ? numerator! / denominator! : null; }
function hasRecordedValue(value?: number | null) { return typeof value === "number" && Number.isFinite(value); }

export function calculateMonthlyIrr(cashFlows: CashFlowInput[]) {
  const ordered = [...cashFlows].sort((a, b) => a.monthIndex - b.monthIndex);
  if (ordered.length < 2 || !ordered.some((row) => row.amount < 0) || !ordered.some((row) => row.amount > 0)) return null;
  const npv = (rate: number) => ordered.reduce((total, row) => total + row.amount / Math.pow(1 + rate, row.monthIndex), 0);
  let low = -0.9999, high = 10;
  if (npv(low) * npv(high) > 0) return null;
  for (let iteration = 0; iteration < 120; iteration += 1) {
    const middle = (low + high) / 2;
    const value = npv(middle);
    if (Math.abs(value) < 0.000001) return middle;
    if (npv(low) * value <= 0) high = middle; else low = middle;
  }
  return (low + high) / 2;
}

export function calculatePaybackMonths(cashFlows: CashFlowInput[]) {
  const ordered = [...cashFlows].sort((a, b) => a.monthIndex - b.monthIndex);
  if (!ordered.some((row) => row.amount < 0)) return null;
  let cumulative = 0;
  for (const row of ordered) { cumulative += row.amount; if (cumulative >= 0) return row.monthIndex; }
  return null;
}

export function calculateRoiOverview({ project, sources, cashFlows, scenarios, contributions, returnDetails }: { project: ProjectInput; sources: CapitalSourceInput[]; cashFlows: CashFlowInput[]; scenarios: ScenarioInput[]; contributions: ContributionInput[]; returnDetails: ReturnDetails }) {
  const hasActualOperating = complete(project.actualRevenue, project.actualCost);
  const hasProjectedOperating = complete(project.projectedRevenue, project.projectedCost);
  const revenue = hasActualOperating ? project.actualRevenue! : hasProjectedOperating ? project.projectedRevenue! : null;
  const cost = hasActualOperating ? project.actualCost! : hasProjectedOperating ? project.projectedCost! : null;
  const operatingState: RoiDataState = hasActualOperating ? "actual" : hasProjectedOperating ? "projected" : "missing";
  const projectProfit = complete(revenue, cost) ? revenue! - cost! : null;
  const capitalRequired = project.capitalRequirement ?? null;
  const committed = sum(sources.map((source) => source.capitalCommitted));
  const deployed = sum(sources.map((source) => source.capitalDeployed));
  const capitalState: RoiDataState = hasRecordedValue(project.capitalDeployedActual) || sources.some((source) => hasRecordedValue(source.capitalDeployed)) ? "actual" : hasRecordedValue(capitalRequired) ? "projected" : "missing";
  const deployedCapital = hasRecordedValue(project.capitalDeployedActual) ? project.capitalDeployedActual! : deployed || null;
  const remainingGap = hasRecordedValue(capitalRequired) ? Math.max(capitalRequired! - committed, 0) : null;
  const roi = ratio(projectProfit, capitalRequired);
  const selectedCashFlows = cashFlows.some((flow) => flow.flowType === "actual") ? cashFlows.filter((flow) => flow.flowType === "actual") : cashFlows.filter((flow) => flow.flowType === "forecast");
  const cashFlowState: RoiDataState = selectedCashFlows.length === 0 ? "missing" : selectedCashFlows[0].flowType === "actual" ? "actual" : "projected";
  const monthlyIrr = calculateMonthlyIrr(selectedCashFlows);
  const annualIrr = monthlyIrr === null ? null : Math.pow(1 + monthlyIrr, 12) - 1;
  const negativeCashFlows = Math.abs(sum(selectedCashFlows.filter((row) => row.amount < 0).map((row) => row.amount)));
  const positiveCashFlows = sum(selectedCashFlows.filter((row) => row.amount > 0).map((row) => row.amount));
  const equityMultiple = negativeCashFlows > 0 && positiveCashFlows > 0 ? positiveCashFlows / negativeCashFlows : null;
  const paybackMonths = calculatePaybackMonths(selectedCashFlows);
  const contributionSummary = sources.filter((source) => source.capitalPath === "facility_jv").map((source) => {
    const rows = contributions.filter((row) => row.capitalSourceId === source.id);
    const detail = returnDetails.jv.find((row) => row.capitalSourceId === source.id);
    const ceComponents = sum(rows.filter((row) => row.contributor === "ce").map((row) => row.amount));
    const partnerComponents = sum(rows.filter((row) => row.contributor === "partner").map((row) => row.amount));
    const ceContribution = ceComponents || detail?.ceContribution || null;
    const partnerContribution = partnerComponents || detail?.partnerContribution || null;
    const totalCapitalization = complete(ceContribution, partnerContribution) ? ceContribution! + partnerContribution! : null;
    const ceReturn = detail?.actualDistributions ?? detail?.expectedDistributions ?? source.actualCeReturn ?? source.expectedCeReturn ?? null;
    return { capitalSourceId: source.id, ceContribution, partnerContribution, totalCapitalization, ceOwnership: detail?.ceOwnershipBps !== undefined && detail?.ceOwnershipBps !== null ? detail.ceOwnershipBps / 10000 : null, ceReturn, capitalEfficiency: ratio(ceReturn, ceContribution) };
  });
  const capitalPathEconomics = sources.map((source) => {
    const baseReturn = source.actualCeReturn ?? source.expectedCeReturn ?? null;
    const equipment = returnDetails.equipment.find((row) => row.capitalSourceId === source.id);
    const grant = returnDetails.grants.find((row) => row.capitalSourceId === source.id);
    const jv = contributionSummary.find((row) => row.capitalSourceId === source.id);
    const calculatedReturn = source.capitalPath === "equipment_finance" && complete(equipment?.annualProductivityValue, equipment?.incrementalRevenue, equipment?.equipmentCost, equipment?.financingCost) ? equipment!.annualProductivityValue! + equipment!.incrementalRevenue! - equipment!.equipmentCost! - equipment!.financingCost! : source.capitalPath === "grants" && complete(grant?.projectValueEnabled, grant?.matchAmount, grant?.administrativeCost) ? grant!.projectValueEnabled! - grant!.matchAmount! - grant!.administrativeCost! : source.capitalPath === "facility_jv" ? jv?.ceReturn ?? null : baseReturn;
    const capitalBasis = source.capitalDeployed || source.capitalCommitted || null;
    return { capitalSourceId: source.id, capitalPath: source.capitalPath, returnValue: calculatedReturn, roi: ratio(calculatedReturn, capitalBasis), state: calculatedReturn === null || capitalBasis === null ? "missing" as RoiDataState : "estimated" as RoiDataState };
  });
  const scenarioResults = scenarios.map((scenario) => { const profit = complete(scenario.revenue, scenario.cost) ? scenario.revenue! - scenario.cost! : null; return { ...scenario, profit, roi: ratio(profit, scenario.capitalRequired), state: profit === null || !hasRecordedValue(scenario.capitalRequired) ? "missing" as RoiDataState : "projected" as RoiDataState }; });
  return {
    operating: { revenue, cost, projectProfit, grossProfit: null, state: operatingState, roi, roiState: roi === null ? "missing" as RoiDataState : operatingState },
    capital: { capitalRequired, committed, deployed: deployedCapital, remainingGap, state: capitalState },
    cashFlow: { state: cashFlowState, monthlyIrr, annualIrr, equityMultiple, paybackMonths, unavailableReason: selectedCashFlows.length === 0 ? "ROI unavailable — project cash-flow schedule incomplete." : monthlyIrr === null ? "IRR unavailable — cash flows must include both recorded inflows and outflows." : null },
    contributions: contributionSummary,
    capitalPathEconomics,
    scenarios: scenarioResults,
  };
}

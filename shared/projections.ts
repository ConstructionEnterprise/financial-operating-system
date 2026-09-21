export const projectionScenarioTypes = ["downside", "base", "upside", "custom"] as const;
export const projectionDataStates = ["projected", "estimated"] as const;
export const projectionPhases = ["predevelopment", "design_entitlement", "construction", "building_completion", "lease_up_stabilization", "commissioning", "operating_ramp", "stabilized_operations"] as const;
export const projectionMetricCategories = ["revenue", "operating_cost", "capital_deployment", "financing_cost", "funding_draw", "ce_capital_contribution", "ce_distribution"] as const;
export const deploymentCategories = ["land_site", "building", "furniture_fixtures_equipment", "equipment", "robotics_automation", "technology", "soft_costs", "contingency", "working_capital", "other"] as const;

type ProjectionLine = { monthIndex: number; metricCategory: (typeof projectionMetricCategories)[number]; deploymentCategory?: (typeof deploymentCategories)[number] | "not_applicable" | null; amount: number | null; dataState: (typeof projectionDataStates)[number] };
type ProjectionScenario = { id: number; scenarioName: string; scenarioType: string; scenarioStatus: string };

const recorded = (line: ProjectionLine) => line.amount !== null && Number.isFinite(line.amount) && (line.dataState === "projected" || line.dataState === "estimated");
const sumsFor = (lines: ProjectionLine[], monthIndex: number, metric: ProjectionLine["metricCategory"]) => lines.filter((line) => line.monthIndex === monthIndex && line.metricCategory === metric && recorded(line)).reduce((sum, line) => sum + (line.amount ?? 0), 0);
const hasMetricFor = (lines: ProjectionLine[], monthIndex: number, metric: ProjectionLine["metricCategory"]) => lines.some((line) => line.monthIndex === monthIndex && line.metricCategory === metric && recorded(line));
const hasCompleteSeries = (lines: ProjectionLine[], horizonMonths: number, metrics: ProjectionLine["metricCategory"][]) => Array.from({ length: horizonMonths }, (_, index) => index + 1).every((monthIndex) => metrics.every((metric) => hasMetricFor(lines, monthIndex, metric)));

export function calculateProjectionScenarioSnapshot(scenario: ProjectionScenario, lines: ProjectionLine[], horizonMonths: number) {
  const operatingSeriesReady = hasCompleteSeries(lines, horizonMonths, ["revenue", "operating_cost"]);
  const cashFlowSeriesReady = hasCompleteSeries(lines, horizonMonths, ["revenue", "operating_cost", "capital_deployment", "financing_cost", "funding_draw"]);
  const ceRoiSeriesReady = hasCompleteSeries(lines, horizonMonths, ["ce_capital_contribution", "ce_distribution"]);
  const operatingSeries = operatingSeriesReady ? Array.from({ length: horizonMonths }, (_, index) => {
    const monthIndex = index + 1; const revenue = sumsFor(lines, monthIndex, "revenue"); const operatingCost = sumsFor(lines, monthIndex, "operating_cost");
    return { monthIndex, revenue, operatingCost: Math.abs(operatingCost), netOperatingResult: revenue + operatingCost };
  }) : [];
  const cashFlowSeries = cashFlowSeriesReady ? Array.from({ length: horizonMonths }, (_, index) => {
    const monthIndex = index + 1;
    const monthlyCashFlow = ["revenue", "operating_cost", "capital_deployment", "financing_cost", "funding_draw"].reduce((sum, metric) => sum + sumsFor(lines, monthIndex, metric as ProjectionLine["metricCategory"]), 0);
    return { monthIndex, monthlyCashFlow };
  }).map((item, index, rows) => ({ ...item, cumulativeCashFlow: item.monthlyCashFlow + (index ? rows[index - 1].monthlyCashFlow : 0) })) : [];
  if (cashFlowSeriesReady) for (let index = 1; index < cashFlowSeries.length; index += 1) cashFlowSeries[index].cumulativeCashFlow = cashFlowSeries[index].monthlyCashFlow + cashFlowSeries[index - 1].cumulativeCashFlow;
  const capitalDeployment = deploymentCategories.map((category) => ({ category, amount: lines.filter((line) => line.metricCategory === "capital_deployment" && line.deploymentCategory === category && recorded(line)).reduce((sum, line) => sum + Math.abs(line.amount ?? 0), 0) })).filter((item) => item.amount !== 0);
  const ceRoiSeries: Array<{ monthIndex: number; contribution: number; distribution: number; cumulativeContribution: number; cumulativeDistribution: number; ceRoiBps: number | null }> = [];
  if (ceRoiSeriesReady) {
    let cumulativeContribution = 0; let cumulativeDistribution = 0;
    for (let monthIndex = 1; monthIndex <= horizonMonths; monthIndex += 1) {
      const contribution = Math.abs(sumsFor(lines, monthIndex, "ce_capital_contribution")); const distribution = sumsFor(lines, monthIndex, "ce_distribution");
      cumulativeContribution += contribution; cumulativeDistribution += distribution;
      ceRoiSeries.push({ monthIndex, contribution, distribution, cumulativeContribution, cumulativeDistribution, ceRoiBps: cumulativeContribution > 0 ? Math.round(((cumulativeDistribution - cumulativeContribution) / cumulativeContribution) * 10_000) : null });
    }
  }
  const breakevenMonth = cashFlowSeriesReady ? cashFlowSeries.find((item) => item.cumulativeCashFlow >= 0 && item.monthlyCashFlow !== 0)?.monthIndex ?? null : null;
  return {
    scenarioId: scenario.id, scenarioName: scenario.scenarioName, scenarioType: scenario.scenarioType, scenarioStatus: scenario.scenarioStatus,
    operatingSeriesReady, cashFlowSeriesReady, ceRoiSeriesReady,
    operatingSeries, cashFlowSeries, ceRoiSeries, capitalDeployment,
    projectedPaybackMonth: breakevenMonth,
    messages: {
      operating: operatingSeriesReady ? null : "Unavailable — insufficient inputs. Record revenue and operating-cost lines for every projection month.",
      cashFlow: cashFlowSeriesReady ? null : "Unavailable — insufficient inputs. Record revenue, operating cost, capital deployment, financing cost, and funding draw lines for every projection month.",
      ceRoi: ceRoiSeriesReady ? null : "Unavailable — insufficient inputs. Record CE capital contribution and CE distribution lines for every projection month.",
      capitalDeployment: capitalDeployment.length ? "Recorded deployment categories only. Unrecorded categories are excluded." : "Unavailable — insufficient inputs. Record at least one capital-deployment line with a deployment category.",
    },
  };
}

export function calculateProjectionComparison(scenarios: ProjectionScenario[], linesByScenario: Record<number, ProjectionLine[]>, horizonMonths: number) {
  return scenarios.map((scenario) => calculateProjectionScenarioSnapshot(scenario, linesByScenario[scenario.id] ?? [], horizonMonths));
}

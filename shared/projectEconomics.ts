export const projectEconomicsInputAreas = ["uses", "operations", "sources"] as const;
export const projectEconomicsPhases = ["predevelopment", "design_entitlement", "construction", "building_completion", "lease_up_stabilization", "commissioning", "operating_ramp"] as const;
export const projectEconomicsMonthlyCategories = ["capex", "draw", "operating_cash_flow", "debt_service", "grant_disbursement", "revenue_collections"] as const;
export type ProjectEconomicsDataState = "actual" | "projected" | "estimated" | "missing";

/** These are selectable labels only. They create no value, cost, timing, or financial assumption. */
export const projectEconomicsCategoryPresets = {
  uses: ["Land / acquisition", "Site development", "Building construction", "Soft costs", "Financing costs", "FF&E", "Contingency", "Working capital", "Other"],
  operations: ["Units", "Occupancy", "Rental revenue", "Other revenue", "Operating expenses", "NOI"],
  sources: ["CE equity", "JV / Facility", "Equipment Finance", "Grants & Incentives", "Other"],
} as const;

type GovernedInput = { value?: number | null; dataState: ProjectEconomicsDataState };
type GovernedMonthlyItem = { amount?: number | null; dataState: ProjectEconomicsDataState; category: (typeof projectEconomicsMonthlyCategories)[number] };

const isRecorded = (value: number | null | undefined, state: ProjectEconomicsDataState) => state !== "missing" && typeof value === "number" && Number.isFinite(value);

export function summarizeProjectEconomicsReadiness(inputs: GovernedInput[], monthlyItems: GovernedMonthlyItem[]) {
  const recordedInputs = inputs.filter((input) => isRecorded(input.value, input.dataState)).length;
  const missingInputs = inputs.filter((input) => input.dataState === "missing" || input.value === null || input.value === undefined).length;
  const recordedMonthlyItems = monthlyItems.filter((item) => isRecorded(item.amount, item.dataState));
  const hasInflow = recordedMonthlyItems.some((item) => ["draw", "grant_disbursement", "revenue_collections"].includes(item.category) && (item.amount ?? 0) > 0);
  const hasOutflow = recordedMonthlyItems.some((item) => ["capex", "operating_cash_flow", "debt_service"].includes(item.category) && (item.amount ?? 0) < 0);
  const returnsAvailable = hasInflow && hasOutflow;
  return {
    recordedInputs,
    missingInputs,
    recordedMonthlyItems: recordedMonthlyItems.length,
    returnsAvailable,
    returnStatus: returnsAvailable ? "Ready for ROI / Returns cash-flow analysis" : "Unavailable — insufficient inputs",
    returnReason: returnsAvailable ? "Recorded monthly inflows and outflows are available for analysis." : "Record at least one non-zero monthly inflow and one non-zero monthly outflow before ROI, IRR, payback, distributions, or multiple are calculated.",
  };
}

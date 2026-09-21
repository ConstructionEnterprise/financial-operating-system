import { describe, expect, it } from "vitest";
import { calculateCedarwoodScenarioMonthlyModel, cedarwoodControlCaseTarget, summarizeCedarwoodScenarioMatrix } from "../shared/cedarwoodScenarioMatrix";
import { cedarwoodHistoricalPlanningInitialSchedule } from "../shared/cedarwoodHistoricalPlanning";

const baseInput = {
  id: 1,
  scenarioName: "Control Case",
  scenarioType: "custom",
  scenarioStatus: "draft",
  notes: null,
  assumptions: [
    { metric: "development_cost_control", value: cedarwoodControlCaseTarget, valueUnit: "usd", dataState: "estimated", sourceReference: "user" },
    { metric: "other_income_per_unit_month", value: 75, valueUnit: "usd", dataState: "estimated", sourceReference: "user" },
    { metric: "annual_operating_expenses", value: 2_240_000, valueUnit: "usd", dataState: "estimated", sourceReference: "user" },
  ],
  unitMix: [{ unitType: "Studio", unitCount: 28, averageSqFt: 600, monthlyRent: null, sourceReference: null }],
  schedule: Array.from({ length: 36 }, (_, index) => ({ monthIndex: index + 1, phase: "construction", constructionSpendBps: index === 0 ? 10_000 : 0, occupancyBps: 0 })),
  financing: { loanAmount: 55_000_000, annualInterestRateBps: 750, financingFeeBps: 100, termMonths: 360, amortizationMonths: 360, interestOnlyMonths: 24, closingMonth: 4 },
  wbsTotal: cedarwoodControlCaseTarget,
};

describe("Cedarwood scenario matrix", () => {
  it("keeps the $40M control case separate from revenue eligibility when market rents are not sourced", () => {
    const result = summarizeCedarwoodScenarioMatrix(baseInput);
    expect(result.developmentCost).toBe(40_000_000);
    expect(result.controlVariance).toBe(0);
    expect(result.scheduleReady).toBe(true);
    expect(result.financingReady).toBe(true);
    expect(result.operationsReady).toBe(false);
    expect(result.eligibleForDebtCashFlow).toBe(false);
    expect(result.messages.join(" ")).toContain("market rent");
  });

  it("becomes eligible only when each unit type carries a source-labeled rent driver", () => {
    const result = summarizeCedarwoodScenarioMatrix({ ...baseInput, unitMix: [{ ...baseInput.unitMix[0], monthlyRent: 1450, sourceReference: "market survey" }] });
    expect(result.operationsReady).toBe(true);
    expect(result.eligibleForMonthlyOperations).toBe(true);
    expect(result.eligibleForDebtCashFlow).toBe(true);
  });

  it("recognizes imported historical planning controls without treating the NOI reference as a rent-derived result", () => {
    const result = summarizeCedarwoodScenarioMatrix({ ...baseInput, assumptions: [{ metric: "total_cost", value: cedarwoodControlCaseTarget, valueUnit: "usd", dataState: "estimated", sourceReference: "historical briefing" }, { metric: "net_operating_income", value: 4_750_000, valueUnit: "usd", dataState: "estimated", sourceReference: "historical briefing" }, { metric: "unit_count", value: 280, valueUnit: "units", dataState: "estimated", sourceReference: "historical briefing" }, { metric: "building_count", value: 5, valueUnit: "units", dataState: "estimated", sourceReference: "historical briefing" }] });
    expect(result.developmentCost).toBe(40_000_000);
    expect(result.controlVariance).toBe(0);
    expect(result.historicalNoiReference).toBe(4_750_000);
    expect(result.historicalControlUnitCount).toBe(280);
    expect(result.operationsReady).toBe(false);
  });

  it("uses the explicit historical planning schedule for development timing without manufacturing a rent roll, financing case, or return output", () => {
    const result = summarizeCedarwoodScenarioMatrix({ ...baseInput, assumptions: [{ metric: "total_cost", value: cedarwoodControlCaseTarget, valueUnit: "usd", dataState: "estimated", sourceReference: "historical briefing" }, { metric: "net_operating_income", value: 4_750_000, valueUnit: "usd", dataState: "estimated", sourceReference: "historical briefing" }, { metric: "unit_count", value: 280, valueUnit: "units", dataState: "estimated", sourceReference: "historical briefing" }, { metric: "building_count", value: 5, valueUnit: "units", dataState: "estimated", sourceReference: "historical briefing" }], schedule: cedarwoodHistoricalPlanningInitialSchedule, financing: null });
    expect(result.scheduleReady).toBe(true);
    expect(result.operationsReady).toBe(false);
    expect(result.eligibleForMonthlyOperations).toBe(false);
    expect(result.eligibleForDebtCashFlow).toBe(false);
    expect(result.monthlyOperations).toHaveLength(0);
    expect(result.messages.join(" ")).toContain("market rent");
  });

  it("derives EGI, NOI, debt service, terminal proceeds, and levered cash flow from the source-backed monthly driver schedule", () => {
    const result = calculateCedarwoodScenarioMonthlyModel({ ...baseInput, unitMix: [{ unitType: "One bedroom", unitCount: 100, averageSqFt: 700, monthlyRent: 2_000, sourceReference: "market survey" }], assumptions: [{ metric: "development_cost_control", value: cedarwoodControlCaseTarget, valueUnit: "usd", dataState: "estimated", sourceReference: "user" }, { metric: "other_income_per_unit_month", value: 10, valueUnit: "usd", dataState: "estimated", sourceReference: "operating memo" }, { metric: "annual_operating_expenses", value: 1_000_000, valueUnit: "usd", dataState: "estimated", sourceReference: "operating memo" }, { metric: "exit_cap_rate_bps", value: 550, valueUnit: "percentage_bps", dataState: "estimated", sourceReference: "exit planning" }, { metric: "sale_cost_bps", value: 300, valueUnit: "percentage_bps", dataState: "estimated", sourceReference: "exit planning" }], schedule: Array.from({ length: 36 }, (_, index) => ({ monthIndex: index + 1, phase: "construction", constructionSpendBps: index === 0 ? 10_000 : 0, occupancyBps: 10_000 })) });
    expect(result.monthlyOperations).toHaveLength(36);
    expect(result.monthlyOperations[0].effectiveGrossIncome).toBe(201_000);
    expect(result.monthlyOperations[0].noi).toBeCloseTo(117_666.6667, 3);
    expect(result.totalDebtService).not.toBeNull();
    expect(result.totalLeveredCashFlow).not.toBeNull();
    expect(result.annualizedFinalMonthNoi).toBeCloseTo(1_412_000, 3);
    expect(result.yieldOnCost).toBeCloseTo(0.0353, 3);
    expect(result.grossSaleValue).toBeGreaterThan(0);
    expect(result.terminalNetProceeds).toBeLessThan(result.grossSaleValue!);
  });
});

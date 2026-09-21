import { describe, expect, it } from "vitest";
import { calculateCedarwoodScenarioMonthlyModel, cedarwoodControlCaseTarget, summarizeCedarwoodScenarioMatrix } from "./cedarwoodScenarioMatrix";

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

  it("derives operating outputs only from complete source-labeled driver records", () => {
    const result = calculateCedarwoodScenarioMonthlyModel({ ...baseInput, unitMix: [{ unitType: "One bedroom", unitCount: 100, averageSqFt: 700, monthlyRent: 2_000, sourceReference: "market survey" }], assumptions: [{ metric: "development_cost_control", value: cedarwoodControlCaseTarget, valueUnit: "usd", dataState: "estimated", sourceReference: "user" }, { metric: "other_income_per_unit_month", value: 10, valueUnit: "usd", dataState: "estimated", sourceReference: "operating memo" }, { metric: "annual_operating_expenses", value: 1_000_000, valueUnit: "usd", dataState: "estimated", sourceReference: "operating memo" }], schedule: Array.from({ length: 36 }, (_, index) => ({ monthIndex: index + 1, phase: "construction", constructionSpendBps: index === 0 ? 10_000 : 0, occupancyBps: 10_000 })) });
    expect(result.monthlyOperations).toHaveLength(36);
    expect(result.monthlyOperations[0].effectiveGrossIncome).toBe(201_000);
    expect(result.monthlyOperations[0].noi).toBeCloseTo(117_666.6667, 3);
    expect(result.annualizedFinalMonthNoi).toBeCloseTo(1_412_000, 3);
  });
});

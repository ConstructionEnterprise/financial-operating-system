import { describe, expect, it } from "vitest";
import { calculateCedarwoodDevelopmentCashFlow, summarizeCedarwoodSchedule, validateCedarwoodFinancingTerms } from "../shared/cedarwoodScheduleFinancing";

const completeRows = Array.from({ length: 36 }, (_, index) => ({ monthIndex: index + 1, phase: index < 24 ? "construction" : "lease_up_stabilization", constructionSpendBps: index < 20 ? 500 : 0, occupancyBps: index < 24 ? 0 : Math.min(10_000, (index - 23) * 833) }));

describe("Cedarwood schedule and financing gates", () => {
  it("rejects partial schedules and never substitutes zero for missing schedule cells", () => {
    const partial = completeRows.map((row) => row.monthIndex === 3 ? { ...row, constructionSpendBps: null } : row);
    expect(summarizeCedarwoodSchedule(partial, 36).complete).toBe(false);
    const phaseMissing = completeRows.map((row) => row.monthIndex === 4 ? { ...row, phase: "" } : row);
    expect(summarizeCedarwoodSchedule(phaseMissing, 36).complete).toBe(false);
  });

  it("requires complete terms before debt-service and construction cash-flow calculation", () => {
    const terms = { loanAmount: null, annualInterestRateBps: 700, termMonths: 36, amortizationMonths: 300, interestOnlyMonths: 12, closingMonth: 1 };
    expect(validateCedarwoodFinancingTerms(terms, 36).complete).toBe(false);
    expect(calculateCedarwoodDevelopmentCashFlow({ totalDevelopmentCost: 40_000_000, rows: completeRows, terms, horizonMonths: 36 }).eligible).toBe(false);
  });

  it("calculates only the labeled construction-stage cash-flow when schedule and financing inputs are complete", () => {
    const result = calculateCedarwoodDevelopmentCashFlow({ totalDevelopmentCost: 40_000_000, rows: completeRows, terms: { loanAmount: 30_000_000, annualInterestRateBps: 700, termMonths: 36, amortizationMonths: 300, interestOnlyMonths: 12, closingMonth: 1 }, horizonMonths: 36 });
    expect(result.eligible).toBe(true);
    expect(result.totals?.constructionSpend).toBe(40_000_000);
    expect(result.months).toHaveLength(36);
    expect(result.months[0]?.loanDraw).toBe(2_000_000);
    expect(result.months[0]?.debtService).toBeGreaterThan(0);
  });
});

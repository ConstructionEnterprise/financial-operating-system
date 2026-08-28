export type CedarwoodScheduleRow = {
  monthIndex: number;
  phase: string;
  constructionSpendBps: number | null;
  occupancyBps: number | null;
};

export type CedarwoodFinancingTerms = {
  loanAmount: number | null;
  annualInterestRateBps: number | null;
  financingFeeBps?: number | null;
  termMonths: number | null;
  amortizationMonths: number | null;
  interestOnlyMonths: number | null;
  closingMonth: number | null;
};

export function summarizeCedarwoodSchedule(rows: CedarwoodScheduleRow[], horizonMonths: number) {
  const byMonth = new Map(rows.map((row) => [row.monthIndex, row]));
  const normalized = Array.from({ length: horizonMonths }, (_, index) => byMonth.get(index + 1));
  const missingMonthIndexes = normalized.flatMap((row, index) => row && row.phase && row.constructionSpendBps !== null && row.occupancyBps !== null ? [] : [index + 1]);
  const constructionSpendBpsTotal = normalized.reduce((sum, row) => sum + (row?.constructionSpendBps ?? 0), 0);
  const occupancyIsNonDecreasing = normalized.every((row, index) => {
    if (index === 0 || !row) return true;
    const prior = normalized[index - 1];
    if (!prior || row.occupancyBps === null || prior.occupancyBps === null) return true;
    return row.occupancyBps >= prior.occupancyBps;
  });
  const complete = missingMonthIndexes.length === 0 && constructionSpendBpsTotal === 10_000 && occupancyIsNonDecreasing;
  const reasons = [
    ...(missingMonthIndexes.length ? [`Enter phase, construction allocation, and occupancy for months ${missingMonthIndexes.join(", ")}.`] : []),
    ...(constructionSpendBpsTotal !== 10_000 ? [`Construction allocations total ${(constructionSpendBpsTotal / 100).toFixed(2)}%; they must total 100.00%.`] : []),
    ...(!occupancyIsNonDecreasing ? ["Occupancy must not decline across the lease-up schedule."] : []),
  ];
  return { complete, reasons, constructionSpendBpsTotal, occupancyIsNonDecreasing, missingMonthIndexes };
}

export function validateCedarwoodFinancingTerms(terms: CedarwoodFinancingTerms, horizonMonths: number) {
  const required = ["loanAmount", "annualInterestRateBps", "termMonths", "amortizationMonths", "interestOnlyMonths", "closingMonth"] as const;
  const missing = required.filter((field) => terms[field] === null || terms[field] === undefined);
  const reasons = [
    ...(missing.length ? [`Enter ${missing.join(", ")}.`] : []),
    ...(!missing.length && (terms.loanAmount ?? 0) <= 0 ? ["Loan amount must be greater than zero."] : []),
    ...(!missing.length && (terms.termMonths ?? 0) <= 0 ? ["Debt term must be greater than zero."] : []),
    ...(!missing.length && (terms.amortizationMonths ?? 0) <= 0 ? ["Amortization months after the interest-only period must be greater than zero."] : []),
    ...(!missing.length && (terms.interestOnlyMonths ?? 0) > (terms.termMonths ?? 0) ? ["Interest-only months cannot exceed the debt term."] : []),
    ...(!missing.length && ((terms.closingMonth ?? 0) < 1 || (terms.closingMonth ?? 0) > horizonMonths) ? [`Closing month must be between 1 and ${horizonMonths}.`] : []),
  ];
  return { complete: reasons.length === 0, reasons };
}

function annuityPayment(principal: number, monthlyRate: number, periods: number) {
  if (principal <= 0 || periods <= 0) return null;
  if (monthlyRate === 0) return principal / periods;
  const factor = (1 + monthlyRate) ** periods;
  return principal * (monthlyRate * factor) / (factor - 1);
}

export function calculateCedarwoodDevelopmentCashFlow({ totalDevelopmentCost, rows, terms, horizonMonths }: { totalDevelopmentCost: number; rows: CedarwoodScheduleRow[]; terms: CedarwoodFinancingTerms | null; horizonMonths: number; }) {
  const schedule = summarizeCedarwoodSchedule(rows, horizonMonths);
  const financing = terms ? validateCedarwoodFinancingTerms(terms, horizonMonths) : { complete: false, reasons: ["Enter financing terms with source metadata before calculating debt service."] };
  if (!schedule.complete || !financing.complete || !terms) return { eligible: false, reasons: [...schedule.reasons, ...financing.reasons], schedule, financing, months: [], totals: null };
  const monthlyRate = (terms.annualInterestRateBps ?? 0) / 1_200_000;
  const rowsByMonth = new Map(rows.map((row) => [row.monthIndex, row]));
  let balance = 0;
  let undrawnCommitment = terms.loanAmount!;
  let cumulativeCashFlow = 0;
  const months = Array.from({ length: horizonMonths }, (_, index) => {
    const monthIndex = index + 1;
    const row = rowsByMonth.get(monthIndex)!;
    const constructionSpend = totalDevelopmentCost * row.constructionSpendBps! / 10_000;
    const draw = monthIndex >= terms.closingMonth! ? Math.min(undrawnCommitment, constructionSpend) : 0;
    undrawnCommitment -= draw;
    balance += draw;
    const monthSinceClosing = monthIndex - terms.closingMonth! + 1;
    let interest = 0;
    let principal = 0;
    if (monthSinceClosing >= 1 && monthSinceClosing <= terms.termMonths! && balance > 0) {
      interest = balance * monthlyRate;
      if (monthSinceClosing > terms.interestOnlyMonths!) {
        const payment = annuityPayment(balance, monthlyRate, terms.amortizationMonths!) ?? 0;
        principal = Math.min(balance, Math.max(0, payment - interest));
      }
    }
    const debtService = interest + principal;
    balance -= principal;
    const financingFee = draw * (terms.financingFeeBps ?? 0) / 10_000;
    const netCashFlowBeforeOperations = draw - constructionSpend - financingFee - debtService;
    cumulativeCashFlow += netCashFlowBeforeOperations;
    return { monthIndex, phase: row.phase, constructionSpend, loanDraw: draw, financingFee, interest, principal, debtService, endingBalance: balance, occupancyBps: row.occupancyBps!, netCashFlowBeforeOperations, cumulativeCashFlow };
  });
  const totals = months.reduce((sum, month) => ({ constructionSpend: sum.constructionSpend + month.constructionSpend, loanDraw: sum.loanDraw + month.loanDraw, financingFee: sum.financingFee + month.financingFee, interest: sum.interest + month.interest, principal: sum.principal + month.principal, debtService: sum.debtService + month.debtService, netCashFlowBeforeOperations: sum.netCashFlowBeforeOperations + month.netCashFlowBeforeOperations }), { constructionSpend: 0, loanDraw: 0, financingFee: 0, interest: 0, principal: 0, debtService: 0, netCashFlowBeforeOperations: 0 });
  return { eligible: true, reasons: [], schedule, financing, months, totals };
}

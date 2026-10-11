/** Market references are comparison inputs, never lender offers or campaign terms. */
export const stonepineDebtReferences = [
  {
    name: "Federal Reserve prime benchmark",
    url: "https://fred.stlouisfed.org/series/DPRIME",
    observedAt: "2026-10-02",
    detail: "7.00% bank prime rate. A benchmark, not a construction-loan quote.",
  },
  {
    name: "Kiavi new construction",
    url: "https://www.kiavi.com/loans/new-construction-infill",
    observedAt: "2026-10-07",
    detail: "Rates from 9.00%, up to 85% of costs, 12/18/24-month terms; published loan size $150K–$10M.",
  },
  {
    name: "Eagle Point new construction",
    url: "https://eaglepointlending.com/new-construction/",
    observedAt: "2026-10-07",
    detail: "Advertised 11–13%, up to 90% LTC, 6–24 months; property types listed as residential 1–4 units, condos and townhomes.",
  },
  {
    name: "Harmony Bank Dallas commercial real estate lending",
    url: "https://www.harmony.bank/loans/business-loans/commercial-real-estate-loans.html",
    observedAt: "2026-10-07",
    detail: "Dallas-area construction lending describes staged draws and interest-only payments on funds drawn during construction. No public Stonepine rate or leverage quote.",
  },
  {
    name: "Texas Capital commercial real estate",
    url: "https://texascapitalbank.com/commercial-banking/real-estate/commercial-real-estate",
    observedAt: "2026-10-07",
    detail: "Offers construction, syndicated, term and agency take-out structures; pricing and covenants are customized, not published as a universal rate sheet.",
  },
] as const;

export const stonepineDebtSensitivities = [
  { label: "Lower leverage", loanToCostPct: 65, interestRatePct: 9 },
  { label: "Middle case", loanToCostPct: 70, interestRatePct: 11 },
  { label: "Higher leverage", loanToCostPct: 75, interestRatePct: 13 },
] as const;

export function marketDebtSensitivity(projectRequirement: number, loanToCostPct: number, interestRatePct: number) {
  const cost = Math.max(0, projectRequirement);
  const loan = cost * loanToCostPct / 100;
  return {
    loan,
    borrowerEquity: cost - loan,
    fullDrawMonthlyInterest: loan * interestRatePct / 1200,
  };
}

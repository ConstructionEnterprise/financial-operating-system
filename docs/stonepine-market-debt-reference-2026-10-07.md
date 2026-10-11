# Stonepine market-referenced debt sensitivity — 2026-10-07

This is a planning comparison, not a lender quote, loan application, approval, commitment, or change to the campaign's saved financing terms. The app derives its case amounts from Stonepine's recorded $64,750,000 project requirement. If that project requirement changes, the chart recalculates.

| Case | Modeling LTC | Rate sensitivity | Illustrative loan | Required borrower equity | Full-draw monthly interest |
| --- | ---: | ---: | ---: | ---: | ---: |
| Lower leverage | 65% | 9% | $42,087,500 | $22,662,500 | $315,656 |
| Middle case | 70% | 11% | $45,325,000 | $19,425,000 | $415,479 |
| Higher leverage | 75% | 13% | $48,562,500 | $16,187,500 | $526,094 |

The 65/70/75% leverage points are sensitivities chosen to show the sponsor-capital tradeoff, **not published limits or proposed Stonepine terms**. The 9/11/13% rate points bracket advertised small-project new-construction rates; they are **not quotes for a $42–49M facility**. Interest uses the full illustrative balance, not an actual draw schedule, and excludes fees and extensions.

Sources reviewed October 7, 2026:

- [Federal Reserve bank prime rate via FRED](https://fred.stlouisfed.org/series/DPRIME): 7.00% observed October 2, 2026; benchmark, not a construction-loan rate.
- [Kiavi new construction](https://www.kiavi.com/loans/new-construction-infill): rates from 9.00%; up to 85% of total cost; 12-, 18-, or 24-month terms; published loan size $150K–$10M.
- [Eagle Point new construction](https://eaglepointlending.com/new-construction/): advertised 11–13%; up to 90% LTC; 6–24 months; residential 1–4 units, condos, and townhomes.
- [Texas Capital commercial real estate](https://texascapitalbank.com/commercial-banking/real-estate/commercial-real-estate): construction, syndicated, and agency take-out structures, with customized deal terms rather than public universal pricing.
- [Harmony Bank Dallas commercial real estate lending](https://www.harmony.bank/loans/business-loans/commercial-real-estate-loans.html): staged construction draws and interest-only payments on funds drawn during construction. No public numerical rate or advance-rate quote for Stonepine.

Stonepine's saved plan spans 36 months, beyond the cited short-term products' published terms. Its retained rentals also require a separate take-out analysis. A lender request should confirm borrower entity, sponsor equity, collateral, as-completed value, loan amount, index/spread/floor, origination and extension fees, draw conditions, maturity, guarantees, sales release prices, and rental take-out eligibility. Do not mark readiness gates complete from this reference scenario.

## Recorded internal decision

On October 7, 2026, the workspace user selected **70% LTC as the working financing target**. The campaign now records a $45,325,000 planning target and $19,425,000 implied borrower-equity requirement against the $64,750,000 estimated project requirement. An append-only `campaign_financing_decisions` row logs the choice and its source. This does **not** record cash on hand, a lender quote, interest rate, term, close date, or funded capital.

The linked Stonepine project is the destination, but its current $64,750,000 project budget is not yet allocated to lender-eligible campaign uses. A legacy `internal_project_capital_needs` row still carries a $156,000,000 estimated planning requirement; it must be reconciled rather than silently counted or overwritten. Campaign owner means the internal CE person accountable for financing decisions and lender coordination, not the lender or the legal borrower. Joshua Chappell confirmed this role on October 7, 2026; the assignment is saved on the campaign with a separate audit entry.

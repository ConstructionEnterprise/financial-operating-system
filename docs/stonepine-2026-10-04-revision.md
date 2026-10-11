# Stonepine scope and rental-retention revision

User direction, October 4, 2026: 200 homes averaging 1,750 SF (350,000 SF total), compare 15%, 20%, and 25% retained rentals. Cross each mix with the existing all-in cost cases of $165, $185, and $205/SF. Nine alternatives; never sum their budgets.

| Rental share | Rentals | Homes sold | Rental SF | Sale SF |
| --- | ---: | ---: | ---: | ---: |
| 15% | 30 | 170 | 52,500 | 297,500 |
| 20% | 40 | 160 | 70,000 | 280,000 |
| 25% | 50 | 150 | 87,500 | 262,500 |

All-in cost totals are $57,750,000 / $64,750,000 / $71,750,000. The project-level planning requirement uses the $185/SF cost case. Existing preliminary WBS percentages and 36-month spending distribution are retained and rescaled. Allocated rental and sale costs are proportional shares of the single development total, not additional costs.

## Market benchmarks

Estimated sale price: $400,000/home. Estimated rent: $2,500/home/month. These are analyst-selected rounded-down regional proxies; they are not site-specific comparable valuations. Prices are held constant across alternatives to isolate cost and rental-retention effects.

- Realtor.com September 2026 DFW median **asking** price: $422,495. https://www.realtor.com/news/local/dallas-tx/real-estate-market-dallas-tx-september-2026/
- Doorstead July 2026 DFW single-family median rent: $2,599/month. https://www.doorstead.com/blog/dallas-tx-rental-market-report
- Reviewed October 4, 2026. Neither series controls for Stonepine's exact location, 1,750-SF size, finishes, or bedroom count. Source periods are preserved in assumption notes; effective date records this modeling decision.

| Retention | Gross sale proceeds (all homes sold) | Annual potential rent (full occupancy) |
| --- | ---: | ---: |
| 15% | $68,000,000 | $900,000 |
| 20% | $64,000,000 | $1,200,000 |
| 25% | $60,000,000 | $1,500,000 |

Gross sale proceeds are not annual revenue. Potential rent is before vacancy and expenses, not NOI. Monthly deliveries, sale absorption, lease-up, operating expenses, debt terms, and CE contributions/distributions remain to be modeled. No unsupported revenue timing, NOI, cash-flow return, or ROI is generated. Financing/carry/sales allowances already sit inside the all-in budget and must not be double-counted when adding detailed terms.

## Persistence and display

`scripts/seedStonepineAllInCostScenarios.mjs` provides `--dry-run` and read-only `--verify`. The write mode uses a transaction, archives the three original 1,875-SF cost scenarios without deleting their rows, creates the nine revised scenarios, and reconciles WBS and 36-month deployment totals before commit. Existing revised scenarios are skipped on rerun to preserve later edits. Historical 300-home cases remain separately stored.

ROI / Returns defaults and portfolio primary selection exclude archived scenarios. The rental/sale split and gross revenue benchmarks display from stored assumptions in Projections and Internal Projects capital-needs charts.

# Financial OS Portfolio UI Validation

## Verified rendering

The existing **ROI / Returns → Projections** surface now retrieves and renders the stored Financial OS portfolio summary for all six Internal Projects. The live portfolio comparison displays six imported planning models, total modeled development cost, annual modeled revenue, annual modeled NOI, per-project cost basis, unit basis, scenario name, and a project-selection action.

For Cedarwood Flats, the existing Projections surface renders the selected model’s 36-month construction-deployment and occupancy series, WBS capital-deployment composition, scenario comparison, unit mix, calculated operating metrics, debt service, levered cash flow, terminal value, IRR, equity multiple, and return-series charts. The actual, committed, and funded capital stages remain distinct from estimated planning values.

## Data-state observations

All imported portfolio values are identified as **estimated planning data**. Chappell’s facility model has no CapEx or operating values because its $300M reference was intentionally excluded from the facility budget. Some historical-only scenarios retain intentionally unavailable source-linked outputs; those unavailable values are shown as dependent-input disclosures rather than converted to zero or to actual results.

## Validation status

TypeScript and the complete Vitest suite passed after the Financial OS portfolio integration: 62 test files and 152 tests.

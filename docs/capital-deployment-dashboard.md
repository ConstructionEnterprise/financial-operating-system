# Capital sources and deployment dashboard

Implemented 2026-10-05.

The Capital Dashboard now displays funding by capital path, pipeline stages, a source → destination → use flow diagram, use-of-capital composition, project allocation bars, and a spending timeline. Chart selections filter the deployment view. Audit lists are independently scrollable.

## Two distinct views

- Project model budgets: one primary scenario per project. No alternative-scenario double counting. Existing modeled deployment categories populate immediately. Unassigned funding is explicitly labeled. Month numbers are relative to each model, not a common calendar forecast.
- Allocations & payments: saved funding opportunity → project or Company operations → use category. Equipment can belong to a project without becoming a second expenditure. Categories include payroll, insurance, equipment, land/site, construction, software, professional services, working capital, contingency, and other.

Use **Record allocation** to enter a purpose, optional source, destination, category, planned amount, optional committed expenditure, and spending month. Inspect an allocation to record payments with date and reference. Recording a payment does not transfer money. Payment entries can be voided/restored, not deleted. Source/project/category/equipment identity is locked once payment history exists.

Planned, committed, and paid amounts are alternative measures, never added together. Funding commitments remain distinct from expense commitments. Fundraising receipts less source-linked payments is not a bank balance. No payroll, insurance, allocations, or payment records are fabricated from project estimates.

## Database

`drizzle/capital-deployment.sql` creates `capital_allocations` and `capital_payments`. Run `node scripts/setupCapitalDeployment.mjs` with the configured DATABASE_URL. Setup is idempotent and preserves existing records. Tables were created successfully for this workspace.

Protected APIs enforce workspace ownership for allocations, projects, funding sources, and payments. Decimal amounts preserve cents. Payment request keys make retries idempotent. Both views refresh after successful mutations.

## Verification

- `pnpm check` passed.
- Aggregation smoke checks passed: totals, distinct source/destination nodes with identical names, null commitments, empty flows, and balanced links with each amount counted once.
- Live page loaded six primary project budgets. Stonepine drill-down displayed $64,750,000 and corresponding category and timeline charts.
- No synthetic allocations or payments were written to the live database during verification. Payment-write workflow still needs a real, user-supplied entry for end-to-end confirmation.

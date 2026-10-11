# Financial Operating System

The **Financial Operating System** is the CE/FF capital-formation and project-underwriting platform. It combines approval-first outreach operations with a governed financial-modeling engine for Internal Projects, capital strategies, project economics, scenario analysis, and portfolio visibility.

This repository is intentionally separate from any prior CE/FF repository. It contains the application source, reproducible import and model scripts, approved project-model artifacts, reference materials, and documentation needed to understand and reconstruct the system.

## What the system does

Project deployment charts support category stacks, monthly/quarterly and cumulative views, phase bands, period record inspection and funding-draw coverage. Draws remain scenario estimates rather than receipts; unknown spending/funding months are not zero-filled. Categorized monthly entries take precedence over schedule estimates without double-counting.

The 4D Capital Viewer lays out project, campaign, source and record relationships in a global spatial graph rather than a tall column. Records are visible by default; optional cluster collapse helps manage density without removing the All records view. Project selection dims unrelated branches, and the inspector can focus that project. Automatic spacing preserves pinned nodes. Fit entire model, pinch zoom and the remembered collapsible inspector remain available.

Navigation follows ten workspaces: **Command Center → 4D Capital Viewer → Projects & Models → Capital Campaigns → Capital Sources → Action Center → Communications → Records → Integrations → Settings**. Related pages are accessible through workspace sub-navigation; existing section links and equipment-rental links remain supported. Company equity and project debt remain distinct, with project-debt underwriting in Capital Campaigns. See [the navigation audit](docs/navigation-audit.md) for the complete mapping and compatibility boundaries.

The **4D Capital Viewer** combines a spatial relationship graph and time playback in one scene. Its global graph exposes records from the start rather than requiring users to open a chain of collapsed hubs. Dated events follow each project's trajectory; the playhead can show one period or cumulative activity through that period, and All records restores the undated overview. Undated records are not assigned invented months. Modeled budgets, equipment allowances, planned allocations, committed expenses and recorded payments remain distinct evidence views; no modeled funding assignment is invented. Open `?section=capital_viewer` directly.

The viewer autoplays a slow cinematic camera tour (except when reduced motion is preferred). Selecting a node keeps motion running; dragging pauses for precise placement. Left-click and hold empty graph space to rotate the camera; Play motion resumes the tour. Drag the right-edge grab bar to widen the viewport, or focus it and use arrow keys (Home resets, End maximizes). Small screens use a stacked layout. Drag nodes or use arrow keys to reposition them in world space. Positions persist per FOS user on this device, not in financial records. Camera and layout resets remain separate. Hidden tabs suspend updates.

Choose Light, Space or Green backgrounds, saved per user on this device. The camera emphasizes toward/away pitch with reduced sideways travel. Evidence views include equipment finance/rental plans, rental operations and capital campaigns alongside project budgets and allocations/payments. Search and destination filters narrow relationships. Unpriced records remain visible; campaign targets, commitments and receipts stay separate from equipment allowances and rental costs. The graph is a visualization of existing records, not a ledger write surface.

**Integrations** shows the saved Gmail connection and setup requirements for QuickBooks, Xero and Sage. The local FOS Sandbox shared mailbox was connected through Google OAuth on 2026-10-11. This confirms authorization and persistence, not end-to-end email automation. A failed status check is shown as unavailable with a retry action, not as a disconnected account. Accounting connectors are explicitly not implemented or connected yet; this workspace does not collect accounting credentials or synchronize accounting data. Open `?section=integrations` directly.

### Gmail and VCSD sandbox pilot

Keep `GMAIL_CLIENT_ID`, `GMAIL_CLIENT_SECRET`, `PUBLIC_APP_URL`, `SHARED_INBOX`, and `OUTREACH_SANDBOX_ONLY=true` in the ignored local `.env` (see `.env.example`). Start FOS with `npm run dev` and open the reported local URL, then confirm the expected mailbox appears under Integrations. The OAuth refresh token is stored in the database; restarting the laptop should not require reconnecting if the same database and environment configuration remain available. Do not commit `.env` or copy credentials into documentation.

The OAuth flow requests Gmail send and read-only access and checks the authorized mailbox before saving the connection. The current connection does not itself send mail. Sandbox-only recipient checks and approval-first sending remain active. Before using the seeded VCSD contacts for a campaign, verify a sandbox initial send, incoming reply capture, event-file handoff, and persona ingestion end to end. Real-investor outreach remains out of scope until those checks and explicit approvals are complete. See [`docs/VCSD_BRIEFING.md`](docs/VCSD_BRIEFING.md) and [`docs/VCSD_FOS_CONTRACT.md`](docs/VCSD_FOS_CONTRACT.md).

Analytics is the enterprise decision layer for the FOS. It combines stored project models, capital-path targets, opportunity pipeline, recorded commitments and funding, campaign structure, meetings, tasks, equipment needs, grants and documents without collapsing their accounting states. The capital-path selector scopes both the performance comparison and decision-stage distribution; the comparison distinguishes target, requested amount, probability-weighted pipeline, committed capital and funded cash. Missing target or request data is shown as missing, with a route to the relevant capital-path inputs—not as an invented zero-funded result. The workspace also provides project funding coverage, project-economics, operating-activity and data-coverage visualizations with click-through navigation. Run `node scripts/verifyFinancialAnalytics.ts` to verify aggregation and evidence-boundary calculations without database writes.

Meetings provides a visual month calendar, weekly status and campaign activity charts, searchable five-record agenda, and an outcome-review queue. Meetings can be created, edited, rescheduled, completed or cancelled, with optional investor, campaign and capital-opportunity links. All meeting display/input uses America/Chicago; invalid or ambiguous daylight-saving times are rejected. Records are internal to FOS and do not send calendar invitations. Agenda/outcome notes do not automatically create Tasks. Run `node scripts/verifyMeetingsWorkspace.ts` to verify calendar and timezone calculations without writing sample data.

Tasks provides the operating follow-through layer: clickable active, overdue, due-soon, in-progress and completed metrics; due-window and capital-workstream charts; a five-record priority queue; and full task creation/editing. Tasks can link to an investor, campaign and capital opportunity while remaining owner-scoped. Visual totals come only from saved task records; the workspace does not infer completion or generate synthetic work.

Equipment Finance / Rental includes saved development equipment plans for Chappell International Manufacturing Facility and Stonepine Residences: project/strategy and workstream charts, a 36-month budget timeline, five-package scope pages, editable planning inputs and revision history. Finance candidates represent acquisition allowances, not approved debt. Contractor-supplied equipment is explicitly unpriced. These plans do not add amounts to project budgets, create quotes or book rentals. See [equipment planning scope and basis](docs/equipment-development-plans.md).

Initialize the additive tables and local-workspace plans with `node scripts/seedEquipmentDevelopmentPlans.ts` (Node 24 native TypeScript support), after database backup. `--dry-run` validates project scope without writes; `--verify` validates saved plans and audit entries. Reruns preserve existing plans. Run `node scripts/verifyEquipmentDevelopmentPlans.ts` for calculation/validation checks.

Campaigns now opens a financing workspace with Company Equity, Project Debt, Project Equity / JV, Equipment Finance, Grants, and Unclassified views. Each campaign records its recipient entity, project, capital target, owner, target close date, intended uses, and financing terms. Funding comparisons and source-to-recipient diagrams use explicitly linked capital opportunities. Commitment and funding are displayed separately. Instrument-specific milestone guides describe the workflow; they do not imply recorded completion. Detailed outreach batches and document controls remain available in the expandable legacy tools section.

For an existing database, run `node scripts/setupCampaignFinance.mjs` before deploying this version. The additive, repeatable migration preserves existing campaigns and marks their instrument Unclassified. Each campaign now has a live stage funnel, readiness checks, five-record work queue, and instrument-specific underwriting inputs. Calculators for equity dilution and runway, loan payments, JV contributions, equipment payments, and grant matching use only saved inputs. A campaign-linked allocation ledger shows planned uses and recorded deployment separately; its flow diagram is labeled as a capital plan, not funded cash.

`node scripts/seedCampaignStarters.mjs` creates one active planning campaign per financing category for the local FOS workspace, with three setup tasks each. It skips categories already containing campaigns. The equity campaign takes its target from the saved equity capital bucket and links unassigned equity opportunities and investor records. Research-pool charts for JV partners, equipment vendors and grant programs provide workspace context without treating sourced records as assigned campaign members or commitments. Unclassified remains a classification inbox rather than a starter campaign.

The Financial Operating System keeps four capital paths distinct while presenting one coordinated capital plan:

- **Equity Investors:** approval-first investor outreach, Gmail communications, campaigns, investor research, tasks, meetings, documents, and fundraising analytics.
- **JV / Facility Partners:** partnership-first qualification, land/building/facility relationships, contribution context, diligence stages, and facility-capital opportunities.
- **Equipment Finance and Equipment Rental:** productive-asset financing, vendor qualification, equipment acquisition, and operating-use rental exposure.
- **Grants & Incentives:** source-attributed programs, opportunities, applications, awards, disbursements, and compliance progression.

The operating system also includes:

- **Internal Projects:** owner-scoped project identity, lifecycle, program context, capital needs, source links, model context, and document context.
- **Project Economics:** governed uses, operations, sources, monthly timing, financing, WBS budgets, and scenario-isolated projections.
- **Financial Modeling Engine:** driver → monthly schedule → calculation → scenario comparison, with source, owner, effective date, data state, and evidence boundaries.
- **Portfolio Read Model:** comparable project cost, cost basis, deployment, lease-up, operating, debt, cash-flow, scenario, and return views without reclassifying estimates as actual capital.
- **Visual Capital Dashboard:** funding-path and pipeline charts, source → destination → use-of-capital Sankey flows, category composition, project allocation comparisons, and deployment timelines.
- **JV Partner Intelligence:** interactive Texas market map, qualification funnel, partner-archetype mix, priority queue, and evidence-based partner → stated-focus → contribution pathways before a record becomes a JV opportunity.
- **Capital Deployment Ledger:** owner-scoped planned allocations, committed expenditures, and dated payment records for projects, equipment, payroll, insurance, and other operating needs.

## Capital sources and deployment

Internal Projects opens the selected project's visual dashboard, including saved scenario selection, sales/rental mix, funding, deployment schedule, cost breakdown, and comparisons. **Projections** stays scoped to the selected Internal Project and its selected scenario; cross-project comparisons belong in **Overview**. The selected scenario now has a responsive scorecard for modeled development cost, project program, operating model and CE return, with source/basis detail available on demand. Program labels follow the project: apartments and building count for multifamily, residences and sale/rental mix where recorded, and footprint/building count for a manufacturing facility. Cedarwood Flats is an apartment complex with five buildings, not a collection of homes. Missing NOI or CE-return inputs remain unavailable rather than being inferred. The Overview tab provides portfolio comparison, while **Edit project details** expands the context editor beneath the charts. Planning scenarios and recorded ROI-result links have separate availability indicators.

The Capital Dashboard connects fundraising and project planning without collapsing their accounting states. It presents two intentionally separate views:

- **Project model budgets** use one primary scenario per project, preventing alternate scenarios from being added together. Existing model data populates the charts immediately. Funding remains labeled as unassigned until a source is recorded.
- **Allocations & payments** connect a funding opportunity to an Internal Project or Company operations, then classify the use of capital. Planned, committed, and paid amounts can be viewed independently.

The Sankey diagram represents each amount as a single flow:

```text
Funding source → Project / internal destination → Use of capital
```

Ribbon width represents value. Selecting a source, destination, or use filters the diagram and its supporting charts. Equipment can be linked to a project while remaining an equipment use, without counting the expenditure twice. Recording a payment creates an auditable application record; it does not initiate or transmit a real payment.

See [`docs/capital-deployment-dashboard.md`](docs/capital-deployment-dashboard.md) for the data boundaries and workflow.

## Internal Projects currently represented

The project-model package covers six Internal Projects:

1. Cedarwood Flats
2. Garden Lofts
3. Stonepine Residences
4. Skyline Towers
5. Chappell International Manufacturing Facility
6. Garden Haven

Cedarwood is the most developed pilot and includes a 100-line reverse-engineered historical WBS that reconciles to the user-authorized **$40M control case**, a 36-month planning schedule, source-labeled unit mix and operating drivers, estimated financing, scenario cases, and return calculations. The other project files retain their own planning values and scenario boundaries; Cedarwood values are not copied into them.

## Repository layout

```text
client/       React application and existing workspace UI
server/       tRPC procedures, database services, import services, and tests
shared/       Shared domain contracts and financial calculations
drizzle/      MySQL/TiDB schema, relations, and migrations
scripts/      Reproducible generators, importers, validators, and model tooling
data/         Approved CSV imports, manifests, and spreadsheets
models/       Project-model documentation and project-specific model notes
docs/         Architecture, governance, setup, import, and history documentation
reference-decks/  Internal Project reference-deck source files
```

## Technology

The application uses React 19, TypeScript, Vite, Tailwind CSS, Express 4, tRPC 11, Drizzle ORM, MySQL/TiDB, and Vitest. This local FOS release uses a single workspace actor and does not provide production user authentication. Gmail integration is approval-first and requires configured Google OAuth credentials; credentials and runtime secrets are never committed to this repository.

## Local development

Use Node.js 22 or a compatible current LTS release, pnpm, and a configured MySQL/TiDB database. Then:

```bash
pnpm install
pnpm check
pnpm test
pnpm dev
```

### Database Setup

The project uses TiDB Cloud Serverless for the database. Initial setup requires:

1. **Configure Database Connection**: Create `.env.local` with your TiDB Cloud credentials:
   ```
   DATABASE_URL=mysql://<username>:<password>@<host>:4000/fos_db?ssl={"rejectUnauthorized":true}
   ```

2. **Run Migrations**: Apply database schema using Drizzle ORM:
   ```bash
   pnpm db:push
   ```

3. **Import Financial Data**: Import CSV financial model data for Internal Projects (optional):
   - Place CSV files in the designated data directory
   - Run the import script to load project financial models

4. **Create Capital Deployment Tables**: Apply the idempotent allocation and payment-ledger setup:
   ```bash
   node scripts/setupCapitalDeployment.mjs
   ```

See `fos-db-setup-task.md` for detailed automated setup instructions using the provided PowerShell script.

Copy environment variables from your deployment or development secret manager into a local, ignored `.env` file. Do not commit `.env`, OAuth credentials, session material, database dumps, or user-private data. See [`docs/local-development.md`](docs/local-development.md) and [`docs/security-and-secrets.md`](docs/security-and-secrets.md).

## Model and import workflow

The standardized project CSVs are in `data/csv-import-packages/`. The manifest and input-gap summary describe package membership and remaining planning inputs. The Cedarwood workbook is in `data/spreadsheets/`.

The reproducible scripts include:

```bash
node scripts/create_internal_project_csvs.mjs
node scripts/validate_internal_project_csvs.mjs
pnpm tsx scripts/importInternalProjectCsvs.ts
python3 scripts/create_cedarwood_workbook.py
python3 scripts/validate_cedarwood_workbook.py
```

The CSV importer is intended to be idempotent. It creates or updates governed model shells, isolated scenarios, WBS entries, unit-mix drivers, schedule records, financing terms, projection lines, and estimated capital-need context. Planning estimates remain planning estimates; they are not commitments, funded capital, actual spend, or guaranteed returns.

## Data-state boundaries

The Financial Operating System deliberately distinguishes:

> Prospect ≠ Opportunity ≠ Commitment ≠ Funded Capital ≠ Contribution ≠ Cash Flow ≠ Return ≠ ROI.

Project inputs may be actual, projected, estimated, historical planning, or missing. Every modeled number should retain a source reference, effective date when known, owner, and data state. Historical planning figures such as Cedarwood's $40M development control and $4.75M NOI reference are not silently presented as current actuals or rent-derived conclusions.

## Validation

The baseline validation commands are:

```bash
pnpm check
pnpm test
```

The expected project baseline at repository creation is TypeScript-clean with the complete Vitest suite passing. Import validators additionally check row counts, scenario isolation, source labels, 36-month coverage, WBS reconciliation, and formula integrity.

## Security and repository scope

The GitHub remote currently reports as public (checked 2026-10-11); review investor targets, VCSD materials, and other internal fundraising content before pushing. The repository must exclude environment secrets, database files, runtime logs, dependency directories, build output, OAuth tokens, and session cookies. The approved financial-model CSV and spreadsheet artifacts are planning inputs, not a substitute for a secure production database backup. See [`docs/security-and-secrets.md`](docs/security-and-secrets.md).

## Status

**Current Status**: Scenario-aware project scorecards, path-scoped analytics, and spatial capital timelapse are implemented. The sandbox Gmail mailbox is connected and visible in FOS (2026-10-11); automated send/receive and VCSD reply ingestion are not yet validated end to end. Recorded financial state remains governed by its source records.

The Financial Operating System is now fully operational with:
- ✅ TiDB Cloud database connection configured
- ✅ Complete database schema applied (31 migrations, 53 tables)
- ✅ All 6 Internal Projects imported with financial data
- ✅ 11 financial scenarios with projection data
- ✅ Project economics models created for each project
- ✅ Automated setup scripts for future deployments
- ✅ Interactive funding-path, pipeline, Sankey, category, project, and deployment-timeline charts
- ✅ Capital allocations covering project, equipment, payroll, insurance, and internal operating needs
- ✅ Separate planned-allocation, committed-expenditure, and actual-payment measures
- ✅ Idempotent TiDB setup for allocation and payment records

This is the initial standalone Financial Operating System repository baseline. It preserves the CE/FF application and the six-project modeling package as of the initial repository export. Future work should use focused commits, tests, model-source updates, and explicit changes to the data-state and provenance fields.

See [CHANGELOG.md](CHANGELOG.md) for detailed history of recent changes.

## Suggested next improvements

- Add GitHub Actions for automated typecheck, tests, and build validation.
- Add a sanitized database reconstruction seed that excludes investor and authentication data.
- Add versioned model-release tags and a controlled CSV re-import workflow.
- Add formal reconciliation between recorded payment entries and an external bank or accounting feed.

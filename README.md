# Financial Operating System

The **Financial Operating System** is the CE/FF capital-formation and project-underwriting platform. It combines approval-first outreach operations with a governed financial-modeling engine for Internal Projects, capital strategies, project economics, scenario analysis, and portfolio visibility.

This repository is intentionally separate from any prior CE/FF repository. It contains the application source, reproducible import and model scripts, approved project-model artifacts, reference materials, and documentation needed to understand and reconstruct the system.

## What the system does

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

The application uses React 19, TypeScript, Vite, Tailwind CSS, Express 4, tRPC 11, Drizzle ORM, MySQL/TiDB, and Vitest. Authentication uses Manus OAuth. Gmail integration is approval-first and requires configured OAuth credentials; credentials and runtime secrets are never committed to this repository.

## Local development

Use Node.js 22 or a compatible current LTS release, pnpm, and a configured MySQL/TiDB database. Then:

```bash
pnpm install
pnpm check
pnpm test
pnpm dev
```

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

This repository is private. It intentionally excludes environment secrets, database files, runtime logs, dependency directories, build output, OAuth tokens, and session cookies. The approved financial-model CSV and spreadsheet artifacts are planning inputs, not a substitute for a secure production database backup. See [`docs/security-and-secrets.md`](docs/security-and-secrets.md).

## Status

This is the initial standalone Financial Operating System repository baseline. It preserves the CE/FF application and the six-project modeling package as of the initial repository export. Future work should use focused commits, tests, model-source updates, and explicit changes to the data-state and provenance fields.

## Suggested next improvements

- Add GitHub Actions for automated typecheck, tests, and build validation.
- Add a sanitized database reconstruction seed that excludes investor and authentication data.
- Add versioned model-release tags and a controlled CSV re-import workflow.

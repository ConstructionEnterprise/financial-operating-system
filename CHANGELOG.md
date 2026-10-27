# Changelog

All notable changes to the Financial Operating System project will be documented in this file.

## [2026-10-27] - Cedarwood structural Blender coordination model

- Built editable B1 and isolated-module Blender models from Structural Issue 02 and Architectural Issue 04 registers. B1 contains 150 module frames for 56 apartments; primary framing remains separate from nonstructural LGS wall and ceiling systems.
- Added assembled/exploded module animation, named inspection cameras and seven previews including floor plan, cutaway, stack and foundation interface views. Provided component registers, generator, drawing basis and validation report.
- Reopened both Blender files, reconciled 13,855 building / 100 module components, verified the module animation and confirmed exported GLB metre-scale bounds by reimport.
- Uploaded five Current / Internal records (330001-330005): source ZIP, two GLBs and two preview ZIPs. Verified every stored download by SHA-256. An initial database HTTP 500 cleared on retry; no database reset or data migration was performed.
- Retained explicit schematic limits for member envelopes/pitches, connections, foundations, cores and lateral design; no structural capacity or procurement takeoff is asserted, and no financial inputs were changed.
- Updated README.md and .readme to include the structural delivery alongside existing discipline models.

## [2026-10-27] - Melissa civil/site model in Records and viewport repair

- Added Cedarwood Melissa Civil Issue 01 as three Current / Internal Records: Blender source ZIP (300001), site GLB (300002), and preview ZIP (300003). Downloaded each stored artifact and verified its SHA-256 against the final local package.
- Site study retains five modular buildings, 280 apartments and 750 module positions, with 420 parking study spaces including 140 covered spaces, circulation, regional USGS terrain/5 ft contours, concept pads and drainage/access reservations.
- Corrected saved Blender viewport clipping from a 1,000 ft far limit at a 1,500 ft view distance to near/far limits of 1/10,000 ft. The source ZIP includes the recommended ViewportFixed.blend copy and original file; reopened the corrected copy and verified all 1,418 objects remain. Generator defaults now use the corrected orthographic isometric view.
- Preserved feasibility qualifications: regional terrain is not survey-grade; five-story entitlement, shared access and engineered grading/drainage remain unresolved. Unknown land price and financing terms remain unset; authoritative FOS financial inputs were not changed.
- Checked live Records for existing architectural, mechanical, electrical and plumbing 3D packages and structural/erection drawing PDFs. Synchronized README.md and .readme. This update does not create a separate structural Blender model or an in-app 3D viewer.

## [2026-10-26] - Cedarwood electrical and plumbing Blender models in Records

- Created plumbing Blender models for the five-level B1 building and the B1-L1-N02 Type B apartment from Plumbing Issue 01 and Architectural Issue 04 registers. Separate collections expose cold/hot water, central hot-water-return option, sanitary, vents, fixtures, and floor-layout coordination holds.
- Preserved all 420 B1 plumbing fixture/appliance points and all 9 points in the isolated three-module apartment. Both saved Blender files were reopened and their fixture IDs checked against the register. Rendered previews were visually reviewed and source ZIP integrity was checked.
- Uploaded the existing Electrical Issue 01 models (2,118 registered B1 concept device points; 43 apartment points) and the new Plumbing Issue 01 models as six Current / Internal records: one Blender source ZIP and two GLBs per discipline. Both B1 models represent 56 apartments and 150 modular positions. Source ZIPs contain Blender files, GLBs, previews, manifests, generators and registers.
- Verified all six stored files by downloading them from FOS and matching SHA-256 hashes to the local originals. Existing drawing PDFs and mechanical model records remain available.
- Documented schematic boundaries: no approved circuit/pipe sizes, gravity drainage slopes or inverts, stack offsets, service/equipment selection, code-compliance determination, or resolved discipline clashes. Model uploads do not change financial scenario inputs or establish approved procurement quantities.
- Updated README.md and .readme with package filenames, model scope, inspection instructions and limitations. This delivery adds model records and documentation; it does not add an in-app 3D viewer or change application code.

## [2026-10-22] - Portfolio-first Command Center

- Promoted the interactive funding-source -> project -> use-of-capital Sankey to the opening section, titled **The portfolio, connected.** Retained node filtering, Clear filter, and the Project model budgets / Allocations & payments switch without duplicating the chart.
- Added a six-project portfolio directory with comparative development-cost bars, search, project-type filters, type/stage tags, planning-case labels, and direct model links. Added entry points to Projects and supporting Records; missing model costs remain visibly unavailable.
- Removed the four fundraising headline cards, including the default $1M target, while preserving interactive capital-path funding and pipeline-stage bar charts below the portfolio.
- Kept illustrative planning cases distinct from reporting-selected cases, approved portfolio totals, commitments, and received funding. No financial records, capital targets, or reporting selections were changed.
- Validation at implementation: TypeScript and frontend production build passed; live desktop/mobile checks confirmed six project rows, search/type filtering, and no portfolio overflow. Subsequent live checks confirmed the Sankey is first, appears once, and supports project filtering and clearing without browser errors.
- README.md and .readme documentation synchronized on 2026-10-24.

## [2026-10-18] - Restored six-project planning views

- Restored all six projects to the Command Center capital flow, 4D Capital Viewer, and Projects & Models comparison. Project dashboards and the economics scatterplot use an available planning case when no reporting case is selected.
- Marked view-only cases as illustrative and kept reporting totals tied to explicitly selected scenarios. Added case selectors to the capital flow and 4D viewer without changing financial records.
- Verified six project destinations, six viewer hubs, six portfolio rows, and a non-reporting project dashboard in the live app; focused tests, TypeScript, and production build passed.

## [2026-10-17] - Consolidated model and workflow authority

- Consolidated seven redundancy areas: project editors, reporting scenario selection, derived facts/cash coverage, capital measures, follow-ups, page queries/workflows, and campaign identifiers.
- Replaced duplicate model entry screens with the scenario editor; historical schemas remain readable and legacy model writes are rejected.
- Routed reporting and exports through the explicitly selected scenario. Unselected projects remain visibly unselected.
- Backed up and migrated 122 follow-ups into 117 linked Tasks; verified every source title and due date. Source forms now project Task state.
- Unified campaign type aliases and prevented partial campaign edits from resetting financing type/status.
- Added the Task origin table to the 20 audit scopes (58 tables). Preserved review/approval controls, charts and Gantt workflows.
- See [consolidation boundaries and migration](docs/fos-consolidation.md).

## [2026-10-16] - Interactive Financial Controls

- Added Financial Controls under Projects & Models, with aggregate reconciliation charts, clickable filters, status tags, compact evidence tables, and a selected-finding inspector instead of a repeated card grid.
- Added explicit authoritative scenario selection and versioned workbook generation into Records, including source fingerprints and embedded charts.
- Added WBS approval and remaining-forecast controls, allocation mapping, and a separate invoice register. Estimates, commitments, invoices and payments remain distinct; missing values remain missing.
- Added saved cash scenarios, baseline comparisons and a zoomable phase Gantt with source-record drilldown. Dates are relative model months; no task dates are invented.
- Added finding-to-model comparison, correction previews and explicit approval for owner-scoped planning fields, with stale-source checks and before/after history. Actuals are excluded. Derived monthly schedules still require rebuilding after input changes.
- Added the owner-scoped financial-controls table to audit coverage (57 tables across 20 scopes). Qwen remains read-only and its findings remain unverified review candidates.
- Passed 31 focused tests and live checks for chart filtering, timeline drilldown, model comparison and generated-workbook viewing from Records.

## [2026-10-15] - Workbooks Inside Records

- Added View workbook to Excel documents in Records, opening a read-only viewer with sheet tabs, zoom, fit-to-width, and a separate Excel download.
- Rendered worksheet values, formatting, merged cells, and native pie, bar, and line charts alongside their source sheets. Charts resolve worksheet references even when Excel chart caches are empty. Missing saved formula results and unsupported charts remain explicit.
- Verified all six stored project workbooks across their 24 sheets in the live browser, including their inline charts. Workbook editing and formula recalculation remain in Excel.

## [2026-10-14] - Focused A.I. Audits

- Expanded the A.I. Audit workspace from ten to twenty focused scopes. The scopes assign all 56 eligible owner-scoped structured tables once, excluding user accounts, Gmail credentials, and attached file contents.
- Reduced Qwen3:4b requests to at most two records within a 3,500-character JSON batch and a 4,096-token context. An incomplete record-ID acknowledgement splits the batch or stops the run without advancing coverage; no sampling, silent skipping, model fallback, or accepted truncated output.
- Kept audits read-only on FOS's own Ollama service at `127.0.0.1:11436`, with record-count progress and checkpoints for eligible interrupted runs. Findings are unverified review candidates.
- Verified the 20-scope API response, model listing, six focused audit tests, and application build. A fresh full audit has not yet established end-to-end runtime reliability; the prior Project foundations run was stopped after repeated failures and its disposable checkpoint was removed. Repository-wide TypeScript checking still reports errors outside the audit changes.

## [2026-10-11] - Gmail OAuth Connection and Status Recovery

- Configured the FOS Sandbox Google OAuth client for local FOS and connected the approved shared Gmail mailbox. FOS now displays the saved connection in Integrations; OAuth credentials remain in ignored local environment configuration and the refresh token remains in the database, not in this repository.
- Requested Gmail send and read-only scopes for the sandbox connection and verified the selected mailbox before persisting it. The connection alone does not send any message or implement incoming-reply ingestion.
- Hardened the local workspace lookup against a transient database connection reset and made the client retry workspace and Gmail-status checks. Integrations now distinguishes a confirmed disconnection from an unavailable status check, with a retry action instead of prompting another authorization.
- Kept sandbox-only recipient restrictions and approval-first outreach in place. End-to-end sandbox send/receive, VCSD persona response ingestion, and campaign scheduling remain to be verified or completed before any real-investor outreach.

## [2026-10-10] - VCSD Event Bridge

- Added an FOS-side JSON event writer for confirmed sandbox initial sends, manual and scheduled follow-ups, and changed capital-opportunity stages. Events use the copied VCSD contract shape and preserve earlier entries; no email is sent by the writer.
- Restricted simulator event emission and default Gmail sandbox sending to the ten seeded `[SANDBOX]` addresses, rather than any plus-address on the shared inbox. Missing or mismatched `SHARED_INBOX` fails closed.
- Added event identity, append, and malformed-file checks; direct file-write and server bundle smoke checks passed. Live Godot polling was not verified, and persona-reply ingestion remains pending.

## [2026-10-10] - Sandbox-Only Send Guard and Stage Snapshot Fix

- Added a sandbox-only recipient guard to the Gmail send path (`server/gmail.ts`, `server/routers.ts`): while `OUTREACH_SANDBOX_ONLY` is not `"false"` (the default), sending is refused for any address that is not a plus-addressed `SHARED_INBOX` variant. The check runs both at the `markSent` authorization point and inside `sendGmailMessage` as a last-mile backstop. Previously the send path blocked only `.invalid` placeholders, so a mis-approved campaign could have reached real investors once Gmail OAuth is wired.
- Fixed `scripts/snapshotVcStages.ts`: it called `findInvestorContactByEmail` without the required owner ID (every lookup silently fell back to "identified") and was missing the `dotenv/config` import, so it could never connect when run directly. Verified end-to-end: a stage change in FOS now appears in `fos_stages.json` on the next snapshot run.
- Copied the VCSD bridge contract into `docs/VCSD_FOS_CONTRACT.md` so agents working in this repo can read it.

## [2026-10-10] - VC Sandbox: Banks, JV Partners, First Outreach Campaign

- Extended the VC Investor Sandbox from five VC firms to ten capital partners: added three fictional private banks (Meridian Trust Bank, Foundry Private Bank, Bluebonnet Capital Bank) and two fictional JV partners (Terra Firma Developments, Lone Star Builders Group) to `data/vc-investor-sandbox/agents.json`, each with persona, thesis, check size, likely objections, best pitch angle, and sandbox contact details.
- Made `scripts/seedVcInvestorSandbox.ts` capital-type aware: contacts seed with FOS types VC / Bank / JV Partner, and opportunities use capitalPath `equity` for VCs and `facility_jv` for JV partners. Banks seed contacts only — the capitalPath enum has no debt option yet.
- Added `scripts/prepareSandboxOutreach.ts`, which creates the "VC Sandbox — First Outreach" campaign, links all ten sandbox contacts, and drafts a tailored initial subject/body per capital type on each contact (status `drafted`). Nothing is sent; sending still requires Gmail OAuth.
- Fixed two seed-script issues found during the run: a `?? "equity"` fallback that defeated the banks' intentional null capitalPath, and orphaned/unlinked sandbox opportunities left by earlier runs (cleaned and recreated). tsx scripts now call `process.exit(0)` explicitly — the mysql2 pool otherwise keeps the process alive indefinitely.

## [2026-10-10] - Scenario-Aware Project Scorecards

- Replaced the same dense projection text row across projects with a responsive selected-scenario scorecard for modeled cost, project program, operations, and CE return; retained deployment and WBS charts below it.
- Used project-specific program measures: multifamily apartments and building counts, residential sale/rental mix where recorded, and manufacturing-facility footprint and building count. Cedarwood Flats is labeled as a five-building apartment complex rather than homes.
- Showed annual income, NOI, operating margin, CE ROI, and payback only where the underlying inputs support them. CE return is kept separate from project NOI, and an ambiguous imported facility unit count is not presented as a building count.
- Kept Projections scoped to the selected Internal Project and scenario; the six-project comparison remains in Projects & Models → Overview.

## [2026-10-10] - Capital-Path Analytics Scope

- Applied the selected capital path to both capital-performance and opportunity-stage visualizations; added requested amounts alongside targets, probability-weighted pipeline, recorded commitments, and funded cash.
- Added path-specific missing-data guidance and a route to the relevant inputs. No target, requested amount, commitment, or funding was created by the visualization change.

## [2026-10-10] - Spatial Capital Timelapse

- Renamed the navigation destination to 4D Capital Viewer and combined relationships and dated events in a single spatial scene rather than separate graph and timeline visualizations.
- Added project time trajectories, a playhead, period/cumulative playback, and All records. Dated event emphasis changes with time while the underlying graph layout remains stable; undated relationships receive no invented date.
- Changed the initial graph to expose records globally, reducing dependency on collapsed hub-and-spoke groups. Preserved node inspection, search, camera controls, fit, themes, persisted node positions, and the hideable details panel.
- Kept modeled budgets, equipment allowances, allocations, commitments, and actual payments as distinct evidence states.

## [2026-10-08] - Development Spending Analysis

- Replaced single-color deployment bars with recorded category stacks, monthly/quarterly intervals and period/cumulative views in a 400px chart.
- Added total deployment and peak-month KPIs, compact currency axes, evidence-aware tooltips, delivery-phase bands and period record drill-down.
- Added an optional funding-draw overlay and cumulative shortfall. Missing entries remain unknown; modeled draws are explicitly not actual receipts or available cash.
- Exposed scenario-isolated monthly record IDs, phases and provenance in the portfolio snapshot. Schedule estimates are fallback values, never added to the same month's categorized records.

## [2026-10-08] - Project-Centered Capital Clusters

- Replaced tall graph columns with project/campaign hubs and radial source groups. Groups summarize record count, known dollars and unpriced counts, and expand into individual record nodes on selection.
- Added deterministic label-aware spacing that leaves user-pinned nodes untouched, project highlighting, a focus action and Collapse all groups.
- Preserved financial evidence views, full record ledger, camera controls, fit and inspector visibility. Added aggregation, expansion, identity and pinning regression coverage.

## [2026-10-08] - Whole-Model Framing

- Fit the complete projected model and labels into a fixed-height viewport; apply zoom after node spacing so zooming out reduces the entire diagram instead of retaining a tall scrolling canvas.
- Added Fit entire model and sticky details-panel controls. The inspector defaults closed and remembers its open/closed preference per user on this device.

## [2026-10-08] - Pinch Zoom and Collapsible Inspector

- Added viewport-scoped Ctrl+wheel trackpad pinch handling: pinch inward zooms in and outward zooms out, matching the requested direction. Ordinary scrolling and browser zoom outside the scene are unchanged.
- Pinch freezes the cinematic pose and supports a bounded 25–300% zoom range.
- Added a details-panel hide/show control that expands the graph to full width while preserving selection and the previous divider width.

## [2026-10-08] - Dense Graph Spacing

- Replaced compressed node columns with fixed-spacing rows and an expanding, vertically scrollable scene.
- Added projected column separation to keep automatic node labels apart during rotation; manually positioned nodes remain excluded from automatic adjustment.
- Verified the 38-node equipment group in the live viewer with over 34 scene units of minimum vertical clearance.

## [2026-10-08] - Direct Viewport Rotation and Resizing

- Left-button dragging on empty graph space rotates the camera and pauses autoplay; node dragging remains independent.
- Added a right-edge viewport grab bar with pointer capture, bounded resizing, keyboard arrows and Home/End controls. Smaller screens retain a stacked layout.
- Verified pointer rotation, grab-bar widening and keyboard resizing against the live project graph.

## [2026-10-08] - Viewer Themes and Expanded Capital Evidence

- Added persistent Light, Space and Green backgrounds and stronger toward/away camera pitch with reduced sideways travel.
- Node selection keeps motion running; intentional dragging pauses for precise placement.
- Added equipment finance/rental plans, rental operations and campaign evidence views, with search and destination filters.
- Unknown amounts remain visible as unpriced relationships. Rental quantity/duration and campaign target/commitment/funding mappings passed deterministic checks.
- Live browser verification was blocked by a failing user/database query in the running app.

## [2026-10-08] - Cinematic Capital Motion and Persistent Node Layouts

- The 3D Capital Viewer now starts a slow, continuous camera tour combining orbit, tilt, zoom and spatial drift; manual sliders are secondary controls.
- Added pause/play; node inspection or dragging pauses motion. Hidden tabs suspend the animation loop and reduced-motion preferences disable autoplay.
- Added pointer dragging and arrow-key positioning in world space, with connected flows following the node. Layout offsets are saved per user on the current device, with a separate reset-layout action.
- Camera and layout changes never modify financial data. Added deterministic camera bounds and inverse-projection checks.

## [2026-10-08] - Integrations and 3D Capital Viewer

- Added two primary sidebar destinations, retaining all legacy pages and direct section links.
- Added a read-only spatial capital map with perspective projection, orbit/tilt/zoom, project filtering, node inspection, 2D mode and a relationship ledger using existing portfolio and deployment records.
- Preserved modeled-versus-recorded evidence boundaries and excluded voided payments. Flow totals count each allocation once.
- Added integration readiness cards for QuickBooks, Xero and Sage alongside the existing Gmail connection. Accounting connector authorization and synchronization remain pending implementation; no credentials or synthetic connection status are stored.
- Verified both workspaces in the running browser, including Stonepine node inspection against its recorded model budget.

## [2026-10-08] - Consolidated Enterprise Navigation

- Consolidated fourteen sidebar destinations into eight ordered workspaces with accessible sub-navigation.
- Paired capital overview with analytics, projects with financial models, and tasks with meetings; renamed outreach-era labels for the broader financial operating system.
- Preserved all underlying pages, data, legacy section query links and equipment-rental views. Project debt remains in Capital Campaigns rather than being mislabeled as company equity or JV capital.
- Added a navigation audit and destination-coverage tests. No financial records or charts were changed.

## [2026-10-07] - Visual Task Command Center

- Replaced the dark outreach-only copilot and unbounded task rows with an enterprise task workspace built from recorded task data.
- Added clickable workload metrics, due-window stacked bars, capital-workstream progress bars, search and governed five-record pagination.
- Added direct start, complete, reopen and edit actions plus task links to investors, campaigns and capital opportunities. Saving a task does not send outreach or create calendar activity.
- Extended owner-scoped task updates to preserve title, description, due date, status and linked-record context; no synthetic tasks were added.

## [2026-10-07] - Enterprise Analytics Workspace

- Replaced investor-only analytics cards with an interactive enterprise view across capital, projects and operating follow-through.
- Added capital-path target / weighted-pipeline / commitment / funding comparisons, project funding-coverage bars, project cost-versus-NOI analysis, capital-stage flow, campaign and meeting activity, connected-record counts and data-coverage indicators.
- Added management-attention links for overdue tasks, unrecorded meeting outcomes, missing opportunity actions and incomplete campaign setup.
- Preserved financial evidence boundaries: modeled requirements, probability-weighted requests, recorded commitments and funded proceeds remain separately labeled and calculated.
- Added deterministic aggregation checks. No synthetic operating, capital, meeting or campaign records were created.

## [2026-10-07] - Visual Meetings Workspace

- Replaced the flat Meetings tab with a selectable month calendar, weekly status chart, campaign-activity chart, clickable metrics and five-record agenda timeline.
- Added search, campaign/date/week/status filtering, Central Time scheduling, meeting editing/rescheduling, completion/cancellation status and agenda/outcome notes.
- Exposed existing capital-opportunity links for lender, JV and equipment conversations, with campaign-derived project context. Scheduling remains internal to FOS; no invitations or external calendar sync.
- Added owner-scoped link validation and update handling; creation now returns its exact inserted record. No sample meetings or database migrations required.

## [2026-10-07] - Development Equipment Plans

- Scoped 20 Chappell and 18 Stonepine equipment/service packages across civil works, building construction, production installation, commissioning and initial operations.
- Saved separate finance-candidate, rental and contractor-supplied strategies with quantity, relative-month windows, per-unit allowances, sourcing rationale and reference provenance.
- Added project/strategy and category charts, a 36-month acquisition/rental budget timeline, search, five-package pagination and editable audited revisions with stale-write protection.
- Added owner-scoped plan and immutable revision-snapshot tables, repeatable seed/verification scripts, and calculation/validation checks. Existing project budgets, loans, capital commitments and operational rental records remain unchanged.
- Identified Chappell's 100,000-SF versus 500 × 300-foot conceptual-footprint conflict. Published DFW rental references remain distinct from analyst allowances and contractual quotes.

## [2026-10-07] - Campaign Financing Workspace

- Added an interactive command center to each campaign: stage-filtered funnel and five-record queue, readiness blockers, instrument-specific underwriting inputs and calculations, and planned-use versus deployed-capital visuals.
- Linked capital allocations to campaigns so planned uses can flow through recipient and purpose without counting campaign targets as funded cash. Deleting a campaign releases those allocation links while preserving the allocation and payment records.
- Added saved inputs for equity valuation and runway, debt sizing and payment terms, JV contributions, equipment financing, and grant matching. Missing figures remain visibly unavailable until recorded.

- Created five active starter campaigns with 15 planning tasks; the company-equity campaign uses the saved $1M target and existing unassigned equity prospects. Project debt and JV campaigns link to Stonepine and the manufacturing facility respectively. Unrecorded financing amounts remain unset.
- Added live research-pool charts, campaign task-progress charts and project-requirement context, with research counts explicitly distinct from campaign membership and funding.
- Added a transactional starter script that skips categories already containing a campaign, preserving existing records on rerun.

- Added separate campaign views for company equity, project debt, project equity/JV, equipment finance, grants and unclassified records.
- Added persisted campaign recipient, project, target amount, owner, close date, objective and financing-term notes, with an additive database setup script.
- Replaced the default contact-count dashboard with selectable campaign cards, funded progress, capital comparisons, source-to-recipient diagrams, instrument milestone guides and campaign task queues.
- Added explicit attachment of unassigned capital opportunities; funding metrics read the existing opportunity records without adding commitments to funded proceeds.
- Preserved outreach batches and document workflows in an expandable section. Existing campaigns require explicit classification.
- Validated project ownership on campaign writes and campaign ownership on opportunity updates. Deleting a campaign now also unassigns its capital opportunities.

## [2026-10-06] - Visual JV Partner Intelligence

- Rebuilt the JV / Facility entry experience around an interactive Texas partner-intelligence workspace.
- Added a clickable Texas regional market view, sourced-partner qualification funnel, partner-archetype composition chart, and a five-partner priority queue.
- Added a selected-partner pathway that clearly separates the recorded partner, its stated focus, and possible contribution types; unrecorded information is shown as pending qualification rather than inferred.
- Qualification and conversion remain explicit human actions. The visual workspace neither drafts nor sends outreach.
- Moved source-record management and facility-opportunity intake into collapsed drawers, preserving the original full workflows without leading with long forms and queues.

## [2026-10-06] - Internal Project Dashboards

- Project selection now leads to a visual Project Dashboard with a scenario selector, sales/rental mix, recorded funding, development schedule, use-of-capital charts, and scenario comparisons.
- Internal Projects Overview now includes the existing portfolio comparison with direct View model navigation.
- Project details remain editable under a collapsed Edit project details panel.
- Planning-scenario availability is displayed separately from recorded ROI-result linkage, with direct access to projections and funding sources.
- Explicit scenario selection no longer silently falls back to another case when inputs are missing.
- Reuses existing saved models; no financial records are seeded or overwritten by this UI change.

## [2026-10-05] - Visual Capital Deployment and Sources-to-Uses Ledger

### Added

- Added the visual Investor Relationship Cockpit above the existing full investor record workflow:
  - Interactive investor pipeline-stage strip
  - Fit × relationship-momentum map with clickable investor points
  - Five-investor, priority-ranked shortlist
  - Selected-investor relationship score, capital profile, timeline, and next-best-move controls
- Preserved the existing detailed investor editor, AI research, outreach drafting, history summary, and attachment workflows below the cockpit.
- Rebuilt the Capital Dashboard around interactive financial visualizations:
  - Funding by capital path
  - Opportunity pipeline by stage
  - Funding source → project/internal destination → use-of-capital Sankey diagram
  - Use-of-capital composition chart
  - Project and Company-operations allocation comparison
  - Modeled deployment and recorded-payment timelines
- Added click-to-filter behavior across funding sources, projects, and use categories.
- Added a TiDB-backed capital-allocation ledger with explicit support for construction, land/site, equipment, payroll, insurance, software, professional services, working capital, contingency, and other uses.
- Added separate planned-allocation, committed-expenditure, and actual-payment measures.
- Added payment references, payment dates, retry-safe request keys, and reversible void/restore handling.
- Added `capital_allocations` and `capital_payments` tables and the idempotent `scripts/setupCapitalDeployment.mjs` setup utility.
- Added [`docs/capital-deployment-dashboard.md`](docs/capital-deployment-dashboard.md) describing the workflow, controls, accounting boundaries, and validation.

### Changed

- Project-model charts now use one primary scenario per project so alternative scenarios are not combined into portfolio totals.
- Existing project budgets populate the planning view immediately while recorded allocations and payments remain independently auditable.
- Funding commitments, funding received, expense commitments, payments, cash flow, and ROI remain distinct financial states.
- Allocation records can link equipment and operating needs to a project without duplicating the underlying amount.
- Dashboard audit lists use compact scrollable views instead of expanding the page with every record.

### Validation

- TypeScript validation passes with `pnpm check`.
- Capital-flow aggregation checks confirm totals, null-commitment handling, empty states, distinct dimensional nodes, and one-time counting through the Sankey flow.
- Live UI verification confirmed all six primary project budgets, interactive project filtering, Stonepine's current $64.75M primary modeled budget, and the allocation-entry workflow.
- Capital deployment tables were created successfully in the configured TiDB workspace without replacing existing records.
- No synthetic allocation or payment records were inserted during verification.

### Data-boundary notes

- Project model budgets are estimates and do not establish a funding source or prove a payment.
- A recorded payment is an application ledger entry; the application does not execute a bank transaction.
- Payroll, insurance, equipment, and other operating allocations are shown only when explicitly recorded rather than inferred from project estimates.

---

## [2026-09-20] - Initial Database Setup and CSV Data Import

### Added
- **TiDB Cloud Integration**: Successfully connected the Financial Operating System to TiDB Cloud Serverless database
- **Database Schema**: Applied all 31 Drizzle ORM migrations to create complete database schema
- **Environment Configuration**: Created `.env.local` with secure TiDB Cloud connection string
- **CSV Data Import**: Imported complete financial model data for 6 Internal Projects from CSV package
- **Setup Automation**: Created PowerShell script (`run-fos-setup.ps1`) for automated database setup
- **Documentation**: Added `fos-db-setup-task.md` with step-by-step setup instructions

### Database Setup
- Connected to TiDB Cloud cluster `ConstructionEnterprisesFOS` 
- Created `fos_db` database schema with 53 tables
- Applied all Drizzle migrations including project economics, ROI models, and capital management tables
- Configured SSL connection for secure database access

### Data Import Results
- **6 Internal Projects** imported with complete financial data:
  - Cedarwood Flats (280 units, 258,300 sq ft)
  - Garden Lofts (250 units, 125,000 sq ft)
  - Stonepine Residences (300 units, 570,000 sq ft)
  - Skyline Towers (450 units, 405,000 sq ft)
  - Chappell International Manufacturing Facility (4 units, 100,000 sq ft)
  - Garden Haven (100 units, 190,000 sq ft)
- **11 Financial Scenarios** created across all projects
- **144 Projection Assumptions** imported
- **1,584 Monthly Projection Lines** imported
- **20 Unit Mix Records** imported
- **6 Project Economics Models** created

### UI Improvements
- Updated "Seed six established projects" button to "Seed projects" for flexibility
- Removed hardcoded project count from UI text

### Configuration Files
- `.env.local` - Database connection string (TiDB Cloud)
- `run-fos-setup.ps1` - Automated setup script with secure credential handling
- `fos-db-setup-task.md` - Detailed setup and migration instructions

### Technical Details
- **Database**: TiDB Cloud Serverless (MySQL-compatible)
- **ORM**: Drizzle ORM with TypeScript
- **Package Manager**: pnpm
- **Connection**: SSL-enabled MySQL connection
- **Data Source**: CEFF_Internal_Project_Financial_Model_CSV_Package

### Security Notes
- Database credentials stored in `.env.local` (gitignored)
- Setup script uses secure credential input for passwords
- `.gitignore` properly configured to exclude environment files

### Known Issues
- Terminal keybinding issues in VS Code PowerShell (resolved by restarting IDE)
- Initial UI loading may require browser refresh after data import

### Migration Notes
- Database was empty prior to this setup
- All migrations applied successfully using custom import script
- No data loss occurred during setup process
- Existing project seed data preserved and enhanced with CSV imports

---

## Future Planned Changes
- [ ] Add unit tests for CSV import functionality
- [ ] Implement data validation for CSV imports
- [ ] Add error handling for duplicate data scenarios
- [ ] Create backup/restore procedures for database
- [ ] Add monitoring for database connection health

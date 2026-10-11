# FOS navigation audit — October 8, 2026

The sidebar previously mixed planning, capital sourcing, execution and evidence into fourteen equal destinations. Analytics was separated from the capital overview; project models were separated from project context; tasks and meetings were separated despite sharing follow-through records.

The sidebar now has eight primary workspaces, ordered from understanding the business through planning, financing and execution. Sub-navigation preserves all existing pages and their data.

| Workspace | Existing pages / new labels |
| --- | --- |
| Command Center | Capital Dashboard → Capital Overview; Analytics → Enterprise Analytics |
| Projects & Models | Internal Projects → Projects; ROI / Returns → Financial Models & Returns |
| Capital Campaigns | Campaigns → Capital Campaigns |
| Capital Sources | Equity Investors → Company Equity; JV / Facility → Project Partners & JV; Equipment Finance → Equipment Finance & Rental; Grants & Incentives |
| Action Center | Tasks; Meetings |
| Communications | Inbox |
| Records | Documents → Documents & Evidence |
| Settings | Settings |

## Boundaries and compatibility

- Company equity funds the operating company; project debt is a borrowing instrument, not company equity. Project partners/JV are not silently relabeled as lenders.
- There is no standalone project-debt source workspace today. Project-debt campaigns and underwriting remain in Capital Campaigns; the Capital Sources introduction makes this explicit.
- Equipment financing and rental retain their existing internal view switch. Grants retains its program, opportunity, application, award and compliance views.
- Legacy `section` query values and the `equipment_rentals` alias continue to resolve. Cross-links from analytics, projects and capital dashboards still select the same underlying section and consequently its new parent workspace.
- No financial records, campaigns, tasks, charts or funding states are migrated, deleted or synthesized. This change consolidates navigation, not accounting or data ownership.
- Primary and secondary navigation use labeled native buttons, current-page semantics, visible keyboard focus and touch-sized targets. Compact mobile navigation retains accessible names while hiding text.

## Verification

### Added workspaces — October 8 follow-up

The sidebar now has ten primary workspaces and sixteen underlying destinations. **3D Capital Viewer** follows Command Center and provides a read-only spatial exploration of existing models and deployment records. **Integrations** precedes Settings and shows Gmail status plus accounting connector implementation requirements. The original fourteen pages are unchanged. Both `capital_viewer` and `integrations` are accepted section query values. Browser checks confirmed both pages render and selecting Stonepine shows its $64,750,000 modeled allocation total. Accounting connectors remain unimplemented, not authorized or connected.

`npx vitest run server/workspace-navigation.test.ts` verifies all fourteen destinations belong exactly once to eight workspaces and cross-workspace mappings remain intact. Run `npm run check` and `npx vite build --configLoader runner` for application validation.

Verification in this session: direct Node assertions passed for all fourteen destinations and eight groups; TypeScript transpilation reported zero syntax errors in App and the navigation manifest. Full validation is currently blocked: Vitest encounters an EPERM realpath failure in its installed dependency tree, Vite cannot resolve `@builder.io/vite-plugin-jsx-loc`, and project-wide type-checking reports broad client/server dependency/type errors. The running UI has not been visually verified in this session.

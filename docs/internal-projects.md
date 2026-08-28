# Internal Projects

Internal Projects provide the project context that connects an operating plan, a financial model, and capital-formation work. They are not a fifth capital path and are not fundraising opportunities by themselves. Each project has an owner-scoped identity, lifecycle, program context, known relationships, capital needs, model context, and optional links to capital opportunities and documents.

## Current project set

| Project | Current repository treatment | Modeling note |
|---|---|---|
| Cedarwood Flats | Pilot project with the richest source package | $40M control WBS, unit program, 36-month schedule, estimated operating, financing, exit, and return cases |
| Garden Lofts | Imported project-specific planning package | Uses its own scenarios and project inputs; Cedarwood values are not copied |
| Stonepine Residences | Imported project-specific planning package | Maintains separate planning cases and scenario isolation |
| Skyline Towers | Imported package using the supplied project material | Preliminary planning values are labeled as estimated underwriting assumptions |
| Chappell International Manufacturing Facility | Imported manufacturing/facility planning package | Chappell's $300M reference is preserved as context and not silently treated as facility CapEx |
| Garden Haven | Imported project-specific planning package | Uses its own project data and planning scenarios |

## Project-model relationship

A project can have one or more Project Economics model shells. A model shell can have multiple scenarios, including historical planning, downside, base, upside, draft, active, and archived cases. The model scenario is the calculation context. It is not the project identity and does not overwrite project actuals.

Project capital needs are estimates of uses of capital. They can be linked to capital opportunities for planning and coordination, but the link does not mean a capital source is committed or funded. This distinction allows project teams to model a funding need before a lender, investor, partner, or grantmaker has approved a transaction.

## Project review workflow

The existing application exposes project context through Internal Projects and ROI / Returns → Projections. A user selects a project, reviews its primary populated planning scenario, examines the WBS and schedule, checks the driver provenance, compares scenarios, and then decides which project and capital-formation actions should proceed. The repository's CSV packages and manifests are intended to support controlled re-imports as project information improves.

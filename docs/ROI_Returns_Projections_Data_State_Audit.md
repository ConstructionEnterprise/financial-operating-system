# ROI / Returns Projections — Data-State Audit

## Live pilot scope

The Projections capability is a scenario-isolated layer inside ROI / Returns. Its initial pilot is the **Chappell International Manufacturing Facility** Internal Project and its existing 36-month Project Economics model shell.

| Audit field | Live result |
|---|---:|
| Project Economics horizon | 36 months |
| Projection scenario shells | 3: Downside, Base, Upside |
| Projection assumptions | 0 |
| Projection monthly lines | 0 |
| Governed project-economics inputs | 0 |
| Governed project-economics monthly items | 0 |
| Explicitly linked capital opportunities | 0 |
| Same-name ROI projects | 0 |

## Intentional unavailable outputs

No project cost, capital deployment, financing cost, funding draw, revenue, operating cost, CE capital contribution, or CE distribution has been entered. Accordingly, the live interface shows **Unavailable — insufficient inputs** for monthly operating performance, cumulative cash flow, capital deployment visualization, projected CE ROI trajectory, and projected payback. It does not treat missing values as zero, and it does not calculate projected IRR.

## Isolation rules

Projection scenarios store only forward-looking values marked **Projected** or **Estimated**. The design prohibits scenario inputs from changing Internal Project facts, capital-opportunity stages or totals, governed/actual Project Economics inputs, ROI project records, or return calculations. Each monetary line uses a signed convention: revenue, funding draws, and CE distributions are positive; operating cost, capital deployment, financing cost, and CE contributions are negative.

## Next validated input sequence

The next entry should be a source-backed project driver or monthly projection line—not a made-up scenario result. Appropriate first inputs include a facility budget, equipment quote, construction timing, operating-cost support, revenue support, or a documented funding term. Each entry requires a source reference, data state, effective date, owner, and notes.

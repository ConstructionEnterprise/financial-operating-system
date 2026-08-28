# ROI / Returns Projections Design

## Architectural boundary

**Internal Projects** identifies the project. **Capital domains** track potential, committed, and funded sources. **Project Economics** stores governed project inputs. **Projections** stores scenario-isolated forward-looking assumptions and monthly projection lines. **ROI / Returns** remains the canonical location for recorded/actual return analysis.

## Data model

Each Project Economics model can own three scenario containers: Downside, Base, and Upside. A scenario owns structured assumptions and monthly projection lines. A projection record must never write into an Internal Project, a Capital Opportunity, a Project Economics actual/recorded input, or an ROI project.

| Record | Required governance |
|---|---|
| Scenario | Model link, name/type, status, description; no financial values required to create it |
| Assumption | Category, metric, value, unit, period, state limited to Projected or Estimated, source, effective date, owner, notes |
| Monthly projection line | Scenario, month 1–36, explicit phase, metric category, value, state limited to Projected or Estimated, source, effective date, owner, notes |

## Eligibility gates

No chart will invent a zero for an omitted category. Revenue/cost/net operating result requires explicitly recorded revenue and operating-cost lines for the same month. Cumulative cash flow and projected payback require complete month-level revenue, operating cost, capital deployment, financing cost, and funding-draw lines. Projected CE ROI requires explicitly recorded CE capital contribution and CE distribution lines. Capital deployment requires at least one scenario-isolated deployment line or capital-deployment assumption.

Charts show only calculation-eligible data. Otherwise the workspace displays **Unavailable — insufficient inputs** and explains what input classes remain missing.

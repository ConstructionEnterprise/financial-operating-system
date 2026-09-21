# Cedarwood Schedule and Debt Visualization Verification

**Reference date:** August 21, 2026  
**Scenario boundary:** Cedarwood Flats historical planning scenario

## Rendered visualization state

The Cedarwood Schedule + Debt workspace now shows a horizontal bar chart of the already-authorized, reconciled historical WBS categories. The chart is labeled as a reverse-engineered historical planning allocation and explicitly disclaims use as a current budget, invoice record, capital commitment, or funded-capital view.

The monthly construction deployment and lease-up chart remains unavailable until 36 source-labeled schedule months are complete, construction allocation sums to 100.00%, and occupancy values are supplied. The debt-service and construction-stage cash-flow chart remains unavailable until the schedule and source-labeled financing terms are both complete.

## Responsive verification

Desktop verification confirmed the historical WBS chart renders alongside explicit schedule and financing data-gate panels. Mobile verification identified that the new finance and chart grid needed a more readable narrow-screen layout. The workspace now stacks the KPI, metadata, financing, and chart panels at 700 pixels and below, while preserving the horizontal WBS chart and its source labels.

## Populated historical planning controls

The visualization workspace now includes two additional charts that use only authorized Cedarwood historical planning controls: a development-cost versus annual-NOI reference chart and a $155/$160/$165-per-SF sensitivity chart with its corresponding implied gross-area calculation. Desktop and mobile checks confirmed that these charts render with the supplied figures and retain their historical-planning, non-current, and non-cash-flow labels. Monthly deployment, lease-up, debt-service, and construction-stage cash-flow charts remain gated because no monthly timing or financing terms have been sourced.

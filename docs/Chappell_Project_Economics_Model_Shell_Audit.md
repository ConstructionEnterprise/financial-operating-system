# Chappell International Manufacturing Facility — Project Economics Model Shell Audit

## Scope Created

The application now contains one owner-scoped **36-month Project Economics Model** linked directly to the existing **Chappell International Manufacturing Facility** Internal Project. Internal Projects remains the project-context authority. ROI / Returns remains the only calculation authority for project cash flow, ROI, IRR, payback, distributions, and multiples.

| Model element | Current state | Financial interpretation |
|---|---|---|
| Horizon | 36 months | Timeline shell only; no actual start date or phase timing is asserted. |
| Timeline reference | Predevelopment, Construction, Commissioning, Operating Ramp | Reference vocabulary only; no month is assigned a phase until entered with a governed monthly item. |
| Uses of capital | Land / lease, site, building, equipment, robotics, technology, soft costs, contingency, working capital | No amount or cost state has been recorded. |
| Operating model | Capacity, ramp, product mix, materials, labor, utilities, maintenance, logistics, staffing, overhead, revenue | No operating assumption or revenue value has been recorded. |
| Sources of capital | CE equity, JV / Facility, Equipment Finance, Grants & Incentives, other financing | No capital opportunity, commitment, draw, debt term, grant disbursement, or funding amount has been created. |
| Evidence context | Individual inputs can link current Document Library records | No model-input evidence link has been created. |
| Returns | **Unavailable — insufficient inputs** | No ROI, IRR, payback, distributions, or multiple is calculated. |

## Database Boundary Audit

The live model record is in `shell` status with a missing model-start date. The audit found **zero governed inputs, zero monthly items, zero input-document links, and zero capital opportunities linked to Chappell**. These results confirm that creation of the model shell did not create a financial assumption or cross-domain capital side effect.

> A missing value is not zero. Before returns analysis can begin, the model requires at least one recorded non-zero monthly inflow and one recorded non-zero monthly outflow, each marked Actual, Projected, or Estimated and accompanied by source, effective date, and owner metadata.

## Next Validated Inputs

The recommended first data sequence is a site or lease basis, a preliminary facility/soft-cost budget, the first equipment or robotics quote, a preliminary operating ramp/production plan, and an evidence-backed source-capital record. Each should be added as a governed input or a monthly item only after its supporting information is available.

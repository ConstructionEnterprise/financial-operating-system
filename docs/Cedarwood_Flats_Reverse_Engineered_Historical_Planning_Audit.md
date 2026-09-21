# Cedarwood Flats Reverse-Engineered Historical Planning Audit

**Reference date:** August 21, 2026  
**Source:** User-provided `pasted_content_21.txt`  
**Owner:** jchappell2120  
**Effective date:** Unknown / null

## Model controls and reconciliation

| Control | Recorded historical planning value |
|---|---:|
| Development control total | $40,000,000 |
| Units / buildings | 280 / 5 |
| Central planning cost basis | $160 per SF |
| Implied central gross area | 250,000 SF |
| Historical NOI | $4,750,000 |
| WBS lines / total | 100 / $40,000,000 |

The WBS reconciles exactly to the authorized control total. All 100 persisted lines are **estimated**, use the `reverse_engineered_allocation` source classification, and have null effective dates. The allocation is a historical planning reference, not an invoice, bid, current capital requirement, or cash-flow schedule.

## Safeguard verification

| Boundary | Result |
|---|---|
| Current Cedarwood capital needs created | No; 0 records |
| Cedarwood monthly projection lines created | No; 0 records |
| Same-name ROI model created | No; 0 records |
| Current ROI / IRR / payback eligibility | Unavailable |
| Historical planning scenario linkage | Yes; scenario 60004 |

## Interface verification

The Internal Projects → Cedarwood Pro Forma view displays the $40M control total, 280-unit / five-building program, 250,000-SF central case, $155/$160/$165-per-SF sensitivity, $4.75M historical NOI context, the seven category allocations, explicit project-to-projection handoffs, and the full 100-line WBS. It also explicitly labels Capital Needs as reference-only and Cash Flow / Returns as unavailable pending timing, operating, and financing inputs.

## Next source-recovery inputs

Replace individual allowances only with dated source material: land/site cost, bids or GMP, unit mix and rent assumptions, lease-up schedule, operating expense schedule, construction schedule, and financing terms.

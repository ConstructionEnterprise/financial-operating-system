# Cedarwood Schedule and Financing Verification

**Reference date:** August 21, 2026  
**Project:** Cedarwood Flats  
**Scenario boundary:** User-authorized historical planning scenario only

## Desktop verification

The Internal Projects → Schedule + Debt tab renders the source/provenance form, 36 editable monthly schedule rows, construction-allocation and lease-up fields, financing-term form, explicit completeness KPIs, source-date note, and debt-service / development-cash-flow gate. With no saved timing or financing sources, the workspace correctly prevents calculation rather than treating blank values as zero.

## Mobile verification

At a 375-pixel viewport, the command ribbon, metadata fields, monthly rows, financing terms, gate messages, and save actions remain present and vertically usable. The schedule table intentionally retains a compact four-column operating form; no unsupported debt service or return output appears.

## Calculation boundary

Debt service becomes available only after all 36 schedule months have phase, construction allocation, and occupancy entries; construction allocations total 100.00%; occupancy is non-decreasing; and complete source-labeled financing terms are saved. The calculated cash-flow view is explicitly limited to loan draw minus construction spend minus debt service. It excludes rental revenue, other income, operating expenses, taxes, reserves, distributions, ROI, IRR, and payback until those inputs are separately sourced.

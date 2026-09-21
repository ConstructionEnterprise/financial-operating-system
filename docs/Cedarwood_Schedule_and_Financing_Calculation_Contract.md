# Cedarwood Schedule and Financing Calculation Contract

## Scope

This component operates only in Cedarwood Flats’ historical planning scenario. It is not a current development budget, construction ledger, debt commitment, capital need, funded-capital record, or ROI model.

## Required monthly schedule inputs

Each of the 36 months must include an explicit lifecycle phase, construction-spend allocation, and occupancy / lease-up percentage. Construction allocation is stored in basis points and must sum to 10,000 basis points (100.00%). Occupancy must be non-decreasing. A blank field is missing data; it is never interpreted as zero.

## Required financing inputs

The financing record requires loan amount, annual interest rate in basis points, debt term, amortization period, interest-only period, closing/draw month, source reference, owner, data state, and an optional effective date. A null effective date explicitly means source date unknown.

## Calculation

When complete, the schedule applies each monthly construction percentage to the WBS total. The financing engine records the specified loan draw at the closing month, calculates interest on the outstanding balance, applies principal only after the interest-only period, and reports monthly debt service.

> **Construction-stage cash flow before operations** = loan draw − construction spend − debt service.

This calculation excludes rents, concessions, other income, operating expenses, taxes, reserves, distributions, equity returns, ROI, IRR, and payback. Those measures remain unavailable until their own complete source-backed inputs are recorded.

# Full-development equipment working plans — October 7, 2026

User requested equipment scope for Chappell International and Stonepine, split between finance and rental with visual data. The plans are persisted in `equipment_development_plans`, keyed by owner and Internal Project. Every saved revision has a full snapshot in `equipment_development_plan_audit`; editing uses a row lock and expected revision to reject stale saves. Seed reruns preserve existing rows and edits. No external procurement action is performed.

## Recorded scope and proposed procurement

| Project | Recorded basis | Finance-candidate acquisition allowance | Rental base allowance | Unpriced contractor packages |
|---|---|---:|---:|---:|
| Chappell International Manufacturing Facility | Saginaw; approximately 100,000 SF; LGS/modular production, robotics and material handling | $2,135,000 | $294,000 | 6 |
| Stonepine Residences | 200 homes; 1,750 SF average; 350,000 residential SF | $115,000 | $427,450 | 7 |

These are initial planning estimates, not a complete development budget or debt principal. Costed scope totals $2,971,450 across both projects. There are 38 packages: 13 finance candidates, 12 rentals and 13 contractor service packages. Finance quantities are not loan approvals or confirmed assets. Existing fleet is unknown.

Chappell: proposed durable assets include one LGS production line, four panel/jig stations, fabrication tooling, one robotic pilot, one gantry/overhead handling package, two factory forklifts, racking/conveyance, compressed air/extraction and QA/maintenance equipment. Rent temporary access, telehandler, power and site facilities. Civil plant, concrete/paving, erection crane, machinery installation, module transport and MEP commissioning are scoped as contractor services.

Stonepine: proposed finance candidates are two field utility vehicles, two service trailers, two reusable tool kits and one retained-rental maintenance kit. Rent telehandlers, track loader, compact excavator, access lift, temporary power, office/storage and finishing tools. Survey/geotechnical, bulk civil/utility fleet, roads, foundations, specialized module lifting, MEP and hauling remain contractor scope. This assumes CE is not self-performing bulk civil work; changing that strategy requires a staffed-fleet plan.

Factory equipment is counted only under Chappell, even if its products supply Stonepine. Site equipment has separate project windows. Calendar alignment and transfer logistics are not established, so no fleet-sharing savings are claimed.

## Cost provenance

- [On Track Equipment, Weatherford / DFW](https://www.ontrackequipment.com/equipment-rentals-in-weatherford-tx-you-can-count-on/): public page dated January 12, 2026, reviewed October 7, 2026. Reference monthly rates used: 6,000-lb / 42-ft telehandler $3,075; 10,000-lb / 54-ft telehandler $4,500; 45-ft articulating boom $3,000; 60-ft straight boom $4,500. These are not quotes for CE or guaranteed delivered prices. Quantities and durations are analyst assumptions.
- [FRAMECAD F450iT](https://framecad.com/steel-framing-machines/f450it): capability reference for steel framing. No published acquisition price is represented. The roll-former budget is an analyst allowance, not a FRAMECAD quote or selected model.
- [Sunbelt US terms](https://www.sunbeltrentals.com/legal/terms-and-conditions/us/): reference for 4-week/hour-based rental billing and excluded charges. Supplier-specific terms must govern actual contracts; do not automatically equate a calendar month with a 4-week period.
- All other cost inputs are explicit analyst allowances dated October 7, 2026. No loan APR, advance rate, term, monthly debt service or residual value has been invented.

## Calculations and exclusions

Finance-candidate budget = quantity × unit acquisition allowance. Rental budget = quantity × unit planning-month rate × (end month − start month + 1). Acquisition timing places gross equipment cost at first use for visualization only. Rental timing spreads base rental expense over inclusive active months. Monthly chart totals reconcile to the line-item budgets. Contractor packages have null costs and are excluded, never counted as zero-priced work.

Freight, sales/use tax, delivery/pickup, fuel, labor/operators, damage protection, insurance, financing charges, installation and commissioning labor remain outside the priced base scope. They must be priced before procurement. Service packages are also unpriced. Existing project WBS may already include these costs; this seed does not add them to the $41M Chappell or $64.75M Stonepine budgets, campaigns or capital allocations.

## Decisions still required

1. Resolve Chappell's 100,000-SF recorded scope versus 150,000-SF conceptual footprint (500 × 300 ft).
2. Confirm lot/site drawings, construction methods, approved production cadence, factory layout, loads and equipment specifications with qualified designers and OEMs.
3. Confirm existing fleet and trade subcontract inclusions before owner rentals or purchases.
4. Obtain delivered quotes and evaluate long-duration rentals against acquisition plus financing, maintenance, resale and utilization. The dashboard does not claim an optimized least-cost solution.
5. Map packages to existing WBS allowances; establish procurement calendar, staff, insurance and safety responsibilities.

## Verification

`node scripts/verifyEquipmentDevelopmentPlans.ts` checks both seed schemas, unique keys, invalid values/strategy inputs, inclusive rental duration, null contractor costs and 36-month total reconciliation. `node scripts/seedEquipmentDevelopmentPlans.ts --verify` validates persisted rows and corresponding audit revisions. The seed resolves exact project names within the local workspace and fails on changed core program sizes. It never overwrites an existing plan.

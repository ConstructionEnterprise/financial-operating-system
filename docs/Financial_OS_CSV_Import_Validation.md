# Financial OS CSV Import Validation

The six standardized CSV packages were imported for owner `jchappell2120` through the idempotent `importInternalProjectCsvPackages` path. The import created or updated **11 scenario-isolated planning cases** across the six Internal Projects. Each imported case has 100 WBS budget rows, a 36-month planning schedule, one financing-term record, and 252 monthly projection-series rows.

The row-level validation confirmed the following controlled WBS totals: Cedarwood Flats $40.0M; Garden Lofts $90.0M; Stonepine Residences $174.6M base and $156.0M optimized; Skyline Towers $200.0M low, $185.0M base, and $175.0M high; Chappell International Manufacturing Facility $41.0M; and Garden Haven $13.2M low, $11.5M base, and $10.4M high. All values remain estimated planning data, not actuals, commitments, or funded capital.

The ROI / Returns Projections workspace exposes all six Internal Projects in its selector. Direct URL targeting with `project=garden_lofts` did not override the currently selected Chappell context during browser verification, so project selection remains available through the on-screen Internal Project selector rather than relying on that unverified query key.

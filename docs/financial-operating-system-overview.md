# Financial Operating System Overview

## Purpose

The CE/FF Financial Operating System is designed to convert capital formation from a collection of disconnected emails, opportunities, spreadsheets, and project notes into a governed operating rhythm. It keeps the company-building, real-estate, equipment, and non-dilutive-capital risks separate while making the aggregate funding plan visible.

The system is not a generic customer relationship manager. Its core object is a capital prospect or project requirement moving through a defined formation, qualification, commitment, funding, deployment, and return lifecycle. The financial model layer extends that workflow by turning project drivers into monthly schedules and comparable scenario outputs.

## Operating model

The platform has two complementary layers. The capital-formation layer manages who might provide capital, how the relationship is progressing, what approval is required, and what the next action is. The project-underwriting layer manages what a project needs, how that need is modeled over time, what assumptions drive the result, and how the result changes under different scenarios.

The aggregate dashboard is a coordination layer rather than a blending mechanism. It can show targets, committed capital, weighted pipeline, open gaps, modeled requirements, deployment, and returns, but it does not make a prospect a commitment or a planning estimate a funded amount.

## Core workflow

A typical project workflow starts with an Internal Project record. The project may then have one or more Project Economics model shells and independently defined scenarios. Each scenario contains source-aware drivers such as unit mix, rent, occupancy, other income, operating expense, development cost, schedule, financing, exit assumptions, and sponsor economics. The engine converts those drivers into monthly schedules and derived metrics. The portfolio read model makes the comparable fields visible alongside the project-specific work surface.

## Current baseline

The standalone repository preserves the CE/FF application at the point where all six Internal Projects have been imported into governed model entities. The database has been seeded through reproducible scripts and the approved project CSV packages are included under `data/csv-import-packages/`. The application is intended to remain extensible so the Cedarwood pilot can become the reusable architecture for every Internal Project.

## Important model interpretation

The numbers in this repository are not uniformly actuals. Many are historical planning references or estimated underwriting assumptions prepared for financing conversations. Users must inspect the data state, source reference, effective date, and owner before relying on a value. In particular, Cedarwood's $40M control case and $4.75M NOI reference are preserved as planning anchors; they are not a claim of actual cost, actual income, or guaranteed return.

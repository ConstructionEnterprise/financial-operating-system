# Architecture

## System layers

The repository is organized around a React client, an Express and tRPC server, shared TypeScript contracts, and Drizzle schema definitions. The client presents the existing Financial OS workspaces. The server owns protected procedures, database reads and writes, import services, and calculation orchestration. Shared modules contain domain types and pure calculations so the same rules can be tested independently of the browser.

```text
React workspaces
      |
      v
 tRPC procedures
      |
      +--> protected domain services
      |         |
      |         +--> Drizzle ORM -> MySQL/TiDB
      |         +--> shared calculations
      |
      +--> portfolio read models
      |
      +--> import and validation scripts
```

## Application boundaries

The original outreach system remains the base application, but it is now a broader operating system. Outreach, investor intelligence, communications, and campaigns are one operational domain. Capital paths are specialized domains that share an opportunity foundation but retain their own fields and lifecycle. Internal Projects are project context, not a fifth capital path. Project Economics and ROI / Returns are the governed modeling domains.

The database is the system of record for owner-scoped operational and model entities. S3-backed storage is used for file bytes where supported; database records retain metadata and authorization context. The repository contains schema and migration definitions, but not a production database dump.

## Modeling data flow

Financial model data follows this sequence:

```text
source-backed driver
      -> scenario input register
      -> monthly schedule
      -> operating/debt/cash-flow calculation
      -> scenario comparison
      -> portfolio read model
      -> UI visualization
```

The flow is intentionally one-directional for projected scenarios. Projections are isolated from actual ROI records, capital opportunities, and project identity. A scenario may inform a funding conversation, but the model does not silently write a commitment or funded-capital event.

## Repository conventions

Application code stays in the root structure required by the existing build system. Financial-model inputs and approved artifacts live under `data/`, project-level documentation lives under `models/`, and explanatory material lives under `docs/`. Scripts are reproducible and should accept stable file paths or explicit configuration rather than embedding credentials or environment-specific secrets.

Tests are colocated under `server/` according to the existing Vitest configuration. Pure calculation contracts also have direct tests. Any schema change must be reflected in `drizzle/schema.ts`, generated through the project migration workflow, applied through the database migration process, and covered by read/write or isolation tests.

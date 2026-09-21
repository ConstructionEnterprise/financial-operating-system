# Task: Wire up TiDB Cloud connection and get FOS local dev running

## Context
This is the Construction Enterprises Financial Operating System (FOS) repo
(`financial-operating-system`). It's a pnpm monorepo using Drizzle ORM
against a MySQL-dialect database (TiDB Cloud Serverless in this case).
Local dev has been blocked on a missing/invalid `DATABASE_URL` — the app
needs a live DB connection to create the workspace user and seed the six
internal projects (Cedarwood Flats, Garden Lofts, Stonepine Residences,
Skyline Towers, Chappell International Manufacturing, Garden Haven).

A TiDB Cloud Serverless cluster named `ConstructionEnterprisesFOS` has
already been created, and a `fos_db` database has already been created
inside it via the TiDB SQL Editor. Connection parameters are in
`.env.local` (see below) — DO NOT print, log, or echo the contents of any
`.env*` file back to me in full; just confirm it parses/connects.

**Note**: This task was completed on 2026-09-20. Database setup is fully operational and CSV financial data has been imported successfully. See CHANGELOG.md for details.

## Ground rules
- Do NOT create, rename, or delete any database other than `fos_db`.
- Do NOT commit `.env` or `.env.local` — confirm they're covered by
  `.gitignore` before touching anything else, and add them if missing.
- Do NOT push to any remote branch. Local changes only.
- If any step requires overwriting or deleting existing data (tables,
  rows, migrations), STOP and ask me first before proceeding.
- If a step is ambiguous or the repo doesn't match what's described
  below, stop and tell me what you found instead of guessing.

## Steps

1. Confirm `.env` and `.env.local` are listed in `.gitignore`. Add them
   if not.

2. Check whether `.env.local` (or `.env`) already exists with a
   `DATABASE_URL` value. If not, create `.env.local` with:
   ```
   DATABASE_URL=mysql://<TIDB_USER>:<TIDB_PASSWORD>@<TIDB_HOST>:4000/fos_db?ssl={"rejectUnauthorized":true}
   ```
   Pull `<TIDB_USER>`, `<TIDB_PASSWORD>`, and `<TIDB_HOST>` from the shell
   environment variables `TIDB_USER`, `TIDB_PASSWORD`, and `TIDB_HOST` if
   they're set (this script sets them before invoking you — see the
   companion `run-fos-setup.sh`). Never hardcode the password into any
   file you create or into your own output.

3. Inspect `package.json` and report which scripts exist for:
   - a Drizzle schema push/migration (commonly `db:push`,
     `drizzle-kit push`, or similar)
   - starting the dev server (commonly `dev`)
   Use the actual script names found — don't assume.

4. Run the schema push/migration script against `fos_db`. Show me the
   output. If it fails, diagnose the error (check `drizzle/schema.ts`
   and `drizzle.config.ts` for dialect/connection mismatches) and propose
   a fix — but don't apply schema changes beyond what's needed to make
   the push succeed without asking me first.

5. Run the dev server script. Confirm in the logs that:
   - the workspace user is created successfully (not the earlier
     "Failed to create workspace user" error)
   - local data seeding completes
   - the server binds to a port successfully
   Report the final terminal output and the URL to open.

6. Summarize what changed (files created/modified, commands run) in a
   short list at the end. Do not include the database password in this
   summary.
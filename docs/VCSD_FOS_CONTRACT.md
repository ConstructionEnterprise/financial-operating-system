# VCSD ↔ FOS contract

The file-based bridge between the VCSD Godot world and FOS. All paths are on
Joshua's laptop. Nothing here touches the database directly — FOS-side scripts
use FOS's own `server/db.ts` like `scripts/seedVcInvestorSandbox.ts` does.

## FOS → VCSD: live opportunity stages (#10)

- Writer: `FOS repo/scripts/snapshotVcStages.ts` (read-only; needs `SHARED_INBOX`)
- File: `D:\GodotProjects\vcsd\fos_stages.json`
- Shape: `{ "updated_at": "<iso>", "stages": { "<firm>": "<stage>", ... } }`
- Reader: VCSD polls every 15s, updates the HUD pills + colors, logs changes.
- Run the writer by hand or on a schedule whenever stages change:
  `SHARED_INBOX=chappellintl@gmail.com npx tsx scripts/snapshotVcStages.ts`

## VCSD → FOS: persona email replies (#3)

- Writer: VCSD queues a reply in `user://vcsd_outbox.json` on every building
  exit. On the laptop that is
  `%APPDATA%\Godot\app_userdata\VCSD\vcsd_outbox.json`.
- Shape: `{ "replies": [ { "firm", "persona", "to", "subject", "body",
  "warmth": "warm|medium|cold", "created_at", "ingested": false } ] }`
- Warmth → suggested FOS stage movement:
  - `warm` (pitch meeting ≥ 7/9) → advance opportunity toward `engaged`
  - `medium` (meeting ≥ 4 or visit rapport ≥ 6) → `contacted`
  - `cool` → leave at `identified` (or mark declined per FOS convention)
- Ingestion must translate these relationship labels before updating a capital
  opportunity: its stage enum has `outreach` and `meeting`, not `contacted`
  and `engaged`. The contract calls the lowest warmth `cold` in its shape but
  `cool` here; confirm the Godot payload before building the ingest mapping.
- Ingestion (not built yet): a FOS-side script reads replies with
  `ingested == false`, records the inbound email against the matching sandbox
  investor contact + campaign, advances the opportunity stage, then flips
  `ingested` to `true`. Never mail the six real investor addresses or the
  `@ce-ff.invalid` placeholders — replies here are simulation artifacts.

## FOS → VCSD: event inbox (#2)

- File: `D:\GodotProjects\vcsd\fos_events.json`
- Shape: `{ "events": [ { "type", "firm", "at", "detail" } ] }`
- Types: `email_sent`, `followup_sent`, `stage_changed`.
- VCSD polls it every 15s and reacts in-world (toast notification, dialogue changes).
- FOS writer: `server/vcsdEvents.ts`, called after a successful Gmail send or
  an actual capital-opportunity stage change. It writes only for the ten
  seeded `[SANDBOX]` contacts, preserves existing events, and replaces the
  JSON file atomically. Set `VCSD_EVENTS_PATH` to override the default path
  for local tests. File-write checks passed; live Godot receipt remains unverified.
- Demo writer: `tools\simulate_fos_events.py` remains available on the Godot side.

## LLM brains (#1)

- Pilot: Derek Cole (Shadow Ventures) — "Talk freely (AI pilot)" in his
  dialogue opens a free-text chat panel.
- Backend: dedicated Ollama server on `127.0.0.1:11435` (the main :11434
  server belongs to the Factory Crew pilot — do not disturb it).
- Start it: `powershell -ExecutionPolicy Bypass -File D:\GodotProjects\vcsd\tools\start_ollama.ps1`
  (WMI-persistent; models from `D:\ollama-models`; `OLLAMA_KEEP_ALIVE=24h`).
- Pilot model is `gemma3:1b` (~11 tok/s on the laptop CPU; qwen3:4b was ~1.6 tok/s
  and takes minutes to load, so it was rejected for the live pilot).
- `tools\warm_ollama.ps1` still targets qwen3:4b — update it to gemma3:1b or retire it.
- IMPORTANT: Godot's HTTPRequest must use `127.0.0.1`, never `localhost`
  (IPv6 `::1` connection refused — Ollama binds `127.0.0.1`).
- Expand the pilot: add firm indexes to `LLM_PILOT_FIRMS` in `scripts/main.gd`.

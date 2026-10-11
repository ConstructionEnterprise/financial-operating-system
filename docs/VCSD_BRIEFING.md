# Briefing: VCSD (VC Sandbox) — the receiving end for FOS

_For Codex. You don't share context with the Godot side of this project; this
document is your orientation. Paths are on Joshua's laptop._

## What VCSD is

VCSD is a native Godot 4.7.2 3D world: a dusk campus with ten enterable
buildings, one per capital partner. Each firm has a themed interior,
receptionist, staff NPCs, a partner with dialogue, a dossier, an elevator, and
persistent visit memory. Ten fictional sandbox personas in total:

- **5 VCs:** Foundamental (Jonas Weber), Brick & Mortar Ventures (Maya Chen),
  Shadow Ventures (Derek Cole), Nirman Ventures (Arjun Mehta),
  Construct Capital (Sarah Lawson)
- **3 private banks:** Meridian Trust Bank (Elena Vasquez),
  Foundry Private Bank (James Okafor), Bluebonnet Capital Bank (Rachel Kim)
- **2 JV partners:** Terra Firma Developments (Marcus Webb),
  Lone Star Builders Group (Sofia Delgado)

One persona has an LLM brain pilot: Derek Cole talks freely via a local
Ollama server (gemma3:1b) on `127.0.0.1:11435`. The personas react
**in character and distinctly** — skeptical VCs, covenant-minded bankers,
control-focused JV partners.

VCSD lives at `D:\GodotProjects\vcsd`. It is **not** in this repo. The Godot
side is owned by Muse; your work is FOS-side.

## The doctrine

**FOS is the machine; VCSD is the receiving end.**

Every FOS fundraising mechanism — campaigns, outreach emails, follow-ups,
stage advancement — gets deployed against the sandbox **first**. The loop:

1. Build the mechanism in FOS.
2. Run it against the ten sandbox contacts (never real investors).
3. Watch the personas react: VCSD shows the effects in-world and queues
   persona replies.
4. Iterate on copy, timing, and stage logic until it survives the sandbox.
5. Only then point it at real investors.

VCSD is a test harness growing into a dynamic simulator — not a rehearsal toy.

## The bridge contract (file-based, all on this laptop)

Three JSON files connect the two systems. Full spec:
`D:\GodotProjects\vcsd\tools\VCSD_FOS_CONTRACT.md`.

| Direction | File | Status |
|---|---|---|
| FOS → VCSD: live opportunity stages | `D:\GodotProjects\vcsd\fos_stages.json` (writer: `scripts/snapshotVcStages.ts`) | Built and verified end-to-end; writer not yet scheduled |
| FOS → VCSD: events (`email_sent`, `followup_sent`, `stage_changed`) | `D:\GodotProjects\vcsd\fos_events.json` | FOS writer now hooked to successful sends and changed opportunity stages; live Godot receipt not yet verified |
| VCSD → FOS: persona replies (`warm`/`medium`/`cool`) | `%APPDATA%\Godot\app_userdata\VCSD\vcsd_outbox.json` | VCSD queues on every building exit; **FOS ingestion not built** |

Warmth → suggested stage movement: `warm` → advance toward `engaged`;
`medium` → `contacted`; lowest warmth → leave at `identified`.
The copied contract calls the lowest value `cold`, while an earlier briefing
called it `cool`; confirm the Godot payload before implementing ingestion.
Also, `contacted` and `engaged` are investor relationship stages, not valid
capital-opportunity stages (`outreach` and `meeting` are the nearest workflow
states). Reply ingestion needs an explicit mapping rather than a direct write.

## What to build in FOS (your work list)

1. **Event writer** — implemented in `server/vcsdEvents.ts` and the FOS
   mutations. It appends only events for the ten seeded sandbox identities;
   live receipt by the Godot world still needs verification.
2. **Outbox ingestion** — a script that reads `vcsd_outbox.json` entries with
   `ingested == false`, records the inbound email against the matching
   sandbox investor contact + campaign, advances the opportunity stage per the
   warmth mapping, then flips `ingested` to `true`.
3. **Stage snapshot scheduling** — run `snapshotVcStages.ts` on a schedule
   (or trigger it on stage change) so the world's HUD stays live.
4. **Gmail OAuth wiring** — required before ANY live send. Until then:
   drafts only.
5. **(Optional)** `debt` capitalPath — banks currently seed contacts only
   because the `capitalPath` enum has no debt option.

Follow the existing script patterns: `scripts/seedVcInvestorSandbox.ts`
(idempotent seeding) and `scripts/prepareSandboxOutreach.ts` (campaign prep).
Both use FOS's own `server/db.ts` — never touch the database directly.

## Safety boundaries (hard rules)

- **NEVER** mail the 6 real investor emails or the 44 `@ce-ff.invalid`
  placeholders.
- Sandbox mail goes **only** to the ten declared
  `chappellintl+<local>@gmail.com` addresses in
  `data/vc-investor-sandbox/agents.json`; arbitrary plus-addresses are rejected.
- Every sandbox record is labeled `[SANDBOX]`; all personas are fictional.
- **Sandbox-only sending is enforced in code** (`server/gmail.ts`,
  `server/routers.ts`): while `OUTREACH_SANDBOX_ONLY` is not `"false"` (the
  default), the send path refuses any recipient that is not one of those ten
  seeded addresses, and `SHARED_INBOX` must be `chappellintl@gmail.com`.
  Flip the flag deliberately when real outreach begins.
- tsx scripts **must** call `process.exit(0)` at the end — the mysql2 pool
  keeps the process alive indefinitely otherwise.

## Current state (2026-10-10)

- Campaign **"VC Sandbox — First Outreach"** (id `60001`): all 10 sandbox
  contacts linked, tailored drafts per capital type, status `drafted`,
  nothing sent. Find it under the **Unclassified** tab in Capital Campaigns.
- Campaign "VC Investor Sandbox — Seed Outreach" (id `30001`): the original
  seed record.
- 10 sandbox investor_contacts (types VC / Bank / JV Partner), 7
  capital_opportunities (5 `equity` + 2 `facility_jv`).

## Not in scope for you

- The Godot world, its scripts, and its UI (Muse owns those).
- The Ollama persona brains. The dedicated VCSD server is on `:11435`;
  the `:11434` server belongs to the Factory Crew pilot — do not disturb it.

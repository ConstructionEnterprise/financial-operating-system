import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { join, sep } from "node:path";
import { eventForSandboxContact, publishVcsdEvent } from "./vcsdEvents";
import { sandboxAgentForEmail } from "./vcsdIdentity";

const priorInbox = process.env.SHARED_INBOX;
const priorPath = process.env.VCSD_EVENTS_PATH;
let directory: string;

beforeEach(async () => {
  directory = await mkdtemp(join(process.cwd(), ".vcsd-events-test-"));
  process.env.SHARED_INBOX = "chappellintl@gmail.com";
  process.env.VCSD_EVENTS_PATH = join(directory, "fos_events.json");
});
afterEach(async () => {
  if (priorInbox === undefined) delete process.env.SHARED_INBOX; else process.env.SHARED_INBOX = priorInbox;
  if (priorPath === undefined) delete process.env.VCSD_EVENTS_PATH; else process.env.VCSD_EVENTS_PATH = priorPath;
  if (directory.startsWith(process.cwd() + sep)) await rm(directory, { recursive: true, force: true });
});

describe("VCSD event writer", () => {
  const sandbox = { email: "chappellintl+vc-foundamental@gmail.com", firmName: "[SANDBOX] Foundamental" };

  it("accepts only an exact seeded sandbox identity", () => {
    expect(sandboxAgentForEmail(sandbox.email)?.firm).toBe("Foundamental");
    expect(sandboxAgentForEmail("chappellintl+not-seeded@gmail.com")).toBeNull();
    expect(eventForSandboxContact({ ...sandbox, type: "email_sent", detail: "Sent" })?.firm).toBe("Foundamental");
    expect(eventForSandboxContact({ ...sandbox, email: "real-investor@example.com", type: "email_sent", detail: "Sent" })).toBeNull();
    expect(eventForSandboxContact({ ...sandbox, email: "chappellintl+not-seeded@gmail.com", type: "email_sent", detail: "Sent" })).toBeNull();
    expect(eventForSandboxContact({ ...sandbox, firmName: "Foundamental", type: "email_sent", detail: "Sent" })).toBeNull();
    delete process.env.SHARED_INBOX;
    expect(eventForSandboxContact({ ...sandbox, type: "email_sent", detail: "Sent" })).toBeNull();
  });

  it("appends contract-shaped events without losing earlier events", async () => {
    await Promise.all([
      publishVcsdEvent({ ...sandbox, type: "email_sent", detail: "Initial outreach sent from FOS", at: new Date("2026-10-10T12:00:00Z") }),
      publishVcsdEvent({ ...sandbox, type: "followup_sent", detail: "Follow-up sent from FOS", at: new Date("2026-10-10T13:00:00Z") }),
    ]);
    const saved = JSON.parse(await readFile(process.env.VCSD_EVENTS_PATH!, "utf8"));
    expect(saved.events).toEqual([
      { type: "email_sent", firm: "Foundamental", at: "2026-10-10T12:00:00.000Z", detail: "Initial outreach sent from FOS" },
      { type: "followup_sent", firm: "Foundamental", at: "2026-10-10T13:00:00.000Z", detail: "Follow-up sent from FOS" },
    ]);
  });

  it("does not write non-sandbox activity or overwrite malformed existing data", async () => {
    expect(await publishVcsdEvent({ email: "real@example.com", firmName: "Real Investor", type: "stage_changed", detail: "identified → meeting" })).toBe(false);
    const path = process.env.VCSD_EVENTS_PATH!;
    await expect(readFile(path)).rejects.toMatchObject({ code: "ENOENT" });
    await writeFile(path, '{"unexpected":true}');
    await expect(publishVcsdEvent({ ...sandbox, type: "stage_changed", detail: "identified → diligence" })).rejects.toThrow("events array");
    expect(await readFile(path, "utf8")).toBe('{"unexpected":true}');
  });
});

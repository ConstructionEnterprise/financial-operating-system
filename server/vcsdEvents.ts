import { readFile, writeFile, rename, mkdir, unlink } from "node:fs/promises";
import { dirname } from "node:path";
import { randomUUID } from "node:crypto";
import { sandboxAgentForEmail } from "./vcsdIdentity.ts";

type VcsdEventType = "email_sent" | "followup_sent" | "stage_changed";
type VcsdEvent = { type: VcsdEventType; firm: string; at: string; detail: string };
const defaultEventsPath = "D:/GodotProjects/vcsd/fos_events.json";
let writeTail: Promise<void> = Promise.resolve();

/** Only the ten seeded contacts, with their sandbox label, may create VCSD events. */
export function eventForSandboxContact(input: {
  email: string;
  firmName: string;
  type: VcsdEventType;
  detail: string;
  at?: Date;
}): VcsdEvent | null {
  const agent = sandboxAgentForEmail(input.email);
  if (!agent || input.firmName !== `[SANDBOX] ${agent.firm}`) return null;
  return { type: input.type, firm: agent.firm, at: (input.at ?? new Date()).toISOString(), detail: input.detail };
}

async function appendEvent(path: string, event: VcsdEvent) {
  let existing: { events: VcsdEvent[] } = { events: [] };
  try {
    const contents = await readFile(path, "utf8");
    const parsed: unknown = JSON.parse(contents);
    if (!parsed || typeof parsed !== "object" || !Array.isArray((parsed as { events?: unknown }).events)) {
      throw new Error("VCSD event file must contain an events array");
    }
    existing = parsed as { events: VcsdEvent[] };
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
  }
  await mkdir(dirname(path), { recursive: true });
  const temporary = `${path}.${randomUUID()}.tmp`;
  try {
    await writeFile(temporary, JSON.stringify({ ...existing, events: [...existing.events, event] }, null, 2), { flag: "wx" });
    await rename(temporary, path);
  } catch (error) {
    await unlink(temporary).catch(() => undefined);
    throw error;
  }
}

/** Returns false for non-sandbox contacts; never writes their events to VCSD. */
export function publishVcsdEvent(input: Parameters<typeof eventForSandboxContact>[0]): Promise<boolean> {
  const event = eventForSandboxContact(input);
  if (!event) return Promise.resolve(false);
  const path = process.env.VCSD_EVENTS_PATH || defaultEventsPath;
  const pending = writeTail.then(() => appendEvent(path, event));
  writeTail = pending.catch(() => undefined);
  return pending.then(() => true);
}

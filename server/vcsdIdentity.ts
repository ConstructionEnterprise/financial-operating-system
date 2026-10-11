import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

type SandboxAgent = { firm: string; emailLocal: string; email: string };
const agentsFile = join(dirname(fileURLToPath(import.meta.url)), "../data/vc-investor-sandbox/agents.json");
const agents = (JSON.parse(readFileSync(agentsFile, "utf8")) as { agents: SandboxAgent[] }).agents;

/** Fail closed unless the address is one of the ten declared VCSD recipients. */
export function sandboxAgentForEmail(email: string): SandboxAgent | null {
  const inbox = (process.env.SHARED_INBOX || "").trim().toLowerCase();
  if (inbox !== "chappellintl@gmail.com") return null;
  const normalized = email.trim().toLowerCase();
  return agents.find((agent) => normalized === agent.email.toLowerCase()
    && normalized === `chappellintl+${agent.emailLocal.toLowerCase()}@gmail.com`) ?? null;
}

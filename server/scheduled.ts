import type { Express } from "express";
import crypto from "node:crypto";
import { and, isNotNull, isNull, lte, eq } from "drizzle-orm";
import { investorContacts } from "../drizzle/schema";
import { getDb, getWorkspaceUser, updateInvestorContact, addOutreachEvent } from "./db";
import { sendGmailMessage } from "./gmail";
import { publishVcsdEvent } from "./vcsdEvents";

export function isAuthorizedFollowUpJob(authorization: string | undefined, secret: string | undefined): boolean {
  if (!secret || secret.length < 32 || !authorization?.startsWith("Bearer ")) return false;
  const supplied = Buffer.from(authorization.slice(7));
  const expected = Buffer.from(secret);
  return supplied.length === expected.length && crypto.timingSafeEqual(supplied, expected);
}

export function registerScheduledRoutes(app: Express) {
  app.post("/api/scheduled/runDueFollowUps", async (req, res) => {
    if (!isAuthorizedFollowUpJob(req.get("authorization"), process.env.SCHEDULED_JOB_SECRET))
      return res.status(401).json({ error: "Scheduled follow-ups are disabled or unauthorized." });
    try {
      const owner = await getWorkspaceUser();
      const db = await getDb();
      if (!owner || !db) return res.json({ ok: true, skipped: "owner-or-db-unavailable" });
      const due = await db.select().from(investorContacts).where(and(eq(investorContacts.ownerId, owner.id), lte(investorContacts.followUpDueAt, new Date()), isNotNull(investorContacts.initialSentAt), isNull(investorContacts.followUpSentAt)));
      let sent = 0;
      for (const contact of due) {
        if ((contact.status !== "sent" && contact.status !== "replied") || !contact.followUpSubject || !contact.followUpBody) continue;
        try {
          await sendGmailMessage(owner.id, contact.email, contact.followUpSubject, contact.followUpBody);
          await publishVcsdEvent({ email: contact.email, firmName: contact.firmName, type: "followup_sent", detail: "Scheduled six-month follow-up sent from FOS" })
            .catch((error) => console.warn("VCSD scheduled follow-up event could not be written:", error));
          await updateInvestorContact(owner.id, contact.id, { followUpSentAt: new Date(), status: "sent" });
          await addOutreachEvent(owner.id, contact.id, "followup_sent", "Six-month follow-up sent by scheduled handler");
          sent++;
        } catch (error) {
          await addOutreachEvent(owner.id, contact.id, "followup_failed", error instanceof Error ? error.message : "Unknown Gmail error");
        }
      }
      return res.json({ ok: true, sent, examined: due.length });
    } catch (error) {
      return res.status(500).json({ error: error instanceof Error ? error.message : "scheduled follow-up failed", timestamp: new Date().toISOString() });
    }
  });
}

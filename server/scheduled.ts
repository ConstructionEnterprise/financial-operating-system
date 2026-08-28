import type { Express } from "express";
import { and, isNotNull, isNull, lte, eq } from "drizzle-orm";
import { investorContacts } from "../drizzle/schema";
import { getDb, getUserByOpenId, updateInvestorContact, addOutreachEvent } from "./db";
import { sdk } from "./_core/sdk";
import { ENV } from "./_core/env";
import { sendGmailMessage } from "./gmail";

export function registerScheduledRoutes(app: Express) {
  app.post("/api/scheduled/runDueFollowUps", async (req, res) => {
    try {
      const user = await sdk.authenticateRequest(req as any).catch(() => null) as any;
      if (!user?.isCron || !user.taskUid) return res.status(403).json({ error: "cron-only" });
      const owner = await getUserByOpenId(ENV.ownerOpenId);
      const db = await getDb();
      if (!owner || !db) return res.json({ ok: true, skipped: "owner-or-db-unavailable" });
      const due = await db.select().from(investorContacts).where(and(eq(investorContacts.ownerId, owner.id), lte(investorContacts.followUpDueAt, new Date()), isNotNull(investorContacts.initialSentAt), isNull(investorContacts.followUpSentAt)));
      let sent = 0;
      for (const contact of due) {
        if (contact.status === "opted_out" || contact.status === "bounced" || contact.status === "paused" || !contact.followUpSubject || !contact.followUpBody) continue;
        try {
          await sendGmailMessage(owner.id, contact.email, contact.followUpSubject, contact.followUpBody);
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

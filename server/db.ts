import { eq, desc, and } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, users, investorContacts, outreachEvents, gmailConnections, campaigns, tasks, meetings, fundraisingDocuments, campaignDocuments, investorDocuments, investorResearchProposals, investorResearchSources, capitalBuckets, capitalOpportunities, capitalOpportunityDocuments, facilityJvDetails, equipmentFinanceDetails, grantDetails, grantFundingPrograms, grantFundingOpportunities, grantFundingApplications, grantFundingAwards, grantAwardDisbursements, grantComplianceItems, jvPartnerProspects, equipmentRentalVendors, equipmentRentalRequirements, equipmentRentalQuotes, equipmentActiveRentals, InsertInvestorContact, InsertCampaign, InsertTask, InsertMeeting, InsertFundraisingDocument, InsertCapitalOpportunity } from "../drizzle/schema";
import { internalProjects } from "../drizzle/schema";
import { capitalPathMeta, capitalPaths, type CapitalPath } from "../shared/capitalFormation";
import { planTexasJvMasterUniverseImport } from "./texasJvMasterUniverse";
import { loadTexasEquipmentRentalMasterUniverse, planTexasEquipmentRentalMasterUniverseImport } from "./texasEquipmentRentalMasterUniverse";
import { planTexasGrantsIncentivesMasterUniverseImport, type TexasGrantsIncentivesMasterRecord } from "./texasGrantsIncentivesMasterUniverse";
import { scoreGrantOpportunity } from "../shared/grantIncentives";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try { _db = drizzle(process.env.DATABASE_URL); }
    catch (error) { console.warn("[Database] Failed to connect:", error); _db = null; }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) throw new Error("User openId is required for upsert");
  const db = await getDb();
  if (!db) return;
  const values: InsertUser = { openId: user.openId };
  const updateSet: Record<string, unknown> = {};
  for (const field of ["name", "email", "loginMethod"] as const) {
    if (user[field] !== undefined) { values[field] = user[field] ?? null; updateSet[field] = user[field] ?? null; }
  }
  if (user.lastSignedIn !== undefined) { values.lastSignedIn = user.lastSignedIn; updateSet.lastSignedIn = user.lastSignedIn; }
  if (user.role !== undefined) { values.role = user.role; updateSet.role = user.role; }
  else if (user.openId === ENV.ownerOpenId) { values.role = 'admin'; updateSet.role = 'admin'; }
  if (!values.lastSignedIn) values.lastSignedIn = new Date();
  if (Object.keys(updateSet).length === 0) updateSet.lastSignedIn = new Date();
  await db.insert(users).values(values).onDuplicateKeyUpdate({ set: updateSet });
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb(); if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result[0];
}

export async function listInvestorContacts(ownerId: number) {
  const db = await getDb(); if (!db) return [];
  return db.select().from(investorContacts).where(eq(investorContacts.ownerId, ownerId)).orderBy(desc(investorContacts.fitScore), desc(investorContacts.createdAt));
}

export async function findInvestorContactByEmail(ownerId: number, email: string) {
  const db = await getDb(); if (!db) return undefined;
  const rows = await db.select().from(investorContacts).where(and(eq(investorContacts.ownerId, ownerId), eq(investorContacts.email, email.trim().toLowerCase()))).limit(1);
  return rows[0];
}

export async function createInvestorContact(ownerId: number, contact: Omit<InsertInvestorContact, "ownerId">) {
  const db = await getDb(); if (!db) throw new Error("Database unavailable");
  const normalizedEmail = contact.email.trim().toLowerCase();
  const existing = await findInvestorContactByEmail(ownerId, normalizedEmail);
  if (existing) return { duplicate: true as const, contact: existing };
  const result = await db.insert(investorContacts).values({ ...contact, email: normalizedEmail, ownerId });
  return { duplicate: false as const, result };
}

export async function updateInvestorContact(ownerId: number, id: number, patch: Partial<Omit<InsertInvestorContact, "ownerId" | "id">>) {
  const db = await getDb(); if (!db) throw new Error("Database unavailable");
  await db.update(investorContacts).set(patch).where(and(eq(investorContacts.id, id), eq(investorContacts.ownerId, ownerId)));
  const rows = await db.select().from(investorContacts).where(and(eq(investorContacts.id, id), eq(investorContacts.ownerId, ownerId))).limit(1);
  return rows[0];
}

export async function addOutreachEvent(ownerId: number, contactId: number, kind: string, detail?: string) {
  const db = await getDb(); if (!db) throw new Error("Database unavailable");
  await db.insert(outreachEvents).values({ ownerId, contactId, kind, detail });
}

export async function getInvestorContact(ownerId: number, id: number) {
  const db = await getDb(); if (!db) return undefined;
  const rows = await db.select().from(investorContacts).where(and(eq(investorContacts.ownerId, ownerId), eq(investorContacts.id, id))).limit(1);
  return rows[0];
}

export async function getGmailConnectionSecret(ownerId: number) {
  const db = await getDb(); if (!db) return undefined;
  const rows = await db.select().from(gmailConnections).where(eq(gmailConnections.ownerId, ownerId)).limit(1);
  return rows[0];
}

export async function getGmailConnection(ownerId: number) {
  const db = await getDb(); if (!db) return undefined;
  const rows = await db.select({ id: gmailConnections.id, ownerId: gmailConnections.ownerId, email: gmailConnections.email, connectedAt: gmailConnections.connectedAt }).from(gmailConnections).where(eq(gmailConnections.ownerId, ownerId)).limit(1);
  return rows[0];
}

export async function upsertGmailConnection(ownerId: number, email: string, refreshTokenEncrypted?: string) {
  const db = await getDb(); if (!db) throw new Error("Database unavailable");
  const set: Record<string, unknown> = { email, connectedAt: new Date() };
  if (refreshTokenEncrypted) set.refreshTokenEncrypted = refreshTokenEncrypted;
  await db.insert(gmailConnections).values({ ownerId, email, refreshTokenEncrypted }).onDuplicateKeyUpdate({ set });
  return getGmailConnection(ownerId);
}


export async function listCampaigns(ownerId: number) {
  const db = await getDb(); if (!db) return [];
  return db.select().from(campaigns).where(eq(campaigns.ownerId, ownerId)).orderBy(desc(campaigns.createdAt));
}

export async function createCampaign(ownerId: number, input: Omit<InsertCampaign, "ownerId">) {
  const db = await getDb(); if (!db) throw new Error("Database unavailable");
  await db.insert(campaigns).values({ ...input, ownerId });
  const rows = await db.select().from(campaigns).where(eq(campaigns.ownerId, ownerId)).orderBy(desc(campaigns.id)).limit(1);
  return rows[0];
}

export async function updateCampaign(ownerId: number, id: number, patch: Partial<Omit<InsertCampaign, "ownerId" | "id">>) {
  const db = await getDb(); if (!db) throw new Error("Database unavailable");
  await db.update(campaigns).set(patch).where(and(eq(campaigns.ownerId, ownerId), eq(campaigns.id, id)));
  const rows = await db.select().from(campaigns).where(and(eq(campaigns.ownerId, ownerId), eq(campaigns.id, id))).limit(1);
  return rows[0];
}

export async function deleteCampaign(ownerId: number, id: number) {
  const db = await getDb(); if (!db) throw new Error("Database unavailable");
  await db.update(investorContacts).set({ campaignId: null }).where(and(eq(investorContacts.ownerId, ownerId), eq(investorContacts.campaignId, id)));
  await db.update(tasks).set({ campaignId: null }).where(and(eq(tasks.ownerId, ownerId), eq(tasks.campaignId, id)));
  await db.update(meetings).set({ campaignId: null }).where(and(eq(meetings.ownerId, ownerId), eq(meetings.campaignId, id)));
  await db.delete(campaigns).where(and(eq(campaigns.ownerId, ownerId), eq(campaigns.id, id)));
  return { success: true } as const;
}

export async function listFundraisingDocuments(ownerId: number) {
  const db = await getDb(); if (!db) return [];
  return db.select().from(fundraisingDocuments).where(eq(fundraisingDocuments.ownerId, ownerId)).orderBy(desc(fundraisingDocuments.createdAt));
}

export async function createFundraisingDocument(ownerId: number, input: Omit<InsertFundraisingDocument, "ownerId">) {
  const db = await getDb(); if (!db) throw new Error("Database unavailable");
  await db.insert(fundraisingDocuments).values({ ...input, ownerId });
  const rows = await db.select().from(fundraisingDocuments).where(eq(fundraisingDocuments.ownerId, ownerId)).orderBy(desc(fundraisingDocuments.id)).limit(1);
  return rows[0];
}

export async function updateFundraisingDocument(ownerId: number, id: number, patch: Partial<Omit<InsertFundraisingDocument, "ownerId" | "id" | "storageKey" | "storageUrl" | "mimeType" | "sizeBytes">>) {
  const db = await getDb(); if (!db) throw new Error("Database unavailable");
  await db.update(fundraisingDocuments).set(patch).where(and(eq(fundraisingDocuments.ownerId, ownerId), eq(fundraisingDocuments.id, id)));
  const rows = await db.select().from(fundraisingDocuments).where(and(eq(fundraisingDocuments.ownerId, ownerId), eq(fundraisingDocuments.id, id))).limit(1);
  return rows[0];
}

export async function listCampaignDocumentLinks(ownerId: number) {
  const db = await getDb(); if (!db) return [];
  return db.select().from(campaignDocuments).where(eq(campaignDocuments.ownerId, ownerId));
}

export async function linkDocumentToCampaign(ownerId: number, campaignId: number, documentId: number) {
  const db = await getDb(); if (!db) throw new Error("Database unavailable");
  const [campaign] = await db.select().from(campaigns).where(and(eq(campaigns.ownerId, ownerId), eq(campaigns.id, campaignId))).limit(1);
  const [document] = await db.select().from(fundraisingDocuments).where(and(eq(fundraisingDocuments.ownerId, ownerId), eq(fundraisingDocuments.id, documentId))).limit(1);
  if (!campaign || !document) throw new Error("Campaign or document not found.");
  await db.insert(campaignDocuments).values({ ownerId, campaignId, documentId }).onDuplicateKeyUpdate({ set: { createdAt: new Date() } });
  return { success: true } as const;
}

export async function unlinkDocumentFromCampaign(ownerId: number, campaignId: number, documentId: number) {
  const db = await getDb(); if (!db) throw new Error("Database unavailable");
  await db.delete(campaignDocuments).where(and(eq(campaignDocuments.ownerId, ownerId), eq(campaignDocuments.campaignId, campaignId), eq(campaignDocuments.documentId, documentId)));
  return { success: true } as const;
}

export async function deleteFundraisingDocument(ownerId: number, documentId: number) {
  const db = await getDb(); if (!db) throw new Error("Database unavailable");
  await db.delete(campaignDocuments).where(and(eq(campaignDocuments.ownerId, ownerId), eq(campaignDocuments.documentId, documentId)));
  await db.delete(investorDocuments).where(and(eq(investorDocuments.ownerId, ownerId), eq(investorDocuments.documentId, documentId)));
  await db.delete(fundraisingDocuments).where(and(eq(fundraisingDocuments.ownerId, ownerId), eq(fundraisingDocuments.id, documentId)));
  return { success: true } as const;
}

export async function listInvestorDocumentLinks(ownerId: number, contactId?: number) {
  const db = await getDb(); if (!db) return [];
  const condition = contactId === undefined ? eq(investorDocuments.ownerId, ownerId) : and(eq(investorDocuments.ownerId, ownerId), eq(investorDocuments.contactId, contactId));
  return db.select().from(investorDocuments).where(condition);
}

export async function linkDocumentToInvestor(ownerId: number, contactId: number, documentId: number) {
  const db = await getDb(); if (!db) throw new Error("Database unavailable");
  const [contact] = await db.select().from(investorContacts).where(and(eq(investorContacts.ownerId, ownerId), eq(investorContacts.id, contactId))).limit(1);
  const [document] = await db.select().from(fundraisingDocuments).where(and(eq(fundraisingDocuments.ownerId, ownerId), eq(fundraisingDocuments.id, documentId), eq(fundraisingDocuments.status, "current"))).limit(1);
  if (!contact || !document) throw new Error("Investor or current document not found.");
  await db.insert(investorDocuments).values({ ownerId, contactId, documentId }).onDuplicateKeyUpdate({ set: { createdAt: new Date() } });
  return { success: true } as const;
}

export async function unlinkDocumentFromInvestor(ownerId: number, contactId: number, documentId: number) {
  const db = await getDb(); if (!db) throw new Error("Database unavailable");
  await db.delete(investorDocuments).where(and(eq(investorDocuments.ownerId, ownerId), eq(investorDocuments.contactId, contactId), eq(investorDocuments.documentId, documentId)));
  return { success: true } as const;
}

export async function listTasks(ownerId: number) {
  const db = await getDb(); if (!db) return [];
  return db.select().from(tasks).where(eq(tasks.ownerId, ownerId)).orderBy(desc(tasks.dueAt), desc(tasks.createdAt));
}

export async function createTask(ownerId: number, input: Omit<InsertTask, "ownerId">) {
  const db = await getDb(); if (!db) throw new Error("Database unavailable");
  await db.insert(tasks).values({ ...input, ownerId });
  const rows = await db.select().from(tasks).where(eq(tasks.ownerId, ownerId)).orderBy(desc(tasks.id)).limit(1);
  return rows[0];
}

export async function updateTask(ownerId: number, id: number, status: InsertTask["status"]) {
  const db = await getDb(); if (!db) throw new Error("Database unavailable");
  await db.update(tasks).set({ status }).where(and(eq(tasks.ownerId, ownerId), eq(tasks.id, id)));
}

export async function listMeetings(ownerId: number) {
  const db = await getDb(); if (!db) return [];
  return db.select().from(meetings).where(eq(meetings.ownerId, ownerId)).orderBy(desc(meetings.scheduledAt));
}

export async function createMeeting(ownerId: number, input: Omit<InsertMeeting, "ownerId">) {
  const db = await getDb(); if (!db) throw new Error("Database unavailable");
  await db.insert(meetings).values({ ...input, ownerId });
  const rows = await db.select().from(meetings).where(eq(meetings.ownerId, ownerId)).orderBy(desc(meetings.id)).limit(1);
  return rows[0];
}

export async function getFundraisingAnalytics(ownerId: number) {
  const db = await getDb(); if (!db) return { total: 0, responseRate: 0, positiveRate: 0, meetingsBooked: 0, byStage: [] as Array<{ stage: string; count: number }> };
  const contacts = await db.select().from(investorContacts).where(eq(investorContacts.ownerId, ownerId));
  const meetingRows = await db.select().from(meetings).where(and(eq(meetings.ownerId, ownerId), eq(meetings.status, "scheduled")));
  const total = contacts.length;
  const responded = contacts.filter((c) => ["replied"].includes(c.status)).length;
  const positive = contacts.filter((c) => ["engaged", "meeting", "diligence", "committed"].includes(c.relationshipStage)).length;
  const stageCounts = new Map<string, number>();
  contacts.forEach((c) => stageCounts.set(c.relationshipStage, (stageCounts.get(c.relationshipStage) || 0) + 1));
  return { total, responseRate: total ? Math.round((responded / total) * 100) : 0, positiveRate: total ? Math.round((positive / total) * 100) : 0, meetingsBooked: meetingRows.length, byStage: Array.from(stageCounts, ([stage, count]) => ({ stage, count })) };
}

export async function ensureCapitalBuckets(ownerId: number) {
  const db = await getDb(); if (!db) throw new Error("Database unavailable");
  for (const capitalPath of capitalPaths) await db.insert(capitalBuckets).values({ ownerId, capitalPath, targetAmount: capitalPathMeta[capitalPath].defaultTarget, description: capitalPathMeta[capitalPath].description }).onDuplicateKeyUpdate({ set: { capitalPath } });
  return listCapitalBuckets(ownerId);
}

export async function listCapitalBuckets(ownerId: number) {
  const db = await getDb(); if (!db) return [];
  return db.select().from(capitalBuckets).where(eq(capitalBuckets.ownerId, ownerId));
}

export async function updateCapitalBucket(ownerId: number, capitalPath: CapitalPath, patch: { targetAmount?: number; description?: string | null }) {
  const db = await getDb(); if (!db) throw new Error("Database unavailable");
  await db.update(capitalBuckets).set(patch).where(and(eq(capitalBuckets.ownerId, ownerId), eq(capitalBuckets.capitalPath, capitalPath)));
  const rows = await db.select().from(capitalBuckets).where(and(eq(capitalBuckets.ownerId, ownerId), eq(capitalBuckets.capitalPath, capitalPath))).limit(1);
  return rows[0];
}

export type JvPartnerProspectInput = Omit<typeof jvPartnerProspects.$inferInsert, "id" | "ownerId" | "createdAt" | "updatedAt" | "convertedCapitalOpportunityId">;

export async function listJvPartnerProspects(ownerId: number) {
  const db = await getDb(); if (!db) return [];
  return db.select().from(jvPartnerProspects).where(eq(jvPartnerProspects.ownerId, ownerId)).orderBy(desc(jvPartnerProspects.priority), desc(jvPartnerProspects.updatedAt));
}

export async function getJvPartnerProspect(ownerId: number, id: number) {
  const db = await getDb(); if (!db) return undefined;
  const rows = await db.select().from(jvPartnerProspects).where(and(eq(jvPartnerProspects.ownerId, ownerId), eq(jvPartnerProspects.id, id))).limit(1);
  return rows[0];
}

export async function createJvPartnerProspect(ownerId: number, prospect: JvPartnerProspectInput) {
  const db = await getDb(); if (!db) throw new Error("Database unavailable");
  await db.insert(jvPartnerProspects).values({ ...prospect, ownerId });
  const rows = await db.select().from(jvPartnerProspects).where(and(eq(jvPartnerProspects.ownerId, ownerId), eq(jvPartnerProspects.organizationName, prospect.organizationName))).limit(1);
  return rows[0];
}

export type TexasJvMasterImportRecord = { organizationName: string; partnerType: string; region: string; website: string; sourceUrl: string; priority: "A" | "B" | "C"; priorityRationale: string; strategicFit: "High" | "Medium" | "Low" };

export async function importTexasJvMasterUniverse(ownerId: number, records: TexasJvMasterImportRecord[]) {
  const db = await getDb(); if (!db) throw new Error("Database unavailable");
  const existing = await db.select({ organizationName: jvPartnerProspects.organizationName }).from(jvPartnerProspects).where(eq(jvPartnerProspects.ownerId, ownerId));
  const plan = planTexasJvMasterUniverseImport(records, existing.map((record) => record.organizationName));
  const researchDate = new Date("2026-08-20T00:00:00.000Z");

  for (const record of plan.inserts) {
    await db.insert(jvPartnerProspects).values({
      ownerId,
      organizationName: record.organizationName,
      partnerType: record.partnerType,
      region: record.region,
      website: record.website,
      assetFocus: record.partnerType.replaceAll("_", " "),
      strategicFit: record.strategicFit,
      priority: record.priority,
      priorityRationale: record.priorityRationale,
      jvThesis: "Source-attributed Texas JV universe record. Human qualification is required before a partnership opportunity is created.",
      source: "Verified public-source Texas JV master universe",
      sourceUrl: record.sourceUrl,
      researchDate,
      status: "research",
      nextAction: "Review source evidence and prepare a qualification brief.",
    });
  }
  return { total: records.length, inserted: plan.inserted, skipped: plan.skipped, status: "research" as const };
}

export async function updateJvPartnerProspect(ownerId: number, id: number, patch: Partial<JvPartnerProspectInput>) {
  const db = await getDb(); if (!db) throw new Error("Database unavailable");
  await db.update(jvPartnerProspects).set(patch).where(and(eq(jvPartnerProspects.ownerId, ownerId), eq(jvPartnerProspects.id, id)));
  return getJvPartnerProspect(ownerId, id);
}

export async function convertJvProspectToCapitalOpportunity(ownerId: number, id: number) {
  const db = await getDb(); if (!db) throw new Error("Database unavailable");
  const prospect = await getJvPartnerProspect(ownerId, id);
  if (!prospect) throw new Error("JV prospect not found.");
  if (prospect.status !== "qualified") throw new Error("Qualify this prospect before creating a JV opportunity.");
  if (prospect.convertedCapitalOpportunityId) return getCapitalOpportunity(ownerId, prospect.convertedCapitalOpportunityId);
  const result = await db.insert(capitalOpportunities).values({ ownerId, capitalPath: "facility_jv", organizationName: prospect.organizationName, opportunityName: prospect.jvThesis?.slice(0, 255) || `${prospect.organizationName} JV opportunity`, contactName: prospect.contactName, contactRole: prospect.contactTitle, email: prospect.email, contactUrl: prospect.website, stage: "researching", requestedAmount: null, committedAmount: 0, fundedAmount: 0, probability: prospect.priority === "A" ? 25 : 10, source: prospect.source, termsNotes: prospect.ceRelevance, nextAction: prospect.nextAction || "Prepare partnership qualification brief" });
  const opportunityId = Number(result[0].insertId);
  await db.update(jvPartnerProspects).set({ status: "converted", convertedCapitalOpportunityId: opportunityId }).where(and(eq(jvPartnerProspects.ownerId, ownerId), eq(jvPartnerProspects.id, id)));
  return getCapitalOpportunity(ownerId, opportunityId);
}

export async function listCapitalOpportunities(ownerId: number, capitalPath?: CapitalPath) {
  const db = await getDb(); if (!db) return [];
  const condition = capitalPath ? and(eq(capitalOpportunities.ownerId, ownerId), eq(capitalOpportunities.capitalPath, capitalPath)) : eq(capitalOpportunities.ownerId, ownerId);
  return db.select().from(capitalOpportunities).where(condition).orderBy(desc(capitalOpportunities.updatedAt));
}

export async function getCapitalOpportunity(ownerId: number, id: number) {
  const db = await getDb(); if (!db) return undefined;
  const rows = await db.select().from(capitalOpportunities).where(and(eq(capitalOpportunities.ownerId, ownerId), eq(capitalOpportunities.id, id))).limit(1);
  return rows[0];
}

async function assertOwnedInternalProject(ownerId: number, internalProjectId: number | null | undefined) {
  if (internalProjectId === null || internalProjectId === undefined) return;
  const db = await getDb(); if (!db) throw new Error("Database unavailable");
  const rows = await db.select({ id: internalProjects.id }).from(internalProjects).where(and(eq(internalProjects.ownerId, ownerId), eq(internalProjects.id, internalProjectId))).limit(1);
  if (!rows[0]) throw new Error("Internal Project not found for this workspace owner.");
}

export async function createCapitalOpportunity(ownerId: number, opportunity: Omit<InsertCapitalOpportunity, "ownerId">) {
  const db = await getDb(); if (!db) throw new Error("Database unavailable");
  await assertOwnedInternalProject(ownerId, opportunity.internalProjectId);
  await db.insert(capitalOpportunities).values({ ...opportunity, ownerId });
  const rows = await db.select().from(capitalOpportunities).where(eq(capitalOpportunities.ownerId, ownerId)).orderBy(desc(capitalOpportunities.id)).limit(1);
  return rows[0];
}

export async function updateCapitalOpportunity(ownerId: number, id: number, patch: Partial<Omit<InsertCapitalOpportunity, "ownerId" | "id">>) {
  const db = await getDb(); if (!db) throw new Error("Database unavailable");
  await assertOwnedInternalProject(ownerId, patch.internalProjectId);
  await db.update(capitalOpportunities).set(patch).where(and(eq(capitalOpportunities.ownerId, ownerId), eq(capitalOpportunities.id, id)));
  return getCapitalOpportunity(ownerId, id);
}

export async function bootstrapEquityCapitalOpportunities(ownerId: number) {
  const db = await getDb(); if (!db) throw new Error("Database unavailable");
  await ensureCapitalBuckets(ownerId);
  const [contacts, opportunities] = await Promise.all([listInvestorContacts(ownerId), listCapitalOpportunities(ownerId, "equity")]);
  const linked = new Set(opportunities.map((opportunity) => opportunity.linkedInvestorId).filter((id): id is number => id !== null));
  for (const contact of contacts.filter((contact) => !linked.has(contact.id))) await db.insert(capitalOpportunities).values({ ownerId, capitalPath: "equity", organizationName: contact.firmName, contactName: contact.contactName, email: contact.email, contactUrl: contact.contactUrl, stage: contact.relationshipStage === "contacted" ? "outreach" : contact.relationshipStage === "engaged" || contact.relationshipStage === "meeting" ? "meeting" : contact.relationshipStage === "diligence" ? "diligence" : contact.relationshipStage === "committed" ? "committed" : contact.relationshipStage === "passed" ? "passed" : contact.relationshipStage === "researched" ? "researching" : "identified", requestedAmount: contact.checkSizeMax, committedAmount: 0, probability: contact.relationshipStage === "committed" ? 100 : contact.relationshipStage === "diligence" ? 60 : contact.relationshipStage === "meeting" || contact.relationshipStage === "engaged" ? 35 : contact.relationshipStage === "contacted" ? 15 : 5, linkedInvestorId: contact.id, campaignId: contact.campaignId, source: contact.source, termsNotes: contact.notes, nextAction: contact.nextAction, nextActionDueAt: contact.nextActionDueAt });
  return listCapitalOpportunities(ownerId, "equity");
}

export async function listCapitalOpportunityDocumentLinks(ownerId: number, capitalOpportunityId?: number) {
  const db = await getDb(); if (!db) return [];
  const condition = capitalOpportunityId === undefined ? eq(capitalOpportunityDocuments.ownerId, ownerId) : and(eq(capitalOpportunityDocuments.ownerId, ownerId), eq(capitalOpportunityDocuments.capitalOpportunityId, capitalOpportunityId));
  return db.select().from(capitalOpportunityDocuments).where(condition);
}

export async function linkDocumentToCapitalOpportunity(ownerId: number, capitalOpportunityId: number, documentId: number) {
  const db = await getDb(); if (!db) throw new Error("Database unavailable");
  const [opportunity, documents] = await Promise.all([getCapitalOpportunity(ownerId, capitalOpportunityId), db.select().from(fundraisingDocuments).where(and(eq(fundraisingDocuments.ownerId, ownerId), eq(fundraisingDocuments.id, documentId), eq(fundraisingDocuments.status, "current"))).limit(1)]);
  if (!opportunity || !documents[0]) throw new Error("Capital opportunity or current document not found.");
  await db.insert(capitalOpportunityDocuments).values({ ownerId, capitalOpportunityId, documentId }).onDuplicateKeyUpdate({ set: { createdAt: new Date() } });
  return { success: true } as const;
}

export async function unlinkDocumentFromCapitalOpportunity(ownerId: number, capitalOpportunityId: number, documentId: number) {
  const db = await getDb(); if (!db) throw new Error("Database unavailable");
  await db.delete(capitalOpportunityDocuments).where(and(eq(capitalOpportunityDocuments.ownerId, ownerId), eq(capitalOpportunityDocuments.capitalOpportunityId, capitalOpportunityId), eq(capitalOpportunityDocuments.documentId, documentId)));
  return { success: true } as const;
}

export async function getFacilityJvDetail(ownerId: number, capitalOpportunityId: number) {
  const db = await getDb(); if (!db) return undefined;
  const rows = await db.select().from(facilityJvDetails).where(and(eq(facilityJvDetails.ownerId, ownerId), eq(facilityJvDetails.capitalOpportunityId, capitalOpportunityId))).limit(1);
  return rows[0];
}

export async function upsertFacilityJvDetail(ownerId: number, capitalOpportunityId: number, patch: Omit<typeof facilityJvDetails.$inferInsert, "id" | "ownerId" | "capitalOpportunityId" | "createdAt" | "updatedAt">) {
  const db = await getDb(); if (!db) throw new Error("Database unavailable");
  if (!(await getCapitalOpportunity(ownerId, capitalOpportunityId))) throw new Error("Capital opportunity not found.");
  await db.insert(facilityJvDetails).values({ ownerId, capitalOpportunityId, ...patch }).onDuplicateKeyUpdate({ set: patch });
  return getFacilityJvDetail(ownerId, capitalOpportunityId);
}

export async function getEquipmentFinanceDetail(ownerId: number, capitalOpportunityId: number) {
  const db = await getDb(); if (!db) return undefined;
  const rows = await db.select().from(equipmentFinanceDetails).where(and(eq(equipmentFinanceDetails.ownerId, ownerId), eq(equipmentFinanceDetails.capitalOpportunityId, capitalOpportunityId))).limit(1);
  return rows[0];
}

export async function listEquipmentFinanceDetails(ownerId: number) {
  const db = await getDb(); if (!db) return [];
  return db.select().from(equipmentFinanceDetails).where(eq(equipmentFinanceDetails.ownerId, ownerId)).orderBy(desc(equipmentFinanceDetails.updatedAt));
}

export async function upsertEquipmentFinanceDetail(ownerId: number, capitalOpportunityId: number, patch: Omit<typeof equipmentFinanceDetails.$inferInsert, "id" | "ownerId" | "capitalOpportunityId" | "createdAt" | "updatedAt">) {
  const db = await getDb(); if (!db) throw new Error("Database unavailable");
  if (!(await getCapitalOpportunity(ownerId, capitalOpportunityId))) throw new Error("Capital opportunity not found.");
  await db.insert(equipmentFinanceDetails).values({ ownerId, capitalOpportunityId, ...patch }).onDuplicateKeyUpdate({ set: patch });
  return getEquipmentFinanceDetail(ownerId, capitalOpportunityId);
}

export type EquipmentRentalVendorInput = Omit<typeof equipmentRentalVendors.$inferInsert, "id" | "ownerId" | "createdAt" | "updatedAt">;
export type EquipmentRentalRequirementInput = Omit<typeof equipmentRentalRequirements.$inferInsert, "id" | "ownerId" | "createdAt" | "updatedAt">;
export type EquipmentRentalQuoteInput = Omit<typeof equipmentRentalQuotes.$inferInsert, "id" | "ownerId" | "createdAt" | "updatedAt">;
export type EquipmentActiveRentalInput = Omit<typeof equipmentActiveRentals.$inferInsert, "id" | "ownerId" | "createdAt" | "updatedAt">;

export async function listEquipmentRentalVendors(ownerId: number) {
  const db = await getDb(); if (!db) return [];
  return db.select().from(equipmentRentalVendors).where(eq(equipmentRentalVendors.ownerId, ownerId)).orderBy(desc(equipmentRentalVendors.priority), desc(equipmentRentalVendors.updatedAt));
}
export async function importTexasEquipmentRentalMasterUniverse(ownerId: number) {
  const db = await getDb(); if (!db) throw new Error("Database unavailable");
  const records = loadTexasEquipmentRentalMasterUniverse();
  const existing = await db.select({ organizationName: equipmentRentalVendors.organizationName }).from(equipmentRentalVendors).where(eq(equipmentRentalVendors.ownerId, ownerId));
  const plan = planTexasEquipmentRentalMasterUniverseImport(records, existing.map((record) => record.organizationName));
  const researchDate = new Date();
  for (const record of plan.inserts) {
    await db.insert(equipmentRentalVendors).values({ ownerId, organizationName: record.organizationName, vendorType: record.vendorType, equipmentCategories: record.equipmentCategories, region: record.region, website: record.website, equipmentFocus: record.equipmentCategories, deliveryAvailable: record.deliveryAvailable, pickupAvailable: record.pickupAvailable, operatorServices: record.operatorServices, shortTermRental: record.shortTermRental, longTermRental: record.longTermRental, newUsedSales: record.newUsedSales, serviceMaintenance: record.serviceMaintenance, strategicFit: record.strategicFit, priority: "C", priorityRationale: "Initial source-attributed vendor seed. Review recorded coverage and service signals before qualification.", ceRelevance: "Initial Texas equipment rental research record. Human qualification is required before any quote, selection, or rental schedule is recorded.", source: "Verified public-source Texas equipment rental seed", sourceUrl: record.sourceUrl, researchDate, status: "research", nextAction: "Review source evidence and prepare a rental-vendor qualification brief." });
  }
  return { total: records.length, inserted: plan.inserted, skipped: plan.skipped, status: "research" as const };
}
export async function getEquipmentRentalVendor(ownerId: number, id: number) {
  const db = await getDb(); if (!db) return undefined;
  const rows = await db.select().from(equipmentRentalVendors).where(and(eq(equipmentRentalVendors.ownerId, ownerId), eq(equipmentRentalVendors.id, id))).limit(1); return rows[0];
}
export async function createEquipmentRentalVendor(ownerId: number, input: EquipmentRentalVendorInput) {
  const db = await getDb(); if (!db) throw new Error("Database unavailable");
  await db.insert(equipmentRentalVendors).values({ ...input, ownerId });
  const rows = await db.select().from(equipmentRentalVendors).where(and(eq(equipmentRentalVendors.ownerId, ownerId), eq(equipmentRentalVendors.organizationName, input.organizationName))).limit(1); return rows[0];
}
export async function updateEquipmentRentalVendor(ownerId: number, id: number, patch: Partial<EquipmentRentalVendorInput>) {
  const db = await getDb(); if (!db) throw new Error("Database unavailable");
  await db.update(equipmentRentalVendors).set(patch).where(and(eq(equipmentRentalVendors.ownerId, ownerId), eq(equipmentRentalVendors.id, id))); return getEquipmentRentalVendor(ownerId, id);
}
export async function listEquipmentRentalRequirements(ownerId: number) {
  const db = await getDb(); if (!db) return [];
  return db.select().from(equipmentRentalRequirements).where(eq(equipmentRentalRequirements.ownerId, ownerId)).orderBy(desc(equipmentRentalRequirements.updatedAt));
}
export async function getEquipmentRentalRequirement(ownerId: number, id: number) {
  const db = await getDb(); if (!db) return undefined;
  const rows = await db.select().from(equipmentRentalRequirements).where(and(eq(equipmentRentalRequirements.ownerId, ownerId), eq(equipmentRentalRequirements.id, id))).limit(1); return rows[0];
}
export async function createEquipmentRentalRequirement(ownerId: number, input: EquipmentRentalRequirementInput) {
  const db = await getDb(); if (!db) throw new Error("Database unavailable");
  const result = await db.insert(equipmentRentalRequirements).values({ ...input, ownerId }); return getEquipmentRentalRequirement(ownerId, Number(result[0].insertId));
}
export async function updateEquipmentRentalRequirement(ownerId: number, id: number, patch: Partial<EquipmentRentalRequirementInput>) {
  const db = await getDb(); if (!db) throw new Error("Database unavailable");
  await db.update(equipmentRentalRequirements).set(patch).where(and(eq(equipmentRentalRequirements.ownerId, ownerId), eq(equipmentRentalRequirements.id, id))); return getEquipmentRentalRequirement(ownerId, id);
}
export async function listEquipmentRentalQuotes(ownerId: number, requirementId?: number) {
  const db = await getDb(); if (!db) return [];
  const condition = requirementId === undefined ? eq(equipmentRentalQuotes.ownerId, ownerId) : and(eq(equipmentRentalQuotes.ownerId, ownerId), eq(equipmentRentalQuotes.requirementId, requirementId));
  return db.select().from(equipmentRentalQuotes).where(condition).orderBy(desc(equipmentRentalQuotes.updatedAt));
}
export async function createEquipmentRentalQuote(ownerId: number, input: EquipmentRentalQuoteInput) {
  const db = await getDb(); if (!db) throw new Error("Database unavailable");
  const [requirement, vendor] = await Promise.all([getEquipmentRentalRequirement(ownerId, input.requirementId), getEquipmentRentalVendor(ownerId, input.vendorId)]);
  if (!requirement) throw new Error("Rental requirement not found.");
  if (!vendor || vendor.status !== "qualified") throw new Error("Qualify this rental vendor before recording a quote.");
  await db.insert(equipmentRentalQuotes).values({ ...input, ownerId }).onDuplicateKeyUpdate({ set: input });
  const rows = await db.select().from(equipmentRentalQuotes).where(and(eq(equipmentRentalQuotes.ownerId, ownerId), eq(equipmentRentalQuotes.requirementId, input.requirementId), eq(equipmentRentalQuotes.vendorId, input.vendorId))).limit(1); return rows[0];
}
export async function updateEquipmentRentalQuote(ownerId: number, id: number, patch: Partial<EquipmentRentalQuoteInput>) {
  const db = await getDb(); if (!db) throw new Error("Database unavailable");
  await db.update(equipmentRentalQuotes).set(patch).where(and(eq(equipmentRentalQuotes.ownerId, ownerId), eq(equipmentRentalQuotes.id, id)));
  const rows = await db.select().from(equipmentRentalQuotes).where(and(eq(equipmentRentalQuotes.ownerId, ownerId), eq(equipmentRentalQuotes.id, id))).limit(1); return rows[0];
}
export async function listEquipmentActiveRentals(ownerId: number) {
  const db = await getDb(); if (!db) return [];
  return db.select().from(equipmentActiveRentals).where(eq(equipmentActiveRentals.ownerId, ownerId)).orderBy(desc(equipmentActiveRentals.updatedAt));
}
export async function createEquipmentActiveRental(ownerId: number, input: EquipmentActiveRentalInput) {
  const db = await getDb(); if (!db) throw new Error("Database unavailable");
  if (input.quoteId === null || input.quoteId === undefined) throw new Error("Select a rental quote before scheduling an active rental.");
  const [requirement, quote, vendor] = await Promise.all([getEquipmentRentalRequirement(ownerId, input.requirementId), db.select().from(equipmentRentalQuotes).where(and(eq(equipmentRentalQuotes.ownerId, ownerId), eq(equipmentRentalQuotes.id, input.quoteId))).limit(1), getEquipmentRentalVendor(ownerId, input.vendorId)]);
  if (!requirement || !quote[0] || quote[0].requirementId !== input.requirementId || quote[0].vendorId !== input.vendorId || quote[0].quoteStatus !== "selected") throw new Error("Select a matching rental quote before scheduling an active rental.");
  if (!vendor || vendor.status !== "qualified") throw new Error("The rental vendor must remain qualified before scheduling.");
  await db.insert(equipmentActiveRentals).values({ ...input, ownerId }).onDuplicateKeyUpdate({ set: input });
  await db.update(equipmentRentalRequirements).set({ status: input.status === "active" ? "active" : "selected" }).where(and(eq(equipmentRentalRequirements.ownerId, ownerId), eq(equipmentRentalRequirements.id, input.requirementId)));
  const rows = await db.select().from(equipmentActiveRentals).where(and(eq(equipmentActiveRentals.ownerId, ownerId), eq(equipmentActiveRentals.requirementId, input.requirementId))).limit(1); return rows[0];
}
export async function updateEquipmentActiveRental(ownerId: number, id: number, patch: Partial<EquipmentActiveRentalInput>) {
  const db = await getDb(); if (!db) throw new Error("Database unavailable");
  await db.update(equipmentActiveRentals).set(patch).where(and(eq(equipmentActiveRentals.ownerId, ownerId), eq(equipmentActiveRentals.id, id)));
  const rows = await db.select().from(equipmentActiveRentals).where(and(eq(equipmentActiveRentals.ownerId, ownerId), eq(equipmentActiveRentals.id, id))).limit(1); return rows[0];
}

export async function getGrantDetail(ownerId: number, capitalOpportunityId: number) {
  const db = await getDb(); if (!db) return undefined;
  const rows = await db.select().from(grantDetails).where(and(eq(grantDetails.ownerId, ownerId), eq(grantDetails.capitalOpportunityId, capitalOpportunityId))).limit(1);
  return rows[0];
}

export async function upsertGrantDetail(ownerId: number, capitalOpportunityId: number, patch: Omit<typeof grantDetails.$inferInsert, "id" | "ownerId" | "capitalOpportunityId" | "createdAt" | "updatedAt">) {
  const db = await getDb(); if (!db) throw new Error("Database unavailable");
  if (!(await getCapitalOpportunity(ownerId, capitalOpportunityId))) throw new Error("Capital opportunity not found.");
  await db.insert(grantDetails).values({ ownerId, capitalOpportunityId, ...patch }).onDuplicateKeyUpdate({ set: patch });
  return getGrantDetail(ownerId, capitalOpportunityId);
}

export type GrantFundingProgramInput = Omit<typeof grantFundingPrograms.$inferInsert, "id" | "ownerId" | "createdAt" | "updatedAt" | "priority" | "priorityRationale">;
export type GrantFundingOpportunityInput = Omit<typeof grantFundingOpportunities.$inferInsert, "id" | "ownerId" | "createdAt" | "updatedAt" | "capitalOpportunityId">;
export type GrantFundingApplicationInput = Omit<typeof grantFundingApplications.$inferInsert, "id" | "ownerId" | "createdAt" | "updatedAt">;
export type GrantFundingAwardInput = Omit<typeof grantFundingAwards.$inferInsert, "id" | "ownerId" | "createdAt" | "updatedAt" | "capitalOpportunityId">;
export type GrantAwardDisbursementInput = Omit<typeof grantAwardDisbursements.$inferInsert, "id" | "ownerId" | "createdAt" | "updatedAt">;
export type GrantComplianceItemInput = Omit<typeof grantComplianceItems.$inferInsert, "id" | "ownerId" | "createdAt" | "updatedAt">;

function grantPriorityPatch(input: Partial<GrantFundingProgramInput>) {
  const priority = scoreGrantOpportunity({ ceEligibility: input.ceEligibilityEvidence ?? null, projectEligibility: input.projectEligibilityEvidence ?? null, geographicEligibility: input.geographicEligibilityEvidence ?? null, manufacturingRelevance: input.manufacturingRelevanceEvidence ?? null, roboticsAutomationRelevance: input.roboticsAutomationRelevanceEvidence ?? null, activeApplicationWindow: input.activeWindowEvidence ?? null, strategicFit: input.strategicFitEvidence ?? null });
  return { priority: priority.priority as "A" | "B" | "C", priorityRationale: priority.rationale };
}
function assertGrantProgramQualification(input: Partial<GrantFundingProgramInput>) {
  if (input.status === "qualified" && (input.ceEligibilityEvidence !== true || input.projectEligibilityEvidence !== true)) throw new Error("Record supported CE and project eligibility before qualifying a funding program.");
}

export async function listGrantFundingPrograms(ownerId: number) { const db = await getDb(); if (!db) return []; return db.select().from(grantFundingPrograms).where(eq(grantFundingPrograms.ownerId, ownerId)).orderBy(desc(grantFundingPrograms.priority), desc(grantFundingPrograms.updatedAt)); }
export async function getGrantFundingProgram(ownerId: number, id: number) { const db = await getDb(); if (!db) return undefined; const rows = await db.select().from(grantFundingPrograms).where(and(eq(grantFundingPrograms.ownerId, ownerId), eq(grantFundingPrograms.id, id))).limit(1); return rows[0]; }
export async function createGrantFundingProgram(ownerId: number, input: GrantFundingProgramInput) { const db = await getDb(); if (!db) throw new Error("Database unavailable"); assertGrantProgramQualification(input); const result = await db.insert(grantFundingPrograms).values({ ...input, ...grantPriorityPatch(input), ownerId }); return getGrantFundingProgram(ownerId, Number(result[0].insertId)); }
export async function updateGrantFundingProgram(ownerId: number, id: number, patch: Partial<GrantFundingProgramInput>) { const db = await getDb(); if (!db) throw new Error("Database unavailable"); const current = await getGrantFundingProgram(ownerId, id); if (!current) throw new Error("Funding program not found."); const combined = { ...current, ...patch }; assertGrantProgramQualification(combined); const rated = { ...patch, ...grantPriorityPatch(combined) }; await db.update(grantFundingPrograms).set(rated).where(and(eq(grantFundingPrograms.ownerId, ownerId), eq(grantFundingPrograms.id, id))); return getGrantFundingProgram(ownerId, id); }
export async function importTexasGrantsIncentivesMasterUniverse(ownerId: number, records: TexasGrantsIncentivesMasterRecord[]) {
  const db = await getDb(); if (!db) throw new Error("Database unavailable");
  const existing = await listGrantFundingPrograms(ownerId);
  const plan = planTexasGrantsIncentivesMasterUniverseImport(records, existing.map((program) => program.programName));
  for (const record of plan.inserts) await db.insert(grantFundingPrograms).values({ ...record, ownerId, applicationWindow: "unknown", matchRequired: "unknown", priority: "C", priorityRationale: "Priority C — research-stage program; CE and project eligibility have not been verified.", status: "research" });
  return { inserted: plan.inserted, skipped: plan.skipped, total: records.length };
}

export async function listGrantFundingOpportunities(ownerId: number) { const db = await getDb(); if (!db) return []; return db.select().from(grantFundingOpportunities).where(eq(grantFundingOpportunities.ownerId, ownerId)).orderBy(desc(grantFundingOpportunities.updatedAt)); }
export async function getGrantFundingOpportunity(ownerId: number, id: number) { const db = await getDb(); if (!db) return undefined; const rows = await db.select().from(grantFundingOpportunities).where(and(eq(grantFundingOpportunities.ownerId, ownerId), eq(grantFundingOpportunities.id, id))).limit(1); return rows[0]; }
export async function createGrantFundingOpportunity(ownerId: number, input: GrantFundingOpportunityInput) { const db = await getDb(); if (!db) throw new Error("Database unavailable"); const program = await getGrantFundingProgram(ownerId, input.programId); if (!program || program.status !== "qualified") throw new Error("Qualify a source-attributed funding program before creating an operating opportunity."); const result = await db.insert(grantFundingOpportunities).values({ ...input, ownerId }); return getGrantFundingOpportunity(ownerId, Number(result[0].insertId)); }
export async function updateGrantFundingOpportunity(ownerId: number, id: number, patch: Partial<GrantFundingOpportunityInput>) { const db = await getDb(); if (!db) throw new Error("Database unavailable"); await db.update(grantFundingOpportunities).set(patch).where(and(eq(grantFundingOpportunities.ownerId, ownerId), eq(grantFundingOpportunities.id, id))); return getGrantFundingOpportunity(ownerId, id); }

export async function listGrantFundingApplications(ownerId: number) { const db = await getDb(); if (!db) return []; return db.select().from(grantFundingApplications).where(eq(grantFundingApplications.ownerId, ownerId)).orderBy(desc(grantFundingApplications.updatedAt)); }
export async function getGrantFundingApplication(ownerId: number, id: number) { const db = await getDb(); if (!db) return undefined; const rows = await db.select().from(grantFundingApplications).where(and(eq(grantFundingApplications.ownerId, ownerId), eq(grantFundingApplications.id, id))).limit(1); return rows[0]; }
export async function createGrantFundingApplication(ownerId: number, input: GrantFundingApplicationInput) { const db = await getDb(); if (!db) throw new Error("Database unavailable"); const opportunity = await getGrantFundingOpportunity(ownerId, input.opportunityId); if (!opportunity || opportunity.status !== "qualified") throw new Error("Only a qualified funding opportunity can begin an application."); const result = await db.insert(grantFundingApplications).values({ ...input, ownerId }); await db.update(grantFundingOpportunities).set({ status: input.applicationStatus === "submitted" ? "submitted" : input.applicationStatus === "under_review" ? "under_review" : "application_started" }).where(and(eq(grantFundingOpportunities.ownerId, ownerId), eq(grantFundingOpportunities.id, input.opportunityId))); return getGrantFundingApplication(ownerId, Number(result[0].insertId)); }
export async function updateGrantFundingApplication(ownerId: number, id: number, patch: Partial<GrantFundingApplicationInput>) { const db = await getDb(); if (!db) throw new Error("Database unavailable"); const application = await getGrantFundingApplication(ownerId, id); if (!application) throw new Error("Grant application not found."); await db.update(grantFundingApplications).set(patch).where(and(eq(grantFundingApplications.ownerId, ownerId), eq(grantFundingApplications.id, id))); if (patch.applicationStatus === "submitted" || patch.applicationStatus === "under_review" || patch.applicationStatus === "declined") await db.update(grantFundingOpportunities).set({ status: patch.applicationStatus === "declined" ? "declined" : patch.applicationStatus }).where(and(eq(grantFundingOpportunities.ownerId, ownerId), eq(grantFundingOpportunities.id, application.opportunityId))); return getGrantFundingApplication(ownerId, id); }

export async function listGrantFundingAwards(ownerId: number) { const db = await getDb(); if (!db) return []; return db.select().from(grantFundingAwards).where(eq(grantFundingAwards.ownerId, ownerId)).orderBy(desc(grantFundingAwards.updatedAt)); }
export async function getGrantFundingAward(ownerId: number, id: number) { const db = await getDb(); if (!db) return undefined; const rows = await db.select().from(grantFundingAwards).where(and(eq(grantFundingAwards.ownerId, ownerId), eq(grantFundingAwards.id, id))).limit(1); return rows[0]; }
export async function saveGrantFundingAward(ownerId: number, input: GrantFundingAwardInput) {
  const db = await getDb(); if (!db) throw new Error("Database unavailable");
  const application = await getGrantFundingApplication(ownerId, input.applicationId); if (!application || !["submitted", "under_review", "awarded"].includes(application.applicationStatus)) throw new Error("An award can be recorded only after the application is submitted or under review.");
  if (input.awardStatus === "awarded" && (input.awardAmount === null || input.awardAmount === undefined || input.awardDataState !== "actual")) throw new Error("Record an actual award amount before marking funding as awarded.");
  const opportunity = await getGrantFundingOpportunity(ownerId, application.opportunityId); if (!opportunity) throw new Error("Grant opportunity not found."); const program = await getGrantFundingProgram(ownerId, opportunity.programId); if (!program) throw new Error("Funding program not found.");
  let capitalOpportunityId: number | null = null;
  const existingRows = await db.select().from(grantFundingAwards).where(and(eq(grantFundingAwards.ownerId, ownerId), eq(grantFundingAwards.applicationId, input.applicationId))).limit(1);
  if (input.awardStatus === "awarded") {
    capitalOpportunityId = existingRows[0]?.capitalOpportunityId ?? (await createCapitalOpportunity(ownerId, { capitalPath: "grants", organizationName: program.sponsor, opportunityName: opportunity.opportunityName, projectName: opportunity.linkedProject ?? undefined, facilityName: opportunity.linkedFacility ?? undefined, stage: "committed", requestedAmount: application.requestedAmount ?? opportunity.requestedAmount ?? undefined, committedAmount: input.awardAmount!, fundedAmount: 0, probability: 100, source: program.programUrl, termsNotes: `Awarded ${program.mechanismType.replaceAll("_", " ")} program; award details are held in Grants & Incentives.` })).id;
  }
  await db.insert(grantFundingAwards).values({ ...input, capitalOpportunityId, ownerId }).onDuplicateKeyUpdate({ set: { ...input, capitalOpportunityId } });
  if (input.awardStatus === "awarded") { await db.update(grantFundingApplications).set({ applicationStatus: "awarded" }).where(and(eq(grantFundingApplications.ownerId, ownerId), eq(grantFundingApplications.id, input.applicationId))); await db.update(grantFundingOpportunities).set({ status: "awarded", capitalOpportunityId }).where(and(eq(grantFundingOpportunities.ownerId, ownerId), eq(grantFundingOpportunities.id, opportunity.id))); await upsertGrantDetail(ownerId, capitalOpportunityId!, { program: program.programName, agency: program.sponsor, eligibility: program.companyEligibility, awardCeiling: program.awardMaximum, matchRequirement: program.matchRequired === "unknown" ? undefined : program.matchRequired, applicationDeadline: program.applicationDeadline, eligibleCosts: program.eligibleExpenses, applicationStatus: "awarded", awardStatus: "awarded", reportingRequirements: input.reportingRequirementSummary }); }
  const rows = await db.select().from(grantFundingAwards).where(and(eq(grantFundingAwards.ownerId, ownerId), eq(grantFundingAwards.applicationId, input.applicationId))).limit(1); return rows[0];
}

export async function listGrantAwardDisbursements(ownerId: number) { const db = await getDb(); if (!db) return []; return db.select().from(grantAwardDisbursements).where(eq(grantAwardDisbursements.ownerId, ownerId)).orderBy(desc(grantAwardDisbursements.receivedAt)); }
export async function createGrantAwardDisbursement(ownerId: number, input: GrantAwardDisbursementInput) {
  const db = await getDb(); if (!db) throw new Error("Database unavailable");
  const award = await getGrantFundingAward(ownerId, input.awardId);
  if (!award || award.awardStatus !== "awarded" || !award.capitalOpportunityId) throw new Error("Record an awarded funding record before recording funds received.");
  const result = await db.insert(grantAwardDisbursements).values({ ...input, ownerId });
  const disbursements = await db.select().from(grantAwardDisbursements).where(and(eq(grantAwardDisbursements.ownerId, ownerId), eq(grantAwardDisbursements.awardId, input.awardId)));
  const fundedAmount = disbursements.reduce((sum, item) => sum + item.receivedAmount, 0);
  await updateCapitalOpportunity(ownerId, award.capitalOpportunityId, { fundedAmount });
  const rows = await db.select().from(grantAwardDisbursements).where(and(eq(grantAwardDisbursements.ownerId, ownerId), eq(grantAwardDisbursements.id, Number(result[0].insertId)))).limit(1);
  return rows[0];
}

export async function listGrantComplianceItems(ownerId: number) { const db = await getDb(); if (!db) return []; return db.select().from(grantComplianceItems).where(eq(grantComplianceItems.ownerId, ownerId)).orderBy(desc(grantComplianceItems.dueAt)); }
export async function createGrantComplianceItem(ownerId: number, input: GrantComplianceItemInput) {
  const db = await getDb(); if (!db) throw new Error("Database unavailable");
  const award = await getGrantFundingAward(ownerId, input.awardId);
  if (!award || award.awardStatus !== "awarded") throw new Error("Compliance items require an awarded funding record.");
  const result = await db.insert(grantComplianceItems).values({ ...input, ownerId });
  const rows = await db.select().from(grantComplianceItems).where(and(eq(grantComplianceItems.ownerId, ownerId), eq(grantComplianceItems.id, Number(result[0].insertId)))).limit(1);
  return rows[0];
}
export async function updateGrantComplianceItem(ownerId: number, id: number, patch: Partial<GrantComplianceItemInput>) { const db = await getDb(); if (!db) throw new Error("Database unavailable"); await db.update(grantComplianceItems).set(patch).where(and(eq(grantComplianceItems.ownerId, ownerId), eq(grantComplianceItems.id, id))); const rows = await db.select().from(grantComplianceItems).where(and(eq(grantComplianceItems.ownerId, ownerId), eq(grantComplianceItems.id, id))).limit(1); return rows[0]; }


export async function listInvestorEvents(ownerId: number, contactId?: number) {
  const db = await getDb(); if (!db) return [];
  const condition = contactId === undefined ? eq(outreachEvents.ownerId, ownerId) : and(eq(outreachEvents.ownerId, ownerId), eq(outreachEvents.contactId, contactId));
  return db.select().from(outreachEvents).where(condition).orderBy(desc(outreachEvents.createdAt));
}

export type InvestorResearchSourceInput = { url: string; title?: string | null; sourceType?: string; excerpt?: string | null };
export type InvestorResearchProposalInput = Omit<typeof investorResearchProposals.$inferInsert, "id" | "ownerId" | "contactId" | "status" | "createdAt" | "updatedAt">;

export async function listInvestorResearchProposals(ownerId: number, contactId: number) {
  const db = await getDb(); if (!db) return [];
  return db.select().from(investorResearchProposals).where(and(eq(investorResearchProposals.ownerId, ownerId), eq(investorResearchProposals.contactId, contactId))).orderBy(desc(investorResearchProposals.createdAt));
}

export async function getInvestorResearchProposal(ownerId: number, proposalId: number) {
  const db = await getDb(); if (!db) return undefined;
  const rows = await db.select().from(investorResearchProposals).where(and(eq(investorResearchProposals.ownerId, ownerId), eq(investorResearchProposals.id, proposalId))).limit(1);
  return rows[0];
}

export async function listInvestorResearchSources(ownerId: number, proposalId: number) {
  const db = await getDb(); if (!db) return [];
  return db.select().from(investorResearchSources).where(and(eq(investorResearchSources.ownerId, ownerId), eq(investorResearchSources.proposalId, proposalId))).orderBy(desc(investorResearchSources.createdAt));
}

export async function createInvestorResearchProposal(ownerId: number, contactId: number, proposal: InvestorResearchProposalInput, sources: InvestorResearchSourceInput[]) {
  const db = await getDb(); if (!db) throw new Error("Database unavailable");
  const contact = await getInvestorContact(ownerId, contactId);
  if (!contact) throw new Error("Investor not found.");
  const result = await db.insert(investorResearchProposals).values({ ...proposal, ownerId, contactId, status: "proposed" });
  const proposalId = Number(result[0].insertId);
  const validSources = sources.filter((source) => source.url.trim().startsWith("http"));
  if (validSources.length) await db.insert(investorResearchSources).values(validSources.map((source) => ({ ownerId, proposalId, url: source.url.trim(), title: source.title || null, sourceType: source.sourceType || "public website", excerpt: source.excerpt || null })));
  const rows = await db.select().from(investorResearchProposals).where(and(eq(investorResearchProposals.ownerId, ownerId), eq(investorResearchProposals.id, proposalId))).limit(1);
  return rows[0];
}

export async function updateInvestorResearchProposalStatus(ownerId: number, proposalId: number, status: "applied" | "dismissed" | "failed") {
  const db = await getDb(); if (!db) throw new Error("Database unavailable");
  await db.update(investorResearchProposals).set({ status }).where(and(eq(investorResearchProposals.ownerId, ownerId), eq(investorResearchProposals.id, proposalId)));
  const rows = await db.select().from(investorResearchProposals).where(and(eq(investorResearchProposals.ownerId, ownerId), eq(investorResearchProposals.id, proposalId))).limit(1);
  return rows[0];
}

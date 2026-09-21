import { beforeEach, describe, expect, it, vi } from "vitest";

const dbMocks = vi.hoisted(() => ({
  getGmailConnection: vi.fn(),
  getInvestorContact: vi.fn(),
  updateInvestorContact: vi.fn(),
  addOutreachEvent: vi.fn(),
  createInvestorContact: vi.fn(),
  listInvestorContacts: vi.fn(),
  listInvestorDocumentLinks: vi.fn(),
  listFundraisingDocuments: vi.fn(),
}));
const gmailMocks = vi.hoisted(() => ({ sendGmailMessage: vi.fn() }));

vi.mock("./db", () => dbMocks);
vi.mock("./gmail", () => gmailMocks);

import { appRouter } from "./routers";

function caller() {
  return appRouter.createCaller({
    user: { id: 7, openId: "owner", name: "Owner", email: "owner@example.com", loginMethod: "manus", role: "admin", createdAt: new Date(), updatedAt: new Date(), lastSignedIn: new Date() },
    req: { protocol: "https", headers: {} } as any,
    res: { clearCookie: vi.fn() } as any,
  });
}

describe("outreach.markSent", () => {
  beforeEach(() => vi.clearAllMocks());

  it("blocks the approved send path when no persisted Gmail connection exists", async () => {
    dbMocks.getGmailConnection.mockResolvedValue(undefined);
    await expect(caller().outreach.markSent({ id: 42, message: "initial" })).rejects.toMatchObject({ code: "PRECONDITION_FAILED" });
    expect(gmailMocks.sendGmailMessage).not.toHaveBeenCalled();
  });

  it("uses Gmail and records sent status when a persisted connection and approved draft exist", async () => {
    dbMocks.getGmailConnection.mockResolvedValue({ id: 1, ownerId: 7, email: "owner@gmail.com", connectedAt: new Date() });
    dbMocks.getInvestorContact.mockResolvedValue({ id: 42, ownerId: 7, email: "investor@example.com", status: "approved", initialSubject: "CE/FF introduction", initialBody: "Hello", followUpSubject: "Follow up", followUpBody: "Hello again" });
    gmailMocks.sendGmailMessage.mockResolvedValue({ id: "gmail-message" });
    dbMocks.updateInvestorContact.mockResolvedValue({ id: 42, status: "sent" });
    dbMocks.listInvestorDocumentLinks.mockResolvedValue([]);
    dbMocks.listFundraisingDocuments.mockResolvedValue([]);

    await expect(caller().outreach.markSent({ id: 42, message: "initial" })).resolves.toMatchObject({ status: "sent" });
    expect(gmailMocks.sendGmailMessage).toHaveBeenCalledWith(7, "investor@example.com", "CE/FF introduction", "Hello", []);
    expect(dbMocks.updateInvestorContact).toHaveBeenCalledWith(7, 42, expect.objectContaining({ status: "sent" }));
  });
});

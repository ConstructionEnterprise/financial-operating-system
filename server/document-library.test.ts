import { beforeEach, describe, expect, it, vi } from "vitest";

const dbMocks = vi.hoisted(() => ({
  listCampaigns: vi.fn(), createCampaign: vi.fn(), updateCampaign: vi.fn(), deleteCampaign: vi.fn(),
  listFundraisingDocuments: vi.fn(), createFundraisingDocument: vi.fn(), updateFundraisingDocument: vi.fn(), listCampaignDocumentLinks: vi.fn(), linkDocumentToCampaign: vi.fn(), unlinkDocumentFromCampaign: vi.fn(), deleteFundraisingDocument: vi.fn(), listInvestorDocumentLinks: vi.fn(), linkDocumentToInvestor: vi.fn(), unlinkDocumentFromInvestor: vi.fn(),
  listTasks: vi.fn(), createTask: vi.fn(), updateTask: vi.fn(), listMeetings: vi.fn(), createMeeting: vi.fn(), getFundraisingAnalytics: vi.fn(), listInvestorEvents: vi.fn(),
  getGmailConnection: vi.fn(), createInvestorContact: vi.fn(), getInvestorContact: vi.fn(), listInvestorContacts: vi.fn(), updateInvestorContact: vi.fn(), addOutreachEvent: vi.fn(),
}));
const storageMocks = vi.hoisted(() => ({ storagePut: vi.fn() }));

vi.mock("./db", () => dbMocks);
vi.mock("./storage", () => storageMocks);

import { appRouter } from "./routers";

function caller() {
  return appRouter.createCaller({
    user: { id: 7, openId: "owner", name: "Owner", email: "owner@example.com", loginMethod: "manus", role: "admin", createdAt: new Date(), updatedAt: new Date(), lastSignedIn: new Date() },
    req: { protocol: "https", headers: {} } as any,
    res: { clearCookie: vi.fn() } as any,
  });
}

describe("fundraising document library", () => {
  beforeEach(() => vi.clearAllMocks());

  it("stores an allowed PDF using owner-scoped storage and records metadata", async () => {
    storageMocks.storagePut.mockResolvedValue({ key: "7/fundraising-documents/ceff_pitch.pdf", url: "/manus-storage/7/fundraising-documents/ceff_pitch.pdf" });
    dbMocks.createFundraisingDocument.mockResolvedValue({ id: 5, name: "ceff_pitch.pdf" });
    await expect(caller().fundraising.uploadDocument({ name: "ceff_pitch.pdf", category: "Pitch deck", version: "v4", description: "Current investor deck", mimeType: "application/pdf", contentBase64: Buffer.from("pitch material").toString("base64") })).resolves.toMatchObject({ id: 5 });
    expect(storageMocks.storagePut).toHaveBeenCalledWith("7/fundraising-documents/ceff_pitch.pdf", expect.any(Buffer), "application/pdf");
    expect(dbMocks.createFundraisingDocument).toHaveBeenCalledWith(7, expect.objectContaining({ name: "ceff_pitch.pdf", category: "Pitch deck", version: "v4", description: "Current investor deck", status: "current", sizeBytes: 14 }));
  });

  it("links and unlinks a library document to an owned campaign", async () => {
    dbMocks.linkDocumentToCampaign.mockResolvedValue({ success: true });
    dbMocks.unlinkDocumentFromCampaign.mockResolvedValue({ success: true });
    await expect(caller().fundraising.linkDocument({ campaignId: 4, documentId: 5 })).resolves.toEqual({ success: true });
    await expect(caller().fundraising.unlinkDocument({ campaignId: 4, documentId: 5 })).resolves.toEqual({ success: true });
    expect(dbMocks.linkDocumentToCampaign).toHaveBeenCalledWith(7, 4, 5);
    expect(dbMocks.unlinkDocumentFromCampaign).toHaveBeenCalledWith(7, 4, 5);
  });

  it("archives document versions and records investor-level attachment selection", async () => {
    dbMocks.updateFundraisingDocument.mockResolvedValue({ id: 5, status: "archived" });
    dbMocks.linkDocumentToInvestor.mockResolvedValue({ success: true });
    dbMocks.unlinkDocumentFromInvestor.mockResolvedValue({ success: true });
    await expect(caller().fundraising.updateDocument({ id: 5, status: "archived" })).resolves.toMatchObject({ status: "archived" });
    await expect(caller().fundraising.linkInvestorDocument({ contactId: 42, documentId: 5 })).resolves.toEqual({ success: true });
    await expect(caller().fundraising.unlinkInvestorDocument({ contactId: 42, documentId: 5 })).resolves.toEqual({ success: true });
    expect(dbMocks.updateFundraisingDocument).toHaveBeenCalledWith(7, 5, { status: "archived" });
    expect(dbMocks.linkDocumentToInvestor).toHaveBeenCalledWith(7, 42, 5);
    expect(dbMocks.unlinkDocumentFromInvestor).toHaveBeenCalledWith(7, 42, 5);
  });

  it("accepts an XLSX financial model and archives the version it replaces", async () => {
    storageMocks.storagePut.mockResolvedValue({ key: "7/fundraising-documents/model_v3.xlsx", url: "/manus-storage/7/fundraising-documents/model_v3.xlsx" });
    dbMocks.createFundraisingDocument.mockResolvedValue({ id: 12, name: "model_v3.xlsx", version: "v3" });
    dbMocks.updateFundraisingDocument.mockResolvedValue({ id: 11, status: "archived" });
    await expect(caller().fundraising.uploadDocument({ name: "model_v3.xlsx", category: "Financial model", version: "v3", audience: "VC / Angel", purpose: "Diligence", replacesDocumentId: 11, mimeType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", contentBase64: Buffer.from("model").toString("base64") })).resolves.toMatchObject({ id: 12 });
    expect(dbMocks.createFundraisingDocument).toHaveBeenCalledWith(7, expect.objectContaining({ audience: "VC / Angel", purpose: "Diligence", replacesDocumentId: 11, status: "current" }));
    expect(dbMocks.updateFundraisingDocument).toHaveBeenCalledWith(7, 11, { status: "archived" });
  });

  it("rejects unsupported document MIME types at the procedure boundary", async () => {
    await expect(caller().fundraising.uploadDocument({ name: "unsafe.exe", category: "Other", mimeType: "application/pdf" as any, contentBase64: "" })).rejects.toBeDefined();
    expect(storageMocks.storagePut).not.toHaveBeenCalled();
  });
});

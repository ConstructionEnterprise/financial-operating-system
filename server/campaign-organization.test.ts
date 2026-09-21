import { beforeEach, describe, expect, it, vi } from "vitest";

const dbMocks = vi.hoisted(() => ({
  listCampaigns: vi.fn(),
  createCampaign: vi.fn(),
  updateCampaign: vi.fn(),
  deleteCampaign: vi.fn(),
  listTasks: vi.fn(),
  createTask: vi.fn(),
  updateTask: vi.fn(),
  listMeetings: vi.fn(),
  createMeeting: vi.fn(),
  getFundraisingAnalytics: vi.fn(),
  listInvestorEvents: vi.fn(),
  getGmailConnection: vi.fn(),
  createInvestorContact: vi.fn(),
  getInvestorContact: vi.fn(),
  listInvestorContacts: vi.fn(),
  updateInvestorContact: vi.fn(),
  addOutreachEvent: vi.fn(),
}));

vi.mock("./db", () => dbMocks);

import { appRouter } from "./routers";

function caller() {
  return appRouter.createCaller({
    user: { id: 7, openId: "owner", name: "Owner", email: "owner@example.com", loginMethod: "manus", role: "admin", createdAt: new Date(), updatedAt: new Date(), lastSignedIn: new Date() },
    req: { protocol: "https", headers: {} } as any,
    res: { clearCookie: vi.fn() } as any,
  });
}

describe("fundraising campaign organization", () => {
  beforeEach(() => vi.clearAllMocks());

  it("routes rename, grouping, stage, and custom ordering changes through updateCampaign", async () => {
    dbMocks.updateCampaign.mockResolvedValue({ id: 4, name: "Priority 50", groupName: "Wave 1", funnelStage: "50", sortOrder: -10 });
    await expect(caller().fundraising.updateCampaign({ id: 4, name: "Priority 50", groupName: "Wave 1", funnelStage: "50", sortOrder: -10 })).resolves.toMatchObject({ id: 4, groupName: "Wave 1" });
    expect(dbMocks.updateCampaign).toHaveBeenCalledWith(7, 4, { name: "Priority 50", groupName: "Wave 1", funnelStage: "50", sortOrder: -10 });
  });

  it("routes campaign deletion through the safe database cleanup helper", async () => {
    dbMocks.deleteCampaign.mockResolvedValue({ success: true });
    await expect(caller().fundraising.deleteCampaign({ id: 4 })).resolves.toEqual({ success: true });
    expect(dbMocks.deleteCampaign).toHaveBeenCalledWith(7, 4);
  });
});

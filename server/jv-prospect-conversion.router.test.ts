import { beforeEach, describe, expect, it, vi } from "vitest";

const dbMocks = vi.hoisted(() => ({
  addOutreachEvent: vi.fn(),
  getJvPartnerProspect: vi.fn(),
  createJvPartnerProspect: vi.fn(),
  convertJvProspectToCapitalOpportunity: vi.fn(),
  importTexasJvMasterUniverse: vi.fn(),
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

describe("JV prospect qualification and conversion", () => {
  beforeEach(() => vi.clearAllMocks());

  it("allows an explicitly qualified prospect to be converted to a facility/JV opportunity", async () => {
    dbMocks.convertJvProspectToCapitalOpportunity.mockResolvedValue({ id: 91, capitalPath: "facility_jv", organizationName: "Partner ABC", stage: "researching" });
    await expect(caller().fundraising.convertJvPartnerProspect({ id: 42 })).resolves.toMatchObject({ id: 91, capitalPath: "facility_jv" });
    expect(dbMocks.convertJvProspectToCapitalOpportunity).toHaveBeenCalledWith(7, 42);
  });

  it("requires public source evidence and persists it with a sourced prospect", async () => {
    dbMocks.createJvPartnerProspect.mockResolvedValue({ id: 12, organizationName: "Partner ABC", sourceUrl: "https://partner.example/industrial" });
    await expect(caller().fundraising.createJvPartnerProspect({
      organizationName: "Partner ABC",
      partnerType: "industrial_developer",
      region: "DFW",
      source: "Official company website",
      sourceUrl: "https://partner.example/industrial",
      researchDate: new Date("2026-08-20T00:00:00.000Z"),
      strategicFit: "High",
      status: "prospect",
      landContributionPotential: "Unknown",
      capitalContributionPotential: "Unknown",
      developmentContributionPotential: "Yes",
      facilityContributionPotential: "Unknown",
    } as any)).resolves.toMatchObject({ id: 12, sourceUrl: "https://partner.example/industrial" });
    expect(dbMocks.createJvPartnerProspect).toHaveBeenCalledWith(7, expect.objectContaining({ source: "Official company website", sourceUrl: "https://partner.example/industrial", priority: "A" }));

    await expect(caller().fundraising.createJvPartnerProspect({
      organizationName: "Unattributed record",
      partnerType: "industrial_developer",
      region: "DFW",
      source: "Official company website",
      researchDate: new Date("2026-08-20T00:00:00.000Z"),
      strategicFit: "High",
      status: "prospect",
      landContributionPotential: "Unknown",
      capitalContributionPotential: "Unknown",
      developmentContributionPotential: "Unknown",
      facilityContributionPotential: "Unknown",
    } as any)).rejects.toBeTruthy();
  });

  it("does not disguise a conversion failure as outreach or a capital commitment", async () => {
    dbMocks.convertJvProspectToCapitalOpportunity.mockRejectedValue(new Error("Qualify this prospect before creating a JV opportunity."));
    await expect(caller().fundraising.convertJvPartnerProspect({ id: 42 })).rejects.toThrow("Qualify this prospect");
  });

  it("imports the verified universe as Research records without creating a capital opportunity", async () => {
    dbMocks.importTexasJvMasterUniverse.mockResolvedValue({ total: 100, inserted: 100, skipped: 0, status: "research" });
    await expect(caller().fundraising.importTexasJvMasterUniverse()).resolves.toMatchObject({ total: 100, inserted: 100, status: "research" });
    expect(dbMocks.importTexasJvMasterUniverse).toHaveBeenCalledWith(7, expect.arrayContaining([expect.objectContaining({ status: "research", sourceUrl: expect.stringMatching(/^http/) })]));
    expect(dbMocks.convertJvProspectToCapitalOpportunity).not.toHaveBeenCalled();
    expect(dbMocks.addOutreachEvent).not.toHaveBeenCalled();
    expect(gmailMocks.sendGmailMessage).not.toHaveBeenCalled();
  });
});

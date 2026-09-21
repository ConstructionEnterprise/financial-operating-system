import { beforeEach, describe, expect, it, vi } from "vitest";
import { campaigns, investorContacts, meetings, tasks } from "../drizzle/schema";

const mocks = vi.hoisted(() => {
  const updateWhere = vi.fn().mockResolvedValue(undefined);
  const updateSet = vi.fn(() => ({ where: updateWhere }));
  const deleteWhere = vi.fn().mockResolvedValue(undefined);
  const update = vi.fn(() => ({ set: updateSet }));
  const remove = vi.fn(() => ({ where: deleteWhere }));
  const drizzle = vi.fn(() => ({ update, delete: remove }));
  return { drizzle, update, remove, updateSet, updateWhere, deleteWhere };
});

vi.mock("drizzle-orm/mysql2", () => ({ drizzle: mocks.drizzle }));

import { deleteCampaign } from "./db";

describe("deleteCampaign", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.updateWhere.mockResolvedValue(undefined);
    mocks.deleteWhere.mockResolvedValue(undefined);
    process.env.DATABASE_URL = "mysql://test";
  });

  it("unassigns linked investors, tasks, and meetings before deleting only the campaign", async () => {
    await expect(deleteCampaign(7, 4)).resolves.toEqual({ success: true });
    expect(mocks.updateSet).toHaveBeenNthCalledWith(1, { campaignId: null });
    expect(mocks.updateSet).toHaveBeenNthCalledWith(2, { campaignId: null });
    expect(mocks.updateSet).toHaveBeenNthCalledWith(3, { campaignId: null });
    expect(mocks.updateWhere).toHaveBeenCalledTimes(3);
    expect(mocks.update).toHaveBeenNthCalledWith(1, investorContacts);
    expect(mocks.update).toHaveBeenNthCalledWith(2, tasks);
    expect(mocks.update).toHaveBeenNthCalledWith(3, meetings);
    expect(mocks.remove).toHaveBeenCalledWith(campaigns);
    expect(mocks.deleteWhere).toHaveBeenCalledTimes(1);
    expect(mocks.updateWhere.mock.invocationCallOrder[2]).toBeLessThan(mocks.deleteWhere.mock.invocationCallOrder[0]);
  });
});

import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ getDb: vi.fn(), getCapitalOpportunity: vi.fn() }));
vi.mock("./db", () => ({ getDb: mocks.getDb, getCapitalOpportunity: mocks.getCapitalOpportunity }));

import { getProjectEconomicsModelForProject } from "./projectEconomics";

describe("project-economics query contract", () => {
  beforeEach(() => { mocks.getDb.mockReset(); });

  it("returns null instead of undefined when an Internal Project has no model shell", async () => {
    const limit = vi.fn().mockResolvedValue([]);
    const where = vi.fn(() => ({ limit }));
    const from = vi.fn(() => ({ where }));
    mocks.getDb.mockResolvedValue({ select: vi.fn(() => ({ from })) });
    await expect(getProjectEconomicsModelForProject(1, 1)).resolves.toBeNull();
    expect(limit).toHaveBeenCalledWith(1);
  });

  it("returns null instead of undefined when database access is unavailable", async () => {
    mocks.getDb.mockResolvedValue(null);
    await expect(getProjectEconomicsModelForProject(1, 1)).resolves.toBeNull();
  });
});

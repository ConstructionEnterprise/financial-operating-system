import { afterEach, describe, expect, it, vi } from "vitest";
import { fetchPublicResearchSources } from "./investorResearch";

describe("public investor research sources", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("extracts a titled public HTML source for downstream attributed research", async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response("<html><head><title>Example Construction Fund</title></head><body><h1>We invest in construction technology.</h1></body></html>", { status: 200, headers: { "content-type": "text/html" } }));
    vi.stubGlobal("fetch", fetchMock);
    await expect(fetchPublicResearchSources(["https://example-fund.test/thesis"])).resolves.toEqual([expect.objectContaining({ url: "https://example-fund.test/thesis", title: "Example Construction Fund", sourceType: "public website", excerpt: expect.stringContaining("construction technology") })]);
  });

  it("blocks private-network URLs before making an external request", async () => {
    const fetchMock = vi.fn(); vi.stubGlobal("fetch", fetchMock);
    await expect(fetchPublicResearchSources(["http://127.0.0.1/private"])).rejects.toThrow("Private-network source URLs are not allowed.");
    expect(fetchMock).not.toHaveBeenCalled();
  });
});

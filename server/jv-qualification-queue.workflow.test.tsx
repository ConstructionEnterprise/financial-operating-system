// @vitest-environment jsdom
import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

const apiMocks = vi.hoisted(() => ({
  create: vi.fn(),
  update: vi.fn(),
  convert: vi.fn(),
  importUniverse: vi.fn(),
  invalidate: vi.fn(),
  prospects: Array.from({ length: 25 }, (_, index) => ({
    id: index + 1,
    organizationName: `Prospect ${String(index + 1).padStart(2, "0")}`,
    partnerType: "industrial_developer",
    region: index % 2 ? "Houston" : "DFW",
    priority: index < 5 ? "A" : index < 15 ? "B" : "C",
    status: "research",
    sourceUrl: `https://example.com/${index + 1}`,
    source: "Official source",
    researchDate: new Date("2026-08-20T00:00:00.000Z"),
    createdAt: new Date("2026-08-20T00:00:00.000Z"),
    updatedAt: new Date("2026-08-20T00:00:00.000Z"),
  })),
}));

vi.mock("../client/src/lib/trpc", () => ({
  trpc: {
    useUtils: () => ({ fundraising: { jvPartnerProspects: { invalidate: apiMocks.invalidate }, capitalOpportunities: { invalidate: apiMocks.invalidate } } }),
    fundraising: {
      jvPartnerProspects: { useQuery: () => ({ data: apiMocks.prospects }) },
      createJvPartnerProspect: { useMutation: () => ({ mutate: apiMocks.create, isPending: false }) },
      updateJvPartnerProspect: { useMutation: () => ({ mutate: apiMocks.update, isPending: false }) },
      convertJvPartnerProspect: { useMutation: () => ({ mutate: apiMocks.convert, isPending: false }) },
      importTexasJvMasterUniverse: { useMutation: () => ({ mutate: apiMocks.importUniverse, isPending: false }) },
    },
  },
}));

import { JvProspectUniverse } from "../client/src/App";

describe("JV Qualification Queue workflow", () => {
  it("sorts the full result set, renders ten records per page, and preserves page/sort after selecting and saving a prospect", () => {
    render(<JvProspectUniverse />);
    expect(screen.getByText("25 opportunities awaiting qualification · 10 shown · Sorted by Priority / score")).toBeTruthy();
    expect(screen.getAllByRole("button", { name: "Qualify" })).toHaveLength(10);

    fireEvent.change(screen.getByLabelText("Sort"), { target: { value: "region" } });
    expect(screen.getByText("25 opportunities awaiting qualification · 10 shown · Sorted by Region / market")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Next →" }));
    expect(screen.getByText("11–20 of 25")).toBeTruthy();
    expect(screen.getAllByRole("button", { name: "Qualify" })).toHaveLength(10);

    fireEvent.click(screen.getByRole("button", { name: /11\. Prospect/ }));
    expect(screen.getByText(/Prospect action interface/)).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Save qualification action" }));
    expect(apiMocks.update).toHaveBeenCalledWith(expect.objectContaining({ id: expect.any(Number) }));
    expect(screen.getByText("11–20 of 25")).toBeTruthy();
    expect(screen.getByText("25 opportunities awaiting qualification · 10 shown · Sorted by Region / market")).toBeTruthy();
  });
});

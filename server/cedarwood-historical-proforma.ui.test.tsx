// @vitest-environment jsdom
import { render } from "@testing-library/react";
import React from "react";
import { describe, expect, it, vi } from "vitest";
import { CedarwoodHistoricalProForma } from "../client/src/components/CedarwoodHistoricalProForma";

describe("Cedarwood historical pro forma workspace", () => {
  it("renders the $40M reconciliation while keeping current return outputs unavailable", () => {
    const { getAllByText, getByText } = render(<CedarwoodHistoricalProForma scenarioId={60004} refresh={{ isPending: false, mutate: vi.fn() }} summary={{ lineCount: 100, total: 40_000_000, byCategory: [{ costCategory: "building_modular", amount: 25_600_000, lineCount: 44 }], lines: [{ id: 1, wbsCode: "001", description: "Land acquisition consideration", costCategory: "land_acquisition", phase: "predevelopment", buildingApplicability: "Project-wide", allocatedAmount: 3_400_000, sourceClassification: "reverse_engineered_allocation" }] }} />);
    expect(getAllByText(/\$40M control total/i).length).toBeGreaterThan(0);
    expect(getByText("Reconciled")).toBeTruthy();
    expect(getByText(/no current capital need, monthly cash-flow, debt service, ROI, IRR, or payback/i)).toBeTruthy();
    expect(getByText(/Expand 100-line WBS ledger/i)).toBeTruthy();
  });
});

// @vitest-environment jsdom
import React from "react";
import { render } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { CedarwoodScheduleFinancing } from "../client/src/components/CedarwoodScheduleFinancing";

class ResizeObserverMock {
  observe() {}
  unobserve() {}
  disconnect() {}
}

vi.stubGlobal("ResizeObserver", ResizeObserverMock);

describe("Cedarwood Schedule + Debt workspace", () => {
  it("shows editable schedule and financing inputs while debt service remains gated without sources", () => {
    const { getByText, getAllByText } = render(<CedarwoodScheduleFinancing scenarioId={60004} snapshot={{ scheduleMonths: [], financingTerms: null, calculation: { eligible: false, reasons: ["Enter financing terms with source metadata before calculating debt service."] } }} wbsSummary={{ byCategory: [{ costCategory: "Hard cost", amount: 10_000_000 }] }} saveSchedule={{ isPending: false, mutate: vi.fn() }} saveFinancing={{ isPending: false, mutate: vi.fn() }} />);
    expect(getByText(/Interactive construction, lease-up, debt-service/i)).toBeTruthy();
    expect(getByText(/36-Month Construction & Lease-Up Schedule/i)).toBeTruthy();
    expect(getByText(/Debt service and cash flow are intentionally gated/i)).toBeTruthy();
    expect(getByText(/Reconciled \$40M historical planning allocation/i)).toBeTruthy();
    expect(getByText(/Development cost and annual NOI reference/i)).toBeTruthy();
    expect(getByText(/Supplied cost-per-SF range and implied project area/i)).toBeTruthy();
    expect(getByText(/Expand monthly editor/i)).toBeTruthy();
    expect(getAllByText(/Source reference/i).length).toBeGreaterThan(0);
  });
});

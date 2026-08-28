// @vitest-environment jsdom
import React from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render } from "@testing-library/react";
import { RoiReturnsWorkspace } from "../client/src/App";

const mutation = { mutate: vi.fn(), isPending: false };
const details = { equity: [], jv: [], equipment: [], grants: [] };
class ResizeObserverStub { observe() {} unobserve() {} disconnect() {} }
vi.stubGlobal("ResizeObserver", ResizeObserverStub);
const snapshot = {
  totals: { potential: 100_000, committed: 0, funded: 0, remainingFundedGap: null, capitalizationDataState: "missing" },
  byPath: [{ capitalPath: "equity", potential: 100_000, committed: 0, funded: 0 }, { capitalPath: "facility_jv", potential: 0, committed: 0, funded: 0 }, { capitalPath: "equipment_finance", potential: 0, committed: 0, funded: 0 }, { capitalPath: "grants", potential: 0, committed: 0, funded: 0 }],
  rows: [{ id: "1:potential", capitalPath: "equity", capitalState: "potential", amount: 100_000, sourceName: "Existing equity prospect", linkReason: "explicit ROI source link" }],
  rentals: { requirementCount: 0, selectedQuoteExposure: null, actualRentalExposure: null },
  unlinkedProjectSources: [],
};

afterEach(() => { cleanup(); mutation.mutate.mockClear(); });

describe("ROI schedule and source visualizations", () => {
  it("saves changed monthly values without treating blank months as zero and keeps IRR input guidance visible", () => {
    const { getByLabelText, getByRole, getByText } = render(<RoiReturnsWorkspace projects={[{ id: 91, projectName: "Sample ROI project" }]} sources={[]} cashFlows={[]} scenarios={[]} returnDetails={details} components={[]} capitalOpportunities={[]} crossDomainSnapshot={snapshot} createProject={mutation} updateProject={mutation} createSource={mutation} updateSource={mutation} saveCashFlow={mutation} createScenario={mutation} updateScenario={mutation} createComponent={mutation} saveEquityDetail={mutation} saveJvDetail={mutation} saveEquipmentDetail={mutation} saveGrantDetail={mutation} />);
    expect(getByText("Add at least one inflow and one outflow to calculate IRR")).toBeTruthy();
    fireEvent.change(getByLabelText("Cash-flow amount month 0"), { target: { value: "-100000" } });
    fireEvent.change(getByLabelText("Cash-flow amount month 1"), { target: { value: "125000" } });
    fireEvent.click(getByRole("button", { name: "Save 2 changed months" }));
    expect(mutation.mutate).toHaveBeenCalledWith(expect.objectContaining({ projectId: 91, monthIndex: 0, amount: -100000, flowType: "forecast" }));
    expect(mutation.mutate).toHaveBeenCalledWith(expect.objectContaining({ projectId: 91, monthIndex: 1, amount: 125000, flowType: "forecast" }));
  });

  it("switches the visualization to source-return view and surfaces missing source inputs rather than charting assumptions", () => {
    const { getByRole, getByText } = render(<RoiReturnsWorkspace projects={[{ id: 92, projectName: "Sample ROI project" }]} sources={[{ id: 7, projectId: 92, capitalPath: "equity", sourceName: "Existing equity prospect", capitalCommitted: 0, capitalDeployed: 0 }]} cashFlows={[]} scenarios={[]} returnDetails={details} components={[]} capitalOpportunities={[]} crossDomainSnapshot={snapshot} createProject={mutation} updateProject={mutation} createSource={mutation} updateSource={mutation} saveCashFlow={mutation} createScenario={mutation} updateScenario={mutation} createComponent={mutation} saveEquityDetail={mutation} saveJvDetail={mutation} saveEquipmentDetail={mutation} saveGrantDetail={mutation} />);
    expect(getByText("Capital paths by stage")).toBeTruthy();
    fireEvent.click(getByRole("button", { name: "CE returns" }));
    expect(getByText("CE return chart unavailable — no capital source has a complete recorded return input. The source list remains visible for input completion.")).toBeTruthy();
  });
});

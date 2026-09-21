import React from "react";
import { describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { JvContributionPanel, RoiReturnsWorkspace } from "../client/src/App";

const mutation = { mutate: vi.fn(), isPending: false };
const details = { equity: [], jv: [], equipment: [], grants: [] };

describe("ROI / Returns workspace", () => {
  it("renders the auditable six-layer ROI workspace and explains the incomplete cash-flow guard", () => {
    const markup = renderToStaticMarkup(<RoiReturnsWorkspace projects={[{ id: 1, projectName: "CE/FF Factory", capitalRequirement: 1_000_000 }]} sources={[]} cashFlows={[]} scenarios={[]} returnDetails={details} components={[]} capitalOpportunities={[]} createProject={mutation} updateProject={mutation} createSource={mutation} updateSource={mutation} saveCashFlow={mutation} createScenario={mutation} updateScenario={mutation} createComponent={mutation} saveEquityDetail={mutation} saveJvDetail={mutation} saveEquipmentDetail={mutation} saveGrantDetail={mutation} />);
    expect(markup).toContain("ROI / Returns");
    expect(markup).toContain("CAPITAL OVERVIEW");
    expect(markup).toContain("CAPITAL DEPLOYMENT");
    expect(markup).toContain("CAPITAL-PATH ECONOMICS");
    expect(markup).toContain("SCENARIO ANALYSIS");
    expect(markup).toContain("CASH FLOW");
    expect(markup).toContain("ROI unavailable — project cash-flow schedule incomplete.");
  });

  it("shows cross-domain capital stages with source-aware inclusion and keeps rental cost outside capitalization", () => {
    const snapshot = {
      totals: { potential: 8_000_000, committed: 7_000_000, funded: 2_000_000, remainingFundedGap: 23_000_000, capitalizationDataState: "actual" },
      byPath: [
        { capitalPath: "equity", potential: 8_000_000, committed: 0, funded: 0 },
        { capitalPath: "facility_jv", potential: 0, committed: 0, funded: 0 },
        { capitalPath: "equipment_finance", potential: 5_000_000, committed: 5_000_000, funded: 0 },
        { capitalPath: "grants", potential: 2_500_000, committed: 2_000_000, funded: 2_000_000 },
      ],
      rows: [{ id: "10:potential", capitalPath: "grants", capitalState: "potential", amount: 2_500_000, sourceName: "Awarded energy incentive", linkReason: "explicit ROI source link" }, { id: "10:committed", capitalPath: "grants", capitalState: "committed", amount: 2_000_000, sourceName: "Awarded energy incentive", linkReason: "explicit ROI source link" }],
      rentals: { requirementCount: 1, selectedQuoteExposure: 40_000, actualRentalExposure: 44_000 },
      unlinkedProjectSources: [],
    };
    const markup = renderToStaticMarkup(<RoiReturnsWorkspace projects={[{ id: 1, projectName: "CE/FF Factory", capitalRequirement: 25_000_000 }]} sources={[]} cashFlows={[]} scenarios={[]} returnDetails={details} components={[]} capitalOpportunities={[]} crossDomainSnapshot={snapshot} createProject={mutation} updateProject={mutation} createSource={mutation} updateSource={mutation} saveCashFlow={mutation} createScenario={mutation} updateScenario={mutation} createComponent={mutation} saveEquityDetail={mutation} saveJvDetail={mutation} saveEquipmentDetail={mutation} saveGrantDetail={mutation} />);
    expect(markup).toContain("STAGED CAPITAL STACK");
    expect(markup).toContain("explicit ROI source link");
    expect(markup).toContain("Not included in project capitalization");
    expect(markup).toContain("RENTAL OPERATING CONTEXT");
    expect(markup).toContain("not owned-project capitalization and not a financing source");
  });

  it("presents structured CE and partner component controls for a JV source without replacing contribution notes", () => {
    const markup = renderToStaticMarkup(<JvContributionPanel sources={[{ id: 7, capitalPath: "facility_jv", sourceName: "Facility partner" }]} components={[{ id: 1, capitalSourceId: 7, contributor: "ce", componentType: "technology", amount: 40_000 }, { id: 2, capitalSourceId: 7, contributor: "partner", componentType: "land", amount: 60_000 }]} returnDetails={details} createComponent={mutation} saveJvDetail={mutation} />);
    expect(markup).toContain("STRUCTURED JV CONTRIBUTIONS");
    expect(markup).toContain("CE ECONOMIC CONTRIBUTION");
    expect(markup).toContain("PARTNER ECONOMIC CONTRIBUTION");
    expect(markup).toContain("TOTAL JV CAPITALIZATION");
    expect(markup).toContain("supplement existing free-text CE and partner contribution notes");
  });
});

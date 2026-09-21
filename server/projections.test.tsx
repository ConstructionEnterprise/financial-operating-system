// @vitest-environment jsdom
import React from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render } from "@testing-library/react";
import { RoiReturnsWorkspace } from "../client/src/App";
import { calculateProjectionComparison, calculateProjectionScenarioSnapshot } from "../shared/projections";

const mutation = { mutate: vi.fn(), isPending: false };
const details = { equity: [], jv: [], equipment: [], grants: [] };
const crossDomainSnapshot = { totals: { potential: 0, committed: 0, funded: 0, remainingFundedGap: null, capitalizationDataState: "missing" }, byPath: [], rows: [], rentals: { requirementCount: 0, selectedQuoteExposure: null, actualRentalExposure: null }, unlinkedProjectSources: [] };
class ResizeObserverStub { observe() {} unobserve() {} disconnect() {} }
vi.stubGlobal("ResizeObserver", ResizeObserverStub);

afterEach(() => { cleanup(); mutation.mutate.mockClear(); });

describe("ROI / Returns Projections", () => {
  it("keeps omitted scenario values unavailable rather than converting them to zero", () => {
    const snapshot = calculateProjectionScenarioSnapshot({ id: 1, scenarioName: "Base Case", scenarioType: "base", scenarioStatus: "draft" }, [], 36);
    expect(snapshot.operatingSeriesReady).toBe(false);
    expect(snapshot.cashFlowSeriesReady).toBe(false);
    expect(snapshot.ceRoiSeriesReady).toBe(false);
    expect(snapshot.projectedPaybackMonth).toBeNull();
    expect(snapshot.messages.cashFlow).toContain("Unavailable — insufficient inputs");
  });

  it("calculates a signed, isolated projection snapshot only when every required line is present", () => {
    const baseLines = [
      { monthIndex: 1, metricCategory: "revenue" as const, amount: 300, dataState: "projected" as const },
      { monthIndex: 1, metricCategory: "operating_cost" as const, amount: -100, dataState: "projected" as const },
      { monthIndex: 1, metricCategory: "capital_deployment" as const, deploymentCategory: "equipment" as const, amount: -200, dataState: "projected" as const },
      { monthIndex: 1, metricCategory: "financing_cost" as const, amount: 0, dataState: "projected" as const },
      { monthIndex: 1, metricCategory: "funding_draw" as const, amount: 0, dataState: "projected" as const },
      { monthIndex: 1, metricCategory: "ce_capital_contribution" as const, amount: -200, dataState: "projected" as const },
      { monthIndex: 1, metricCategory: "ce_distribution" as const, amount: 300, dataState: "projected" as const },
    ];
    const base = calculateProjectionScenarioSnapshot({ id: 1, scenarioName: "Base Case", scenarioType: "base", scenarioStatus: "draft" }, baseLines, 1);
    const downside = calculateProjectionScenarioSnapshot({ id: 2, scenarioName: "Downside Case", scenarioType: "downside", scenarioStatus: "draft" }, [], 1);
    expect(base.operatingSeriesReady).toBe(true);
    expect(base.cashFlowSeries[0].cumulativeCashFlow).toBe(0);
    expect(base.ceRoiSeries[0].ceRoiBps).toBe(5000);
    expect(base.capitalDeployment).toEqual([{ category: "equipment", amount: 200 }]);
    expect(downside.cashFlowSeriesReady).toBe(false);
    expect(calculateProjectionComparison([{ id: 1, scenarioName: "Base Case", scenarioType: "base", scenarioStatus: "draft" }, { id: 2, scenarioName: "Downside Case", scenarioType: "downside", scenarioStatus: "draft" }], { 1: baseLines, 2: [] }, 1)[1].cashFlowSeriesReady).toBe(false);
  });

  it("opens the Projections ribbon view and exposes missing-state safeguards before assumptions are recorded", () => {
    const internalProject = { id: 71, projectName: "Chappell International Manufacturing Facility" };
    const model = { id: 81, modelName: "Chappell International Manufacturing Facility — 36-Month Project Economics Model", horizonMonths: 36, modelStartDataState: "missing" };
    const scenario = { id: 91, modelId: 81, scenarioName: "Base Case", scenarioType: "base", scenarioStatus: "draft" };
    const projectionSnapshot = { model, scenarios: [calculateProjectionScenarioSnapshot(scenario, [], 36)] };
    const { getByText, getAllByText } = render(<RoiReturnsWorkspace projects={[{ id: 1, projectName: "Sample ROI" }]} sources={[]} cashFlows={[]} scenarios={[]} returnDetails={details} components={[]} capitalOpportunities={[]} crossDomainSnapshot={crossDomainSnapshot} createProject={mutation} updateProject={mutation} createSource={mutation} updateSource={mutation} saveCashFlow={mutation} createScenario={mutation} updateScenario={mutation} createComponent={mutation} saveEquityDetail={mutation} saveJvDetail={mutation} saveEquipmentDetail={mutation} saveGrantDetail={mutation} internalProjects={[internalProject]} projectionInternalProjectId={71} onProjectionInternalProjectSelect={vi.fn()} projectionModel={model} initializeProjectEconomicsModel={mutation} projectionScenarios={[scenario]} projectionAssumptions={[]} projectionMonthlyLines={[]} projectionSnapshot={projectionSnapshot} ensureProjectionScenarioShells={mutation} createProjectionScenario={mutation} updateProjectionScenario={mutation} saveProjectionAssumption={mutation} saveProjectionMonthlyLine={mutation} />);
    fireEvent.click(getByText("Projections").closest("button")!);
    expect(getByText(/SCENARIO-ISOLATED PROJECT ECONOMICS/i)).toBeTruthy();
    expect(getAllByText("Unavailable — insufficient inputs").length).toBeGreaterThan(0);
    expect(getByText("No assumptions recorded for this scenario.")).toBeTruthy();
  });
});

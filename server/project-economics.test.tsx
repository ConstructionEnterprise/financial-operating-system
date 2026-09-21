import React from "react";
import { describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { InternalProjectsWorkspace } from "../client/src/App";
import { projectEconomicsCategoryPresets, projectEconomicsPhases, summarizeProjectEconomicsReadiness } from "../shared/projectEconomics";

const mutation = { mutate: vi.fn(), isPending: false };

describe("Chappell project-economics model shell", () => {
  it("keeps missing values out of returns rather than treating them as zero", () => {
    const readiness = summarizeProjectEconomicsReadiness([{ value: null, dataState: "missing" }], [{ amount: null, dataState: "missing", category: "capex" }]);
    expect(readiness.recordedInputs).toBe(0);
    expect(readiness.recordedMonthlyItems).toBe(0);
    expect(readiness.returnsAvailable).toBe(false);
    expect(readiness.returnStatus).toBe("Unavailable — insufficient inputs");
  });

  it("requires both an actual/projected/estimated inflow and an outflow before ROI / Returns cash-flow analysis can proceed", () => {
    const readiness = summarizeProjectEconomicsReadiness([], [
      { amount: 500, dataState: "projected", category: "draw" },
      { amount: -500, dataState: "projected", category: "capex" },
    ]);
    expect(readiness.returnsAvailable).toBe(true);
    expect(readiness.returnStatus).toBe("Ready for ROI / Returns cash-flow analysis");
  });

  it("renders a 36-month Chappell shell with unavailable returns and no prefilled economic assumptions", () => {
    const project = { id: 44, projectName: "Chappell International Manufacturing Facility", projectStatus: "planning", developmentStage: "development", capitalRequirementDataState: "missing", capitalRequirement: null, totalProjectCostDataState: "missing", totalProjectCost: null };
    const model = { id: 88, modelName: "Chappell International Manufacturing Facility — 36-Month Project Economics Model", modelStatus: "shell", horizonMonths: 36, modelStartDataState: "missing" };
    const markup = renderToStaticMarkup(<InternalProjectsWorkspace projects={[project]} capitalNeeds={[]} capitalNeedStrategies={[]} capitalStack={{ totals: { capitalRequirement: null, potential: 0, committed: 0, funded: 0 }, rows: [], linkedOpportunities: [] }} documents={[]} documentLinks={[]} roiProjects={[]} capitalOpportunities={[]} selectedProjectId={44} onProjectSelect={vi.fn()} onOpenRoi={vi.fn()} createProject={mutation} updateProject={mutation} seedProjects={mutation} saveCapitalNeed={mutation} linkDocument={mutation} unlinkDocument={mutation} updateCapitalOpportunity={mutation} projectEconomicsModel={model} projectEconomicsInputs={[]} projectEconomicsMonthlyItems={[]} projectEconomicsReadiness={summarizeProjectEconomicsReadiness([], [])} projectEconomicsInputDocumentLinks={[]} initializeProjectEconomicsModel={mutation} saveProjectEconomicsInput={mutation} saveProjectEconomicsMonthlyItem={mutation} linkProjectEconomicsInputDocument={mutation} unlinkProjectEconomicsInputDocument={mutation} initialView="economics" />);
    expect(markup).toContain("36 MONTHS");
    expect(markup).toContain("Unavailable — insufficient inputs");
    expect(markup).toContain("No model inputs recorded. The shell deliberately starts blank.");
    expect(markup).toContain("Month 1–36");
  });

  it("supports Cedarwood's configurable residential lifecycle and structured input blueprint without creating financial values", () => {
    expect(projectEconomicsPhases).toEqual(expect.arrayContaining(["predevelopment", "design_entitlement", "construction", "building_completion", "lease_up_stabilization"]));
    expect(projectEconomicsCategoryPresets.uses).toContain("FF&E");
    expect(projectEconomicsCategoryPresets.operations).toEqual(expect.arrayContaining(["Units", "Occupancy", "Rental revenue", "NOI"]));
    const project = { id: 1, projectName: "Cedarwood Flats", projectStatus: "planning", developmentStage: "development", capitalRequirementDataState: "missing", capitalRequirement: null, totalProjectCostDataState: "missing", totalProjectCost: null };
    const model = { id: 99, modelName: "Cedarwood Flats — 36-Month Project Economics Model", modelStatus: "shell", horizonMonths: 36, modelStartDataState: "missing" };
    const markup = renderToStaticMarkup(<InternalProjectsWorkspace projects={[project]} capitalNeeds={[]} capitalNeedStrategies={[]} capitalStack={{ totals: { capitalRequirement: null, potential: 0, committed: 0, funded: 0 }, rows: [], linkedOpportunities: [] }} documents={[]} documentLinks={[]} roiProjects={[]} capitalOpportunities={[]} selectedProjectId={1} onProjectSelect={vi.fn()} onOpenRoi={vi.fn()} createProject={mutation} updateProject={mutation} seedProjects={mutation} saveCapitalNeed={mutation} linkDocument={mutation} unlinkDocument={mutation} updateCapitalOpportunity={mutation} projectEconomicsModel={model} projectEconomicsInputs={[]} projectEconomicsMonthlyItems={[]} projectEconomicsReadiness={summarizeProjectEconomicsReadiness([], [])} projectEconomicsInputDocumentLinks={[]} initializeProjectEconomicsModel={mutation} saveProjectEconomicsInput={mutation} saveProjectEconomicsMonthlyItem={mutation} linkProjectEconomicsInputDocument={mutation} unlinkProjectEconomicsInputDocument={mutation} initialView="economics" />);
    expect(markup).toContain("Land / acquisition");
    expect(markup).toContain("Rental revenue");
    expect(markup).toContain("No model inputs recorded. The shell deliberately starts blank.");
    expect(markup).toContain("Unavailable — insufficient inputs");
  });
});

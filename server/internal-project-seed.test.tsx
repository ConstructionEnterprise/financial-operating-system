import React from "react";
import { describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { InternalProjectsWorkspace } from "../client/src/App";
import { initialInternalProjectSeed, internalProjectSeedExcludedFinancialFields } from "../shared/internalProjectSeed";

const mutation = { mutate: vi.fn(), isPending: false };

describe("approved Internal Project seed", () => {
  it("contains exactly the six authorized project-context records with no financial, capital, or ROI assumptions", () => {
    expect(initialInternalProjectSeed.map((project) => project.projectName)).toEqual(["Cedarwood Flats", "Garden Lofts", "Stonepine Residences", "Skyline Towers", "Chappell International Manufacturing Facility", "Garden Haven"]);
    expect(initialInternalProjectSeed).toHaveLength(6);
    for (const project of initialInternalProjectSeed) {
      expect(project.projectStatus).toBe("planning");
      expect(project.developmentStage).toBe("development");
      expect(project.factoryFoundationRelationshipState).toBe("contextual");
      for (const excludedField of internalProjectSeedExcludedFinancialFields) expect(project).not.toHaveProperty(excludedField);
    }
  });

  it("displays established program facts and a contextual Factory Foundation relationship without converting them into financial data", () => {
    const cedarwood = { id: 1, ...initialInternalProjectSeed[0], capitalRequirementDataState: "missing", totalProjectCostDataState: "missing", capitalRequirement: null, totalProjectCost: null };
    const markup = renderToStaticMarkup(<InternalProjectsWorkspace projects={[cedarwood]} capitalNeeds={[]} capitalNeedStrategies={[]} capitalStack={{ totals: { capitalRequirement: null, potential: 0, committed: 0, funded: 0 }, rows: [], linkedOpportunities: [] }} documents={[]} documentLinks={[]} roiProjects={[]} capitalOpportunities={[]} selectedProjectId={1} onProjectSelect={vi.fn()} onOpenRoi={vi.fn()} createProject={mutation} updateProject={mutation} seedProjects={mutation} saveCapitalNeed={mutation} linkDocument={mutation} unlinkDocument={mutation} updateCapitalOpportunity={mutation} />);
    expect(markup).toContain("280 units");
    expect(markup).toContain("5 buildings");
    expect(markup).toContain("contextual");
    expect(markup).toContain("Not yet recorded");
    expect(markup).not.toContain("$1,000,000");
  });
});

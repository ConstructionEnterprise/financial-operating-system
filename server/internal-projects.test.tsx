import React from "react";
import { describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { InternalProjectsWorkspace } from "../client/src/App";
import { summarizeInternalProjectCapitalStack } from "../shared/internalProjects";

const mutation = { mutate: vi.fn(), isPending: false };

describe("Internal Projects", () => {
  it("keeps multi-strategy capital needs visible without double counting the project requirement", () => {
    const result = summarizeInternalProjectCapitalStack({
      projectId: 7,
      projectName: "Factory Context",
      capitalRequirement: 50_000,
      capitalNeeds: [{ id: 1, internalProjectId: 7, amount: 10_000, amountDataState: "projected" }, { id: 2, internalProjectId: 7, amount: undefined, amountDataState: "missing" }],
      capitalNeedStrategies: [{ capitalNeedId: 1, strategyType: "equity" }, { capitalNeedId: 1, strategyType: "grants" }, { capitalNeedId: 2, strategyType: "equipment_finance" }],
      opportunities: [{ id: 18, capitalPath: "equity", internalProjectId: 7, stage: "identified", requestedAmount: 15_000, committedAmount: 0, fundedAmount: 0 }],
    });
    expect(result.rows.find((row) => row.strategyType === "equity")?.target).toBe(10_000);
    expect(result.rows.find((row) => row.strategyType === "grants")?.target).toBe(10_000);
    expect(result.totals).toMatchObject({ target: 50_000, capitalRequirement: 50_000, potential: 15_000, committed: 0, funded: 0 });
    expect(result.missingCapitalNeedIds).toEqual([2]);
    expect(result.linkedOpportunities[0]).toMatchObject({ id: 18, linkReason: "explicit Internal Project link" });
  });

  it("renders project context and does not present a project as another capital path", () => {
    const capitalStack = { totals: { capitalRequirement: null, potential: 0, committed: 0, funded: 0 }, rows: [{ strategyType: "equity", target: 0, potential: 0, committed: 0, funded: 0, opportunityCount: 0 }], linkedOpportunities: [] };
    const markup = renderToStaticMarkup(<InternalProjectsWorkspace projects={[{ id: 7, projectName: "Factory Context", projectStatus: "planning", developmentStage: "concept", capitalRequirementDataState: "missing" }]} capitalNeeds={[]} capitalNeedStrategies={[]} capitalStack={capitalStack} documents={[]} documentLinks={[]} roiProjects={[]} capitalOpportunities={[]} selectedProjectId={7} onProjectSelect={vi.fn()} onOpenRoi={vi.fn()} createProject={mutation} updateProject={mutation} saveCapitalNeed={mutation} linkDocument={mutation} unlinkDocument={mutation} updateCapitalOpportunity={mutation} />);
    expect(markup).toContain("PROJECT CONTEXT · NOT A CAPITAL PATH");
    expect(markup).toContain("Capital Needs");
    expect(markup).toContain("Capital Stack");
    expect(markup).toContain("Economics");
    expect(markup).toContain("Documents");
    expect(markup).toContain("Capital needs record intended uses; they do not create capital opportunities or amounts by assumption.");
  });
});

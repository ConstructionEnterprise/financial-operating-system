import React from "react";
import { describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { GrantsIncentivesWorkspace } from "../client/src/App";

const mutation = { mutate: vi.fn(), isPending: false };
const program = { id: 1, programName: "Source-attributed Advanced Manufacturing Program", sponsor: "Official Agency", mechanismType: "grant", governmentLevel: "federal", texasRegion: "Texas eligible", industryFocus: "advanced manufacturing", programUrl: "https://example.com/program", sourceUrl: "https://example.com/source", sourceLabel: "Official source", researchDate: new Date(), applicationWindow: "unknown", priority: "C", priorityRationale: "Priority C — research-stage program; CE and project eligibility have not been verified.", status: "research" };
const props = { view: "programs" as const, setView: vi.fn(), programs: [program], opportunities: [], applications: [], awards: [], disbursements: [], complianceItems: [], importSeed: mutation, createProgram: mutation, updateProgram: mutation, createOpportunity: mutation, updateOpportunity: mutation, createApplication: mutation, updateApplication: mutation, saveAward: mutation, createDisbursement: mutation, createComplianceItem: mutation, updateComplianceItem: mutation };

describe("Grants & Incentives workspace", () => {
  it("uses a command ribbon and keeps research programs separate from qualified operating opportunities", () => {
    const markup = renderToStaticMarkup(<GrantsIncentivesWorkspace {...props} />);
    expect(markup).toContain("Overview");
    expect(markup).toContain("Programs");
    expect(markup).toContain("Opportunities");
    expect(markup).toContain("Applications");
    expect(markup).toContain("Awards");
    expect(markup).toContain("Compliance");
    expect(markup).toContain("FUNDING OPPORTUNITY QUALIFICATION");
    expect(markup).toContain("Research records are source-attributed");
    expect(markup).toContain("Record evidence &amp; qualify");
  });

  it("communicates the governed application-to-award-to-funded-capital lifecycle", () => {
    const markup = renderToStaticMarkup(<GrantsIncentivesWorkspace {...props} view="overview" />);
    expect(markup).toContain("Program → Opportunity → Qualified → Application");
    expect(markup).toContain("Requested, awarded, and funded amounts are never blended");
    expect(markup).toContain("actual award is recorded");
  });
});

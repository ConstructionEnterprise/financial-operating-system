import { describe, expect, it } from "vitest";
import { scoreJvProspect, summarizeJvProspectRegions } from "../shared/jvProspects";

describe("Texas JV prospect prioritization", () => {
  it("assigns an A priority only when partner type, geography, fit, and contribution evidence are recorded", () => {
    expect(scoreJvProspect({ partnerType: "industrial_developer", region: "DFW", strategicFit: "High", jvExperience: "Public JV evidence", landContributionPotential: "Yes", capitalContributionPotential: "Unknown", developmentContributionPotential: "Yes", facilityContributionPotential: "Unknown" })).toMatchObject({ priority: "A" });
  });

  it("keeps incomplete market intelligence as a C priority rather than pretending it is qualified", () => {
    expect(scoreJvProspect({ partnerType: "economic_development_strategic_partner", region: "Other Texas", strategicFit: "Low" })).toMatchObject({ priority: "C" });
  });

  it("reports regional sourcing counts explicitly instead of flattening Texas market coverage", () => {
    expect(summarizeJvProspectRegions([{ region: "Houston" }, { region: "DFW" }, { region: "Houston" }, { region: null }])).toEqual([
      { region: "Houston", count: 2 },
      { region: "DFW", count: 1 },
      { region: "Unspecified Texas region", count: 1 },
    ]);
  });
});

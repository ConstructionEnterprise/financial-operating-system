import { describe, expect, it } from "vitest";
import { buildProjectScenarioScorecard } from "../shared/projectScenarioScorecard";

describe("project scenario scorecard", () => {
  it("uses the recorded building count instead of ambiguous facility program units", () => {
    const result = buildProjectScenarioScorecard(
      { projectType: "Manufacturing / Industrial Facility", programBuildingCount: 1 },
      { unitCount: 4, squareFeet: 100_000, costPerSf: 410, annualNoi: null },
    );
    expect(result).toMatchObject({ facility: true, programCount: 1, programCountLabel: "building", squareFeet: 100_000, efficiencyLabel: "Cost / SF" });
  });

  it("uses residential and tenure-specific measures when they are recorded", () => {
    const result = buildProjectScenarioScorecard(
      { projectType: "Residential Development" },
      { unitCount: 200, rentalUnits: 30, saleUnits: 170, annualPotentialRentalIncome: 900_000, annualNoi: null, costPerUnit: 323_750 },
    );
    expect(result).toMatchObject({ mixedTenure: true, programCount: 200, programCountLabel: "residence", rentalUnits: 30, saleUnits: 170, incomeLabel: "Annual potential rent", operatingMargin: null });
  });

  it("describes multifamily projects as apartments and preserves their building count", () => {
    const result = buildProjectScenarioScorecard(
      { projectType: "Multifamily Residential Development", programBuildingCount: 5 },
      { unitCount: 280, squareFeet: 258_300, costPerUnit: 142_857 },
    );
    expect(result).toMatchObject({ apartment: true, programCount: 280, programCountLabel: "apartment", buildingCount: 5, efficiencyLabel: "Cost / apartment" });
  });

  it("keeps an incomplete CE return separate from modeled operating income", () => {
    const result = buildProjectScenarioScorecard(
      { projectType: "Apartment" },
      { annualRevenue: 7_000_000, annualNoi: 4_200_000, ceRoiBps: -10_000, ceRoiSeriesReady: false },
    );
    expect(result.operatingMargin).toBe(60);
    expect(result.modeledReturn).toBe(false);
    expect(result.ceRoiBps).toBeNull();
  });

  it("retains a negative modeled CE return when complete contribution and distribution series exist", () => {
    const result = buildProjectScenarioScorecard(
      { projectType: "Apartment" },
      { ceRoiBps: -10_000, ceRoiSeriesReady: true, projectedPaybackMonth: null },
    );
    expect(result).toMatchObject({ modeledReturn: true, ceRoiBps: -10_000, projectedPaybackMonth: null });
  });
});

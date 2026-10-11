export type ProjectScorecardInput = {
  projectType?: string | null;
  programBuildingCount?: number | null;
};

export type ScenarioScorecardInput = {
  unitCount?: number | null;
  squareFeet?: number | null;
  costPerUnit?: number | null;
  costPerSf?: number | null;
  rentalUnits?: number | null;
  saleUnits?: number | null;
  annualPotentialRentalIncome?: number | null;
  annualRevenue?: number | null;
  annualNoi?: number | null;
  ceRoiBps?: number | null;
  ceRoiSeriesReady?: boolean;
  projectedPaybackMonth?: number | null;
};

export function buildProjectScenarioScorecard(project: ProjectScorecardInput, scenario: ScenarioScorecardInput) {
  const facility = /manufactur|industrial|facility/i.test(project.projectType ?? "");
  const apartment = !facility && /multifamily|apartment/i.test(project.projectType ?? "");
  const mixedTenure = !facility && Number(scenario.rentalUnits ?? 0) > 0 && Number(scenario.saleUnits ?? 0) > 0;
  const income = scenario.annualPotentialRentalIncome ?? scenario.annualRevenue ?? null;
  const noi = scenario.annualNoi ?? null;
  const operatingMargin = income !== null && income > 0 && noi !== null && noi >= 0 && noi <= income ? Math.round(noi / income * 100) : null;
  const modeledReturn = scenario.ceRoiSeriesReady === true && scenario.ceRoiBps != null;

  return {
    facility,
    apartment,
    mixedTenure,
    programLabel: facility ? "Facility footprint" : apartment ? "Apartment program" : "Residential program",
    programCount: facility ? project.programBuildingCount ?? null : scenario.unitCount ?? null,
    programCountLabel: facility ? "building" : apartment ? "apartment" : "residence",
    buildingCount: project.programBuildingCount ?? null,
    squareFeet: scenario.squareFeet ?? null,
    efficiencyLabel: facility ? "Cost / SF" : apartment ? "Cost / apartment" : "Cost / residence",
    efficiencyValue: facility ? scenario.costPerSf ?? null : scenario.costPerUnit ?? null,
    rentalUnits: mixedTenure ? scenario.rentalUnits! : null,
    saleUnits: mixedTenure ? scenario.saleUnits! : null,
    income,
    incomeLabel: scenario.annualPotentialRentalIncome != null ? "Annual potential rent" : "Annual modeled revenue",
    noi,
    operatingMargin,
    modeledReturn,
    ceRoiBps: modeledReturn ? scenario.ceRoiBps! : null,
    projectedPaybackMonth: modeledReturn ? scenario.projectedPaybackMonth ?? null : null,
  };
}

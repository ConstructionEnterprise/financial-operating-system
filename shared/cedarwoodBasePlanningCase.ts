export const cedarwoodBasePlanningSource = "pasted_content_23.txt, user-supplied Cedarwood Base Planning Case, received 2026-08-21";
export const cedarwoodBasePlanningOwner = "jchappell2120";

export const cedarwoodBasePlanningProgram = {
  buildings: 5,
  units: 280,
  unitsPerBuilding: 56,
  residentialSqFt: 258_300,
  developmentCost: 40_000_000,
  historicalNoiReference: 4_750_000,
  financingFacilityReference: 55_000_000,
  otherIncomePerUnitMonth: 75,
  annualOperatingExpenses: 2_240_000,
  stabilizedOccupancyBps: 9_500,
  modeledConstructionDebt: 36_000_000,
  modeledSponsorEquity: 4_000_000,
  annualInterestRateBps: 750,
  financingFeeBps: 100,
  termMonths: 360,
  amortizationMonths: 360,
  interestOnlyMonths: 24,
  closingMonth: 4,
  exitCapRateBps: 550,
  saleCostBps: 300,
  ceDistributionShareBps: 10_000,
} as const;

export const cedarwoodBasePlanningUnitMix = [
  { unitType: "Studio", unitCount: 28, averageSqFt: 600, monthlyRent: 1_450 },
  { unitType: "1 Bedroom", unitCount: 112, averageSqFt: 775, monthlyRent: 1_850 },
  { unitType: "2 Bedroom", unitCount: 112, averageSqFt: 1_050, monthlyRent: 2_350 },
  { unitType: "3 Bedroom", unitCount: 28, averageSqFt: 1_325, monthlyRent: 2_900 },
] as const;

export const cedarwoodBasePlanningOperatingExpenses = [
  { metric: "property_taxes", value: 700_000 },
  { metric: "insurance", value: 210_000 },
  { metric: "property_management", value: 210_000 },
  { metric: "utilities", value: 250_000 },
  { metric: "repairs_maintenance", value: 300_000 },
  { metric: "onsite_payroll", value: 240_000 },
  { metric: "landscaping_grounds", value: 100_000 },
  { metric: "marketing_leasing", value: 70_000 },
  { metric: "administrative", value: 60_000 },
  { metric: "replacement_operating_reserves", value: 100_000 },
] as const;

export type CedarwoodPlanningPhase = "predevelopment" | "design_entitlement" | "construction" | "building_completion" | "commissioning" | "lease_up_stabilization";
export type CedarwoodPlanningScheduleRow = { monthIndex: number; phase: CedarwoodPlanningPhase; constructionSpendBps: number; occupancyBps: number };

const deploymentBps = [150, 150, 200, 250, 300, 450, 400, 500, 600, 500, 550, 750, 600, 650, 650, 550, 500, 450, 400, 400, 400, 250, 200, 150, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
const occupancyBps = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2_000, 3_500, 5_000, 6_200, 7_200, 8_000, 8_600, 9_000, 9_200, 9_400, 9_500, 9_500];

const phaseForMonth = (monthIndex: number): CedarwoodPlanningPhase => {
  if (monthIndex <= 3) return "predevelopment";
  if (monthIndex <= 5) return "design_entitlement";
  if (monthIndex <= 18) return "construction";
  if (monthIndex <= 22) return "building_completion";
  if (monthIndex <= 24) return "commissioning";
  return "lease_up_stabilization";
};

export const cedarwoodBasePlanningSchedule: CedarwoodPlanningScheduleRow[] = deploymentBps.map((constructionSpendBps, index) => ({
  monthIndex: index + 1,
  phase: phaseForMonth(index + 1),
  constructionSpendBps,
  occupancyBps: occupancyBps[index],
}));

export type CedarwoodPlanningScenarioDefinition = {
  scenarioName: string;
  scenarioType: "downside" | "base" | "upside" | "custom";
  developmentCostBps: number;
  rentBps: number;
  occupancyBps: number;
  operatingExpenseBps: number;
  debtBps: number;
  annualInterestRateBps: number;
  financingFeeBps: number;
  exitCapRateBps: number;
  saleCostBps: number;
  ceDistributionShareBps: number;
};

export const cedarwoodPlanningScenarioDefinitions: CedarwoodPlanningScenarioDefinition[] = [
  { scenarioName: "Downside Case", scenarioType: "downside", developmentCostBps: 11_000, rentBps: 9_000, occupancyBps: 9_000, operatingExpenseBps: 10_500, debtBps: 11_000, annualInterestRateBps: 850, financingFeeBps: 125, exitCapRateBps: 625, saleCostBps: 350, ceDistributionShareBps: 10_000 },
  { scenarioName: "Base Case", scenarioType: "base", developmentCostBps: 10_000, rentBps: 10_000, occupancyBps: 9_500, operatingExpenseBps: 10_000, debtBps: 10_000, annualInterestRateBps: 750, financingFeeBps: 100, exitCapRateBps: 550, saleCostBps: 300, ceDistributionShareBps: 10_000 },
  { scenarioName: "Upside Case", scenarioType: "upside", developmentCostBps: 9_500, rentBps: 10_700, occupancyBps: 9_700, operatingExpenseBps: 9_500, debtBps: 9_500, annualInterestRateBps: 700, financingFeeBps: 75, exitCapRateBps: 500, saleCostBps: 250, ceDistributionShareBps: 10_000 },
  { scenarioName: "Historical Planning — Cedarwood Baseline", scenarioType: "custom", developmentCostBps: 10_000, rentBps: 10_000, occupancyBps: 9_500, operatingExpenseBps: 10_000, debtBps: 10_000, annualInterestRateBps: 750, financingFeeBps: 100, exitCapRateBps: 550, saleCostBps: 300, ceDistributionShareBps: 10_000 },
];

export function scaleBps(value: number, bps: number) { return Math.round(value * bps / 10_000); }

export function getCedarwoodScenarioSchedule(definition: CedarwoodPlanningScenarioDefinition) {
  return cedarwoodBasePlanningSchedule.map((row) => ({ ...row, occupancyBps: Math.min(definition.occupancyBps, row.occupancyBps) }));
}

export function assertCedarwoodBasePlanningCase() {
  const unitCount = cedarwoodBasePlanningUnitMix.reduce((sum, row) => sum + row.unitCount, 0);
  const squareFeet = cedarwoodBasePlanningUnitMix.reduce((sum, row) => sum + row.unitCount * row.averageSqFt, 0);
  const annualRent = cedarwoodBasePlanningUnitMix.reduce((sum, row) => sum + row.unitCount * row.monthlyRent * 12, 0);
  const scheduleTotal = cedarwoodBasePlanningSchedule.reduce((sum, row) => sum + row.constructionSpendBps, 0);
  const annualExpenses = cedarwoodBasePlanningOperatingExpenses.reduce((sum, row) => sum + row.value, 0);
  if (unitCount !== cedarwoodBasePlanningProgram.units) throw new Error(`Cedarwood unit mix must total ${cedarwoodBasePlanningProgram.units}; received ${unitCount}.`);
  if (squareFeet !== cedarwoodBasePlanningProgram.residentialSqFt) throw new Error(`Cedarwood unit mix must total ${cedarwoodBasePlanningProgram.residentialSqFt} SF; received ${squareFeet}.`);
  if (annualRent !== 7_106_400) throw new Error(`Cedarwood annual gross rent must total 7106400; received ${annualRent}.`);
  if (scheduleTotal !== 10_000) throw new Error(`Cedarwood schedule must total 10,000 bps; received ${scheduleTotal}.`);
  if (annualExpenses !== cedarwoodBasePlanningProgram.annualOperatingExpenses) throw new Error(`Cedarwood operating expenses must total ${cedarwoodBasePlanningProgram.annualOperatingExpenses}; received ${annualExpenses}.`);
  return true;
}

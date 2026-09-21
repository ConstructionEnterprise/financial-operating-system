export const cedarwoodHistoricalPlanningSource = "pasted_content_21.txt, received 2026-08-21";
export const cedarwoodHistoricalPlanningOwner = "jchappell2120";
export const cedarwoodHistoricalControlTotal = 40_000_000;

export const cedarwoodHistoricalControls = {
  units: 280,
  buildings: 5,
  unitsPerBuilding: 56,
  totalDevelopmentCost: cedarwoodHistoricalControlTotal,
  constructionBasisLow: 155,
  constructionBasisCentral: 160,
  constructionBasisHigh: 165,
  grossSfCentral: 250_000,
  grossSfLow: 258_065,
  grossSfHigh: 242_424,
  averageSfPerUnit: 893,
  grossSfPerBuilding: 50_000,
  developmentCostPerUnit: 142_857,
  developmentCostPerBuilding: 8_000_000,
  historicalNoi: 4_750_000,
  yieldOnCostBps: 11_875,
  noiPerUnitAnnual: 16_964,
  moduleEquivalentArea: 360,
  moduleEquivalents: 694,
} as const;

export type CedarwoodWbsSeedLine = {
  wbsCode: string;
  description: string;
  costCategory: string;
  phase: string;
  buildingApplicability: string;
  quantity: number;
  quantityUnit: string;
  unitCost: number;
  allocatedAmount: number;
  notes: string;
};

type WbsInput = [description: string, costCategory: string, phase: string, buildingApplicability: string, allocatedAmount: number];

const allocationNote = "Reverse-Engineered Historical Planning Allocation derived from the $40M Cedarwood control total; not an actual invoice, validated bid, current capital requirement, or cash-flow line.";

const wbsInputs: WbsInput[] = [
  ["Land acquisition consideration", "land_acquisition", "predevelopment", "Project-wide", 3_400_000], ["Acquisition due diligence", "land_acquisition", "predevelopment", "Project-wide", 150_000], ["Title and escrow", "land_acquisition", "predevelopment", "Project-wide", 50_000], ["Acquisition legal", "land_acquisition", "predevelopment", "Project-wide", 50_000], ["Environmental review", "land_acquisition", "predevelopment", "Project-wide", 50_000], ["Boundary and topographic survey", "land_acquisition", "predevelopment", "Project-wide", 50_000], ["Geotechnical investigation", "land_acquisition", "predevelopment", "Project-wide", 75_000], ["Acquisition brokerage", "land_acquisition", "predevelopment", "Project-wide", 50_000], ["Demolition and clearing allowance", "land_acquisition", "predevelopment", "Project-wide", 50_000], ["Land closing reserve", "land_acquisition", "predevelopment", "Project-wide", 75_000],
  ["Mass grading", "site_development", "construction", "Project-wide", 700_000], ["Utility extension", "site_development", "construction", "Project-wide", 500_000], ["Water and sewer improvements", "site_development", "construction", "Project-wide", 500_000], ["Stormwater infrastructure", "site_development", "construction", "Project-wide", 500_000], ["Paving, curbs, and sidewalks", "site_development", "construction", "Project-wide", 450_000], ["Landscape and irrigation", "site_development", "construction", "Project-wide", 250_000], ["Detention and retention", "site_development", "construction", "Project-wide", 300_000], ["Earthwork and import/export", "site_development", "construction", "Project-wide", 300_000], ["Temporary utilities", "site_development", "construction", "Project-wide", 200_000], ["Site development reserve", "site_development", "construction", "Project-wide", 300_000],
  ["LGS primary structure", "building_modular", "construction", "All five buildings", 1_200_000], ["LGS secondary framing", "building_modular", "construction", "All five buildings", 800_000], ["Structural connectors and fasteners", "building_modular", "construction", "All five buildings", 700_000], ["Structural engineering coordination", "building_modular", "construction", "All five buildings", 500_000], ["Structural fabrication reserve", "building_modular", "construction", "All five buildings", 380_000],
  ["Exterior wall assemblies", "building_modular", "construction", "All five buildings", 700_000], ["Exterior cladding", "building_modular", "construction", "All five buildings", 500_000], ["Air and water barrier", "building_modular", "construction", "All five buildings", 500_000], ["Insulation systems", "building_modular", "construction", "All five buildings", 460_000], ["Exterior finish reserve", "building_modular", "construction", "All five buildings", 400_000],
  ["Plumbing rough-in", "building_modular", "construction", "All five buildings", 900_000], ["Electrical rough-in", "building_modular", "construction", "All five buildings", 900_000], ["HVAC equipment and distribution", "building_modular", "construction", "All five buildings", 900_000], ["Fire protection", "building_modular", "construction", "All five buildings", 550_000], ["Low-voltage and controls", "building_modular", "construction", "All five buildings", 350_000], ["Metering and service equipment", "building_modular", "construction", "All five buildings", 200_000], ["MEP design coordination", "building_modular", "construction", "All five buildings", 650_000], ["MEP integration reserve", "building_modular", "construction", "All five buildings", 670_000],
  ["Unit framing and partitions", "building_modular", "construction", "All five buildings", 700_000], ["Drywall and finish prep", "building_modular", "construction", "All five buildings", 700_000], ["Interior paint", "building_modular", "construction", "All five buildings", 400_000], ["Flooring", "building_modular", "construction", "All five buildings", 800_000], ["Cabinets and countertops", "building_modular", "construction", "All five buildings", 900_000], ["Millwork", "building_modular", "construction", "All five buildings", 600_000], ["Bathroom finishes", "building_modular", "construction", "All five buildings", 800_000], ["Interior doors and hardware", "building_modular", "construction", "All five buildings", 500_000],
  ["Roofing membrane", "building_modular", "construction", "All five buildings", 800_000], ["Roof insulation and accessories", "building_modular", "construction", "All five buildings", 480_000], ["Windows", "building_modular", "construction", "All five buildings", 1_100_000], ["Exterior doors and glazing", "building_modular", "construction", "All five buildings", 440_000], ["Appliances", "building_modular", "construction", "All five buildings", 500_000], ["Plumbing fixtures", "building_modular", "construction", "All five buildings", 400_000], ["Electrical fixtures", "building_modular", "construction", "All five buildings", 380_000], ["Common-area finishes", "building_modular", "construction", "All five buildings", 700_000], ["Amenity equipment", "building_modular", "construction", "Project-wide", 500_000], ["Common-area furnishings allowance", "building_modular", "construction", "Project-wide", 340_000], ["QA/QC inspection", "building_modular", "commissioning", "All five buildings", 750_000], ["Building commissioning", "building_modular", "commissioning", "All five buildings", 500_000], ["Punch and turnover", "building_modular", "building_completion", "All five buildings", 500_000], ["Building completion reserve", "building_modular", "building_completion", "All five buildings", 1_550_000],
  ["Factory production setup", "factory_logistics_installation", "factory_production", "All five buildings", 200_000], ["Panel and module assembly", "factory_logistics_installation", "factory_production", "All five buildings", 180_000], ["Factory labor coordination", "factory_logistics_installation", "factory_production", "All five buildings", 180_000], ["Factory QA hold points", "factory_logistics_installation", "factory_production", "All five buildings", 100_000], ["Packaging and protection", "factory_logistics_installation", "factory_production", "All five buildings", 80_000], ["Staging and handling", "factory_logistics_installation", "logistics", "All five buildings", 100_000], ["Transportation", "factory_logistics_installation", "transportation", "All five buildings", 250_000], ["Route and permit coordination", "factory_logistics_installation", "transportation", "All five buildings", 50_000], ["Transit insurance allowance", "factory_logistics_installation", "transportation", "All five buildings", 50_000], ["Site receiving", "factory_logistics_installation", "site_installation", "All five buildings", 100_000], ["Crane and lifting", "factory_logistics_installation", "site_installation", "All five buildings", 200_000], ["Set and alignment", "factory_logistics_installation", "site_installation", "All five buildings", 150_000], ["Installation coordination", "factory_logistics_installation", "site_installation", "All five buildings", 100_000], ["Temporary weather protection", "factory_logistics_installation", "site_installation", "All five buildings", 80_000], ["Logistics reserve", "factory_logistics_installation", "site_installation", "All five buildings", 180_000],
  ["Architecture", "professional_soft_costs", "design_entitlement", "Project-wide", 300_000], ["Structural engineering", "professional_soft_costs", "design_entitlement", "Project-wide", 200_000], ["MEP engineering", "professional_soft_costs", "design_entitlement", "Project-wide", 200_000], ["Civil engineering", "professional_soft_costs", "design_entitlement", "Project-wide", 150_000], ["Permitting and entitlement", "professional_soft_costs", "design_entitlement", "Project-wide", 100_000], ["Project management", "professional_soft_costs", "construction", "Project-wide", 300_000], ["Legal", "professional_soft_costs", "predevelopment", "Project-wide", 150_000], ["Accounting and tax", "professional_soft_costs", "predevelopment", "Project-wide", 100_000], ["Builder's risk insurance", "professional_soft_costs", "construction", "Project-wide", 150_000], ["Marketing", "professional_soft_costs", "lease_up_stabilization", "Project-wide", 150_000], ["Leasing", "professional_soft_costs", "lease_up_stabilization", "Project-wide", 150_000], ["Leasing commissions", "professional_soft_costs", "lease_up_stabilization", "Project-wide", 200_000], ["Owner administration reserve", "professional_soft_costs", "predevelopment", "Project-wide", 250_000],
  ["Loan origination", "financing_carry", "predevelopment", "Project-wide", 350_000], ["Interest carry", "financing_carry", "construction", "Project-wide", 400_000], ["Lender legal and diligence", "financing_carry", "predevelopment", "Project-wide", 100_000], ["Loan administration", "financing_carry", "construction", "Project-wide", 100_000], ["Interest reserve", "financing_carry", "construction", "Project-wide", 150_000], ["Extension reserve", "financing_carry", "construction", "Project-wide", 100_000],
  ["Construction contingency", "contingency", "construction", "All five buildings", 300_000], ["Site contingency", "contingency", "construction", "Project-wide", 100_000], ["Materials contingency", "contingency", "construction", "All five buildings", 100_000], ["Factory contingency", "contingency", "factory_production", "All five buildings", 100_000], ["Schedule contingency", "contingency", "construction", "Project-wide", 100_000], ["Closeout contingency", "contingency", "building_completion", "Project-wide", 100_000],
];

export const cedarwoodHistoricalPlanningWbs: CedarwoodWbsSeedLine[] = wbsInputs.map(([description, costCategory, phase, buildingApplicability, allocatedAmount], index) => ({
  wbsCode: String(index + 1).padStart(3, "0"), description, costCategory, phase, buildingApplicability, quantity: 1, quantityUnit: "planning_allowance", unitCost: allocatedAmount, allocatedAmount, notes: allocationNote,
}));

export const cedarwoodHistoricalPlanningWbsTotal = cedarwoodHistoricalPlanningWbs.reduce((sum, line) => sum + line.allocatedAmount, 0);

export function assertCedarwoodHistoricalPlanningWbs() {
  if (cedarwoodHistoricalPlanningWbs.length !== 100) throw new Error(`Cedarwood WBS must contain 100 lines; received ${cedarwoodHistoricalPlanningWbs.length}.`);
  if (cedarwoodHistoricalPlanningWbsTotal !== cedarwoodHistoricalControlTotal) throw new Error(`Cedarwood WBS must reconcile to ${cedarwoodHistoricalControlTotal}; received ${cedarwoodHistoricalPlanningWbsTotal}.`);
  return true;
}

export type CedarwoodHistoricalPlanningScheduleRow = {
  monthIndex: number;
  phase: "predevelopment" | "design_entitlement" | "construction" | "building_completion" | "commissioning" | "lease_up_stabilization";
  constructionSpendBps: number;
  occupancyBps: number;
  dataState: "estimated";
  sourceReference: string;
  ownerName: string;
  notes: string;
};

const initialScheduleSource = `${cedarwoodHistoricalPlanningSource}; initial 36-month timing profile derived from the historical $40M WBS phase mix for underwriting use. It is an estimated planning schedule, not an actual construction record or executed timeline.`;

const initialScheduleRows: Array<[phase: CedarwoodHistoricalPlanningScheduleRow["phase"], constructionSpendBps: number, occupancyBps: number]> = [
  ["predevelopment", 100, 0], ["predevelopment", 150, 0], ["predevelopment", 200, 0],
  ["design_entitlement", 200, 0], ["design_entitlement", 200, 0], ["design_entitlement", 200, 0], ["design_entitlement", 200, 0], ["design_entitlement", 200, 0],
  ["construction", 350, 0], ["construction", 350, 0], ["construction", 350, 0], ["construction", 350, 0],
  ["construction", 500, 0], ["construction", 500, 0], ["construction", 500, 0], ["construction", 500, 0],
  ["construction", 600, 0], ["construction", 600, 0], ["construction", 600, 0], ["construction", 600, 0],
  ["construction", 500, 0], ["construction", 500, 0], ["construction", 500, 0], ["construction", 500, 0],
  ["construction", 200, 0], ["construction", 200, 0], ["building_completion", 200, 1_000], ["building_completion", 50, 2_500], ["building_completion", 50, 4_500], ["building_completion", 25, 6_000],
  ["commissioning", 25, 7_500], ["lease_up_stabilization", 0, 8_500], ["lease_up_stabilization", 0, 9_200], ["lease_up_stabilization", 0, 9_500], ["lease_up_stabilization", 0, 9_500], ["lease_up_stabilization", 0, 9_500],
];

export const cedarwoodHistoricalPlanningInitialSchedule: CedarwoodHistoricalPlanningScheduleRow[] = initialScheduleRows.map(([phase, constructionSpendBps, occupancyBps], index) => ({
  monthIndex: index + 1,
  phase,
  constructionSpendBps,
  occupancyBps,
  dataState: "estimated",
  sourceReference: initialScheduleSource,
  ownerName: cedarwoodHistoricalPlanningOwner,
  notes: "Initial underwriting timing profile. Replace with sourced development and lease-up timing when available; this row does not represent actual spend, billing, occupancy, or delivered units.",
}));

export function assertCedarwoodHistoricalPlanningInitialSchedule() {
  if (cedarwoodHistoricalPlanningInitialSchedule.length !== 36) throw new Error(`Cedarwood initial schedule must contain 36 months; received ${cedarwoodHistoricalPlanningInitialSchedule.length}.`);
  const total = cedarwoodHistoricalPlanningInitialSchedule.reduce((sum, row) => sum + row.constructionSpendBps, 0);
  if (total !== 10_000) throw new Error(`Cedarwood initial schedule must allocate 10,000 bps; received ${total}.`);
  const nonDecreasing = cedarwoodHistoricalPlanningInitialSchedule.every((row, index, rows) => index === 0 || row.occupancyBps >= rows[index - 1].occupancyBps);
  if (!nonDecreasing) throw new Error("Cedarwood initial schedule occupancy must be non-decreasing.");
  return true;
}

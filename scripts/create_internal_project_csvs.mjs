import fs from "node:fs";
import path from "node:path";

const outputDir = "/home/ubuntu/ceff-deliverables/internal-project-csvs";
const owner = "jchappell2120";
const baseSource = "pasted_content_20.txt, CE Development Portfolio Financial Baseline, user-supplied 2026-08-21";
const cedarwoodSource = "pasted_content_23.txt, Cedarwood Base Planning Case, user-supplied 2026-08-21";
const skylineSource = "pasted_content_25.txt, Skyline Towers 10-Point Financial OS Design Package, user-supplied 2026-08-21";
const inferred = "Derived estimated planning assumption for Financial OS standardization; replace with source-backed project evidence when available.";

const headers = [
  "project_id", "project_name", "project_type", "scenario_name", "scenario_type", "record_group", "sku_id", "metric", "description", "value", "unit", "data_state", "source_reference", "effective_date", "owner_name", "month_start", "month_end", "phase", "include_in_model", "notes",
];

function escapeCsv(value) {
  if (value === null || value === undefined) return "";
  const text = String(value);
  return /[",\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}

function writeCsv(fileName, rows) {
  const body = [headers, ...rows.map((row) => headers.map((header) => row[header] ?? ""))]
    .map((line) => line.map(escapeCsv).join(","))
    .join("\n");
  fs.writeFileSync(path.join(outputDir, fileName), `${body}\n`, "utf8");
}

function baseRow(project, scenario, extras = {}) {
  return {
    project_id: project.id,
    project_name: project.name,
    project_type: project.type,
    scenario_name: scenario.name,
    scenario_type: scenario.type,
    data_state: "estimated",
    source_reference: scenario.source,
    effective_date: "",
    owner_name: owner,
    include_in_model: "yes",
    notes: scenario.notes,
    ...extras,
  };
}

function addRow(rows, project, scenario, extras) {
  rows.push(baseRow(project, scenario, extras));
}

const rawWbs = fs.readFileSync("/home/ubuntu/ceff-outreach-app/shared/cedarwoodHistoricalPlanning.ts", "utf8");
const wbsPattern = /\["([^"]+)",\s*"([^"]+)",\s*"([^"]+)",\s*"([^"]+)",\s*([\d_]+)\]/g;
const wbsTemplate = [...rawWbs.matchAll(wbsPattern)].map((match, index) => ({
  number: String(index + 1).padStart(3, "0"),
  description: match[1],
  category: match[2],
  phase: match[3],
  applicability: match[4],
  cedarwoodAmount: Number(match[5].replaceAll("_", "")),
}));

if (wbsTemplate.length !== 100) throw new Error(`Expected 100 WBS template rows; found ${wbsTemplate.length}.`);

function projectSpecificWbsDescription(project, item) {
  if (project.id === 5) {
    const facilityMap = {
      land_acquisition: "Facility site / acquisition",
      site_development: "Manufacturing site / utilities",
      building_modular: "Facility shell, systems, production fit-out",
      factory_logistics_installation: "Production logistics, material flow, installation",
      professional_soft_costs: "Facility design, engineering, professional services",
      financing_carry: "Facility financing and carrying",
      contingency: "Facility contingency",
    };
    return `${facilityMap[item.category] ?? "Facility CapEx"} — ${item.description}`;
  }
  if (project.id === 3 || project.id === 6) {
    return `Residential subdivision / home delivery — ${item.description}`;
  }
  if (project.id === 4) {
    return `High-rise mixed-use — ${item.description}`;
  }
  if (project.id === 2) {
    return `Mid-rise multifamily — ${item.description}`;
  }
  return item.description;
}

function addWbs(rows, project, scenario, totalCost, source, note) {
  let allocated = 0;
  wbsTemplate.forEach((item, index) => {
    const amount = index === wbsTemplate.length - 1
      ? totalCost - allocated
      : Math.round((item.cedarwoodAmount / 40_000_000) * totalCost);
    allocated += amount;
    addRow(rows, project, scenario, {
      record_group: "wbs_budget",
      sku_id: `WBS-${item.number}`,
      metric: "extended_cost",
      description: projectSpecificWbsDescription(project, item),
      value: amount,
      unit: "usd",
      source_reference: source,
      phase: item.phase,
      notes: `${note} | Standardized WBS category: ${item.category}; applicability: ${item.applicability}.`,
    });
  });
  if (allocated !== totalCost) throw new Error(`${project.name} WBS does not reconcile.`);
}

function interpolateCumulative(month, anchors) {
  const ordered = [...anchors].sort((a, b) => a.month - b.month);
  if (month <= ordered[0].month) return ordered[0].value * (month / ordered[0].month);
  for (let index = 1; index < ordered.length; index += 1) {
    const prior = ordered[index - 1];
    const next = ordered[index];
    if (month <= next.month) {
      return prior.value + ((next.value - prior.value) * (month - prior.month)) / (next.month - prior.month);
    }
  }
  return ordered.at(-1).value;
}

function addMonthlySchedule(rows, project, scenario, config) {
  let previousCost = 0;
  let previousOccupancy = 0;
  for (let month = 1; month <= 36; month += 1) {
    const cumulativeCostBps = Math.round(interpolateCumulative(month, config.costAnchors));
    const costBps = cumulativeCostBps - previousCost;
    previousCost = cumulativeCostBps;
    const occupancyBps = Math.round(interpolateCumulative(month, config.occupancyAnchors));
    if (occupancyBps < previousOccupancy) throw new Error(`${project.name} occupancy curve declined.`);
    previousOccupancy = occupancyBps;
    const phase = month <= config.predevelopmentEnd ? "predevelopment" : month <= config.constructionEnd ? "construction" : month <= config.leaseUpEnd ? "lease_up_stabilization" : "stabilized_operations";
    const potentialMonthlyRevenue = config.annualPotentialRevenue / 12;
    const operatingRevenue = Math.round(potentialMonthlyRevenue * occupancyBps / 10_000);
    const operatingExpense = Math.round(operatingRevenue * config.operatingExpenseBps / 10_000);
    const developmentSpend = Math.round(config.totalCost * costBps / 10_000);
    const debtDraw = Math.min(developmentSpend, Math.round(config.debtCommitment * costBps / 10_000));
    const debtInterest = Math.round((config.debtCommitment * cumulativeCostBps / 10_000) * config.interestRateBps / 10_000 / 12);
    const cashFlow = operatingRevenue - operatingExpense - developmentSpend - debtInterest;
    const rowNote = `${config.note} | Calculated monthly planning series from scenario drivers; not actual project performance.`;
    [
      ["SCH-COST", "capital_deployment", "monthly_development_spend", developmentSpend, "usd"],
      ["SCH-CUM", "schedule", "cumulative_deployment_bps", cumulativeCostBps, "percentage_bps"],
      ["SCH-OCC", "schedule", "occupancy_bps", occupancyBps, "percentage_bps"],
      ["SCH-REV", "revenue", "monthly_effective_revenue", operatingRevenue, "usd"],
      ["SCH-OPEX", "operations", "monthly_operating_expense", operatingExpense, "usd"],
      ["SCH-DRAW", "financing", "monthly_debt_draw", debtDraw, "usd"],
      ["SCH-INT", "financing", "monthly_interest", debtInterest, "usd"],
      ["SCH-CF", "cash_flow", "monthly_levered_cash_flow", cashFlow, "usd"],
    ].forEach(([prefix, group, metric, value, unit]) => addRow(rows, project, scenario, {
      record_group: group,
      sku_id: `${prefix}-${String(month).padStart(2, "0")}`,
      metric,
      description: `${metric.replaceAll("_", " ")} — month ${month}`,
      value,
      unit,
      month_start: month,
      month_end: month,
      phase,
      notes: rowNote,
    }));
  }
}

function addProjectIdentity(rows, project, scenario, source, note) {
  [
    ["IDENT-001", "project_stage", project.stage, "other"],
    ["IDENT-002", "program_units", project.units ?? "", "units"],
    ["IDENT-003", "program_buildings", project.buildings ?? "", "units"],
    ["IDENT-004", "program_residential_sf", project.residentialSf ?? "", "sf"],
    ["IDENT-005", "program_gross_sf", project.grossSf ?? "", "sf"],
  ].forEach(([sku_id, metric, value, unit]) => addRow(rows, project, scenario, {
    record_group: "project_identity",
    sku_id,
    metric,
    description: metric.replaceAll("_", " "),
    value,
    unit,
    source_reference: source,
    notes: note,
  }));
}

function addCoreDrivers(rows, project, scenario, config) {
  const source = config.source;
  const note = config.note;
  [
    ["DRV-001", "development_cost", config.totalCost, "usd"],
    ["DRV-002", "development_cost_per_unit", project.units ? Math.round(config.totalCost / project.units) : "", "usd_per_unit"],
    ["DRV-003", "development_cost_per_gross_sf", project.grossSf ? Math.round(config.totalCost / project.grossSf) : "", "usd_per_sf"],
    ["DRV-004", "stabilized_occupancy_bps", config.stabilizedOccupancyBps, "percentage_bps"],
    ["DRV-005", "operating_expense_ratio_bps", config.operatingExpenseBps, "percentage_bps"],
    ["DRV-006", "construction_debt_commitment", config.debtCommitment, "usd"],
    ["DRV-007", "construction_interest_rate_bps", config.interestRateBps, "percentage_bps"],
    ["DRV-008", "construction_interest_only_months", config.interestOnlyMonths, "months"],
    ["DRV-009", "amortization_months", config.amortizationMonths, "months"],
    ["DRV-010", "financing_fee_bps", config.financingFeeBps, "percentage_bps"],
    ["DRV-011", "exit_cap_rate_bps", config.exitCapRateBps, "percentage_bps"],
    ["DRV-012", "sale_cost_bps", config.saleCostBps, "percentage_bps"],
  ].forEach(([sku_id, metric, value, unit]) => addRow(rows, project, scenario, {
    record_group: "scenario_driver",
    sku_id,
    metric,
    description: metric.replaceAll("_", " "),
    value,
    unit,
    source_reference: source,
    notes: note,
  }));
}

function addUnitMix(rows, project, scenario, units, source, note) {
  units.forEach((unit, index) => {
    const annualRent = unit.count * unit.rent * 12;
    [
      ["unit_count", unit.count, "units"],
      ["average_unit_sf", unit.sf, "sf"],
      ["monthly_rent", unit.rent, "usd_per_month"],
      ["annual_scheduled_rent", annualRent, "usd"],
    ].forEach(([metric, value, unitName], offset) => addRow(rows, project, scenario, {
      record_group: "unit_mix",
      sku_id: `UNIT-${String(index + 1).padStart(2, "0")}-${String(offset + 1).padStart(2, "0")}`,
      metric,
      description: `${unit.type} — ${metric.replaceAll("_", " ")}`,
      value,
      unit: unitName,
      source_reference: source,
      notes: note,
    }));
  });
}

function addRevenueAndOperations(rows, project, scenario, config) {
  const annualResidential = config.units.reduce((sum, unit) => sum + unit.count * unit.rent * 12, 0);
  const annualOtherIncome = config.annualOtherIncome ?? 0;
  const potential = annualResidential + annualOtherIncome;
  const egi = Math.round(potential * config.stabilizedOccupancyBps / 10_000);
  const annualOpex = config.expenses?.reduce((sum, item) => sum + item.amount, 0) ?? Math.round(egi * config.operatingExpenseBps / 10_000);
  const noi = egi - annualOpex;
  [
    ["REV-001", "annual_residential_revenue", annualResidential, "usd"],
    ["REV-002", "annual_other_income", annualOtherIncome, "usd"],
    ["REV-003", "annual_potential_gross_revenue", potential, "usd"],
    ["REV-004", "annual_effective_gross_income", egi, "usd"],
    ["REV-005", "annual_operating_expenses", annualOpex, "usd"],
    ["REV-006", "annual_net_operating_income", noi, "usd"],
    ["REV-007", "yield_on_cost_bps", Math.round(noi / config.totalCost * 10_000), "percentage_bps"],
  ].forEach(([sku_id, metric, value, unit]) => addRow(rows, project, scenario, {
    record_group: "calculated_output",
    sku_id,
    metric,
    description: metric.replaceAll("_", " "),
    value,
    unit,
    source_reference: config.source,
    notes: `${config.note} | Calculated from the scenario unit mix, occupancy, other-income, and expense drivers.`,
  }));
  (config.expenses ?? []).forEach((expense, index) => addRow(rows, project, scenario, {
    record_group: "operations",
    sku_id: `OPEX-${String(index + 1).padStart(2, "0")}`,
    metric: "annual_operating_expense",
    description: expense.name,
    value: expense.amount,
    unit: "usd",
    source_reference: config.source,
    notes: config.note,
  }));
  return { annualResidential, annualOtherIncome, potential, egi, annualOpex, noi };
}

function makeResidentialRows(project, scenario, config) {
  const rows = [];
  addProjectIdentity(rows, project, scenario, config.source, config.note);
  addCoreDrivers(rows, project, scenario, config);
  addUnitMix(rows, project, scenario, config.units, config.source, config.note);
  addRevenueAndOperations(rows, project, scenario, config);
  addWbs(rows, project, scenario, config.totalCost, config.source, config.note);
  addMonthlySchedule(rows, project, scenario, {
    ...config,
    annualPotentialRevenue: config.units.reduce((sum, unit) => sum + unit.count * unit.rent * 12, 0) + (config.annualOtherIncome ?? 0),
  });
  return rows;
}

const cedarwood = { id: 1, name: "Cedarwood Flats", type: "Multifamily Residential Development", stage: "development", units: 280, buildings: 5, residentialSf: 258300, grossSf: 258300 };
const gardenLofts = { id: 2, name: "Garden Lofts", type: "Multifamily / Mid-Rise Residential Development", stage: "development", units: 250, buildings: 3, residentialSf: 125000, grossSf: 156250 };
const stonepine = { id: 3, name: "Stonepine Residences", type: "Single-Family Residential Development / Subdivision", stage: "development", units: 300, buildings: 300, residentialSf: 570000, grossSf: 630000 };
const skyline = { id: 4, name: "Skyline Towers", type: "High-Rise Mixed-Use Development", stage: "concept", units: 450, buildings: 1, residentialSf: 405000, grossSf: 600000 };
const chappell = { id: 5, name: "Chappell International Manufacturing Facility", type: "Manufacturing / Industrial Facility", stage: "development", units: 4, buildings: 1, residentialSf: 100000, grossSf: 100000 };
const gardenHaven = { id: 6, name: "Garden Haven", type: "Single-Family Residential Development", stage: "development", units: 100, buildings: 100, residentialSf: 190000, grossSf: 210000 };

const standardExpenses = (egi) => [
  { name: "Property taxes", amount: Math.round(egi * 0.10) }, { name: "Insurance", amount: Math.round(egi * 0.03) },
  { name: "Property management", amount: Math.round(egi * 0.03) }, { name: "Utilities", amount: Math.round(egi * 0.036) },
  { name: "Repairs and maintenance", amount: Math.round(egi * 0.043) }, { name: "Payroll / onsite operations", amount: Math.round(egi * 0.034) },
  { name: "Landscaping / grounds", amount: Math.round(egi * 0.014) }, { name: "Marketing / leasing", amount: Math.round(egi * 0.01) },
  { name: "Administrative", amount: Math.round(egi * 0.009) }, { name: "Replacement / operating reserves", amount: Math.round(egi * 0.014) },
];

const cedarwoodScenario = {
  name: "Historical Planning — Cedarwood Baseline", type: "custom", source: cedarwoodSource,
  notes: "Estimated/user-supplied historical planning scenario. No figure is an actual result, commitment, or funded-capital record.",
};
const cedarwoodUnits = [
  { type: "Studio", count: 28, sf: 600, rent: 1450 }, { type: "1 Bedroom", count: 112, sf: 775, rent: 1850 },
  { type: "2 Bedroom", count: 112, sf: 1050, rent: 2350 }, { type: "3 Bedroom", count: 28, sf: 1325, rent: 2900 },
];
const cedarwoodRows = makeResidentialRows(cedarwood, cedarwoodScenario, {
  source: cedarwoodSource, note: cedarwoodScenario.notes, totalCost: 40000000, units: cedarwoodUnits, annualOtherIncome: 252000,
  stabilizedOccupancyBps: 9500, operatingExpenseBps: 3203, debtCommitment: 55000000, interestRateBps: 750,
  interestOnlyMonths: 24, amortizationMonths: 360, financingFeeBps: 100, exitCapRateBps: 550, saleCostBps: 300,
  expenses: [
    { name: "Property taxes", amount: 700000 }, { name: "Insurance", amount: 210000 }, { name: "Property management", amount: 210000 },
    { name: "Utilities", amount: 250000 }, { name: "Repairs and maintenance", amount: 300000 }, { name: "Payroll / onsite operations", amount: 240000 },
    { name: "Landscaping / grounds", amount: 100000 }, { name: "Marketing / leasing", amount: 70000 }, { name: "Administrative", amount: 60000 }, { name: "Replacement / operating reserves", amount: 100000 },
  ],
  predevelopmentEnd: 3, constructionEnd: 24, leaseUpEnd: 36,
  costAnchors: [{ month: 0, value: 0 }, { month: 3, value: 500 }, { month: 6, value: 1500 }, { month: 9, value: 3000 }, { month: 12, value: 4800 }, { month: 15, value: 6700 }, { month: 18, value: 8200 }, { month: 21, value: 9400 }, { month: 24, value: 10000 }, { month: 36, value: 10000 }],
  occupancyAnchors: [{ month: 1, value: 0 }, { month: 24, value: 0 }, { month: 25, value: 2000 }, { month: 26, value: 3500 }, { month: 27, value: 5000 }, { month: 28, value: 6200 }, { month: 29, value: 7200 }, { month: 30, value: 8000 }, { month: 31, value: 8600 }, { month: 32, value: 9000 }, { month: 33, value: 9200 }, { month: 34, value: 9400 }, { month: 35, value: 9500 }, { month: 36, value: 9500 }],
});

const gardenLoftsScenario = { name: "Historical Planning — Garden Lofts Base", type: "custom", source: baseSource, notes: "Estimated/user-supplied historical planning cost basis, supplemented with standardized multifamily planning inputs for model ingestion." };
const gardenLoftsUnits = [{ type: "Studio", count: 25, sf: 450, rent: 1450 }, { type: "1 Bedroom", count: 125, sf: 500, rent: 1750 }, { type: "2 Bedroom", count: 85, sf: 650, rent: 2250 }, { type: "3 Bedroom", count: 15, sf: 850, rent: 2750 }];
const gardenLoftsPotential = gardenLoftsUnits.reduce((sum, item) => sum + item.count * item.rent * 12, 0) + 180000;
const gardenLoftsRows = makeResidentialRows(gardenLofts, gardenLoftsScenario, {
  source: baseSource, note: gardenLoftsScenario.notes, totalCost: 90000000, units: gardenLoftsUnits, annualOtherIncome: 180000,
  stabilizedOccupancyBps: 9400, operatingExpenseBps: 3400, debtCommitment: 58500000, interestRateBps: 775, interestOnlyMonths: 30, amortizationMonths: 360, financingFeeBps: 125, exitCapRateBps: 575, saleCostBps: 300, expenses: standardExpenses(gardenLoftsPotential * .94),
  predevelopmentEnd: 5, constructionEnd: 28, leaseUpEnd: 36,
  costAnchors: [{ month: 0, value: 0 }, { month: 4, value: 500 }, { month: 8, value: 1500 }, { month: 12, value: 3500 }, { month: 16, value: 5600 }, { month: 20, value: 7400 }, { month: 24, value: 8800 }, { month: 28, value: 10000 }, { month: 36, value: 10000 }],
  occupancyAnchors: [{ month: 1, value: 0 }, { month: 27, value: 0 }, { month: 28, value: 1800 }, { month: 29, value: 3500 }, { month: 30, value: 5200 }, { month: 31, value: 6800 }, { month: 32, value: 8000 }, { month: 33, value: 8700 }, { month: 34, value: 9100 }, { month: 35, value: 9400 }, { month: 36, value: 9400 }],
});

function makeForSaleRows(project, scenarios) {
  const rows = [];
  scenarios.forEach((scenarioConfig) => {
    const scenario = scenarioConfig.scenario;
    addProjectIdentity(rows, project, scenario, scenarioConfig.source, scenarioConfig.note);
    addCoreDrivers(rows, project, scenario, scenarioConfig);
    [
      ["SALE-001", "home_count", project.units, "units"], ["SALE-002", "average_selling_price", scenarioConfig.averageSellingPrice, "usd_per_unit"],
      ["SALE-003", "gross_sales_revenue", project.units * scenarioConfig.averageSellingPrice, "usd"], ["SALE-004", "project_result", scenarioConfig.projectResult, "usd"],
    ].forEach(([sku_id, metric, value, unit]) => addRow(rows, project, scenario, { record_group: "sales_program", sku_id, metric, description: metric.replaceAll("_", " "), value, unit, source_reference: scenarioConfig.source, notes: scenarioConfig.note }));
    const knownBudget = scenarioConfig.knownBudget ?? [];
    knownBudget.forEach((item, index) => addRow(rows, project, scenario, { record_group: "budget_summary", sku_id: `BUD-${String(index + 1).padStart(3, "0")}`, metric: "extended_cost", description: item.name, value: item.amount, unit: "usd", source_reference: scenarioConfig.source, notes: scenarioConfig.note }));
    addWbs(rows, project, scenario, scenarioConfig.totalCost, scenarioConfig.source, scenarioConfig.note);
    addMonthlySchedule(rows, project, scenario, { ...scenarioConfig, annualPotentialRevenue: project.units * scenarioConfig.averageSellingPrice / 3, operatingExpenseBps: 0, occupancyAnchors: scenarioConfig.occupancyAnchors ?? [{ month: 1, value: 0 }, { month: 36, value: 10000 }] });
  });
  return rows;
}

const stonepineRows = makeForSaleRows(stonepine, [
  { scenario: { name: "Historical Planning — Base Case (Superseded)", type: "custom", source: baseSource, notes: "Estimated/user-supplied historical planning base case. The negative result is preserved as a scenario outcome, not hidden." }, source: baseSource, note: "Estimated/user-supplied historical planning base case.", totalCost: 174600000, averageSellingPrice: 495000, projectResult: -26100000, stabilizedOccupancyBps: 10000, operatingExpenseBps: 0, debtCommitment: 113490000, interestRateBps: 800, interestOnlyMonths: 30, amortizationMonths: 360, financingFeeBps: 125, exitCapRateBps: 0, saleCostBps: 0, predevelopmentEnd: 6, constructionEnd: 30, leaseUpEnd: 36, costAnchors: [{ month: 0, value: 0 }, { month: 6, value: 800 }, { month: 12, value: 2800 }, { month: 18, value: 5200 }, { month: 24, value: 7600 }, { month: 30, value: 10000 }, { month: 36, value: 10000 }], knownBudget: [{ name: "Land", amount: 15000000 }, { name: "Infrastructure", amount: 43500000 }, { name: "Vertical construction", amount: 88500000 }, { name: "Soft costs", amount: 19300000 }, { name: "Contingency", amount: 8300000 }] },
  { scenario: { name: "Historical Planning — Optimized Case", type: "custom", source: baseSource, notes: "Estimated/user-supplied historical optimized planning case, preserved separately from the superseded base case." }, source: baseSource, note: "Estimated/user-supplied historical optimized planning case.", totalCost: 156000000, averageSellingPrice: 545000, projectResult: 7500000, stabilizedOccupancyBps: 10000, operatingExpenseBps: 0, debtCommitment: 101400000, interestRateBps: 750, interestOnlyMonths: 30, amortizationMonths: 360, financingFeeBps: 100, exitCapRateBps: 0, saleCostBps: 0, predevelopmentEnd: 6, constructionEnd: 30, leaseUpEnd: 36, costAnchors: [{ month: 0, value: 0 }, { month: 6, value: 800 }, { month: 12, value: 2800 }, { month: 18, value: 5200 }, { month: 24, value: 7600 }, { month: 30, value: 10000 }, { month: 36, value: 10000 }], knownBudget: [{ name: "Infrastructure per home", amount: 115000 * 300 }, { name: "Total optimized cost", amount: 156000000 }] },
]);

const skylineRows = [];
const skylineCase = (name, type, totalCost, rents, occupancy, opexBps, debt, rate, exitCap) => makeResidentialRows(skyline, { name, type, source: skylineSource, notes: "Inferred preliminary planning scenario from the user-supplied Skyline package. Not recovered historical data, actual cost, market-verified rent, committed financing, or funded capital." }, {
  source: skylineSource, note: "Inferred preliminary planning scenario. Replace line-by-line with source-backed evidence when available.", totalCost, units: [{ type: "Studio", count: 45, sf: 600, rent: rents[0] }, { type: "1 Bedroom", count: 180, sf: 775, rent: rents[1] }, { type: "2 Bedroom", count: 165, sf: 1050, rent: rents[2] }, { type: "3 Bedroom", count: 60, sf: 1300, rent: rents[3] }], annualOtherIncome: 2100000, stabilizedOccupancyBps: occupancy, operatingExpenseBps: opexBps, debtCommitment: debt, interestRateBps: rate, interestOnlyMonths: 30, amortizationMonths: 360, financingFeeBps: 100, exitCapRateBps: exitCap, saleCostBps: 300, expenses: standardExpenses(17200000 * occupancy / 10000), predevelopmentEnd: 4, constructionEnd: 30, leaseUpEnd: 36,
  costAnchors: [{ month: 0, value: 0 }, { month: 4, value: 500 }, { month: 8, value: 1500 }, { month: 12, value: 3200 }, { month: 16, value: 5000 }, { month: 20, value: 6800 }, { month: 24, value: 8300 }, { month: 28, value: 9600 }, { month: 30, value: 10000 }, { month: 36, value: 10000 }],
  occupancyAnchors: [{ month: 1, value: 0 }, { month: 26, value: 0 }, { month: 27, value: 2000 }, { month: 28, value: 3500 }, { month: 29, value: 5000 }, { month: 30, value: 6500 }, { month: 31, value: 7700 }, { month: 32, value: 8500 }, { month: 33, value: 9000 }, { month: 34, value: Math.min(9300, occupancy) }, { month: 35, value: occupancy }, { month: 36, value: occupancy }],
});
skylineRows.push(...skylineCase("Preliminary Planning — Low", "downside", 200000000, [1600, 2050, 2750, 3700], 9000, 3500, 130000000, 825, 600));
skylineRows.push(...skylineCase("Preliminary Planning — Base", "base", 185000000, [1750, 2300, 3100, 4200], 9500, 3200, 120250000, 750, 550));
skylineRows.push(...skylineCase("Preliminary Planning — High", "upside", 175000000, [1900, 2550, 3450, 4700], 9700, 3000, 110000000, 700, 500));

function makeIndustrialRows() {
  const scenario = { name: "Historical Planning — Facility CapEx", type: "custom", source: baseSource, notes: "Estimated/user-supplied facility CapEx scenario. The $300M broader CE scaling reference is retained separately and is not facility CapEx or funded capital." };
  const rows = [];
  addProjectIdentity(rows, chappell, scenario, baseSource, scenario.notes);
  addCoreDrivers(rows, chappell, scenario, { source: baseSource, note: scenario.notes, totalCost: 41000000, stabilizedOccupancyBps: 8500, operatingExpenseBps: 4500, debtCommitment: 26650000, interestRateBps: 775, interestOnlyMonths: 24, amortizationMonths: 360, financingFeeBps: 125, exitCapRateBps: 700, saleCostBps: 300 });
  [
    ["IND-001", "facility_capex", 41000000, "usd"], ["IND-002", "detailed_capex_component", 5840000, "usd"], ["IND-003", "broader_ce_financing_reference", 300000000, "usd"],
    ["IND-004", "annual_production_capacity_units", 2400, "units"], ["IND-005", "average_revenue_per_unit", 42000, "usd_per_unit"], ["IND-006", "annual_potential_revenue", 100800000, "usd"],
  ].forEach(([sku_id, metric, value, unit]) => addRow(rows, chappell, scenario, { record_group: "industrial_driver", sku_id, metric, description: metric.replaceAll("_", " "), value, unit, source_reference: baseSource, notes: metric === "broader_ce_financing_reference" ? "Historical broader CE scaling reference; exclude from facility capital stack and funding totals." : scenario.notes }));
  addWbs(rows, chappell, scenario, 41000000, baseSource, scenario.notes);
  addMonthlySchedule(rows, chappell, scenario, { totalCost: 41000000, annualPotentialRevenue: 100800000, operatingExpenseBps: 4500, debtCommitment: 26650000, interestRateBps: 775, predevelopmentEnd: 4, constructionEnd: 24, leaseUpEnd: 36, note: scenario.notes, costAnchors: [{ month: 0, value: 0 }, { month: 4, value: 700 }, { month: 8, value: 2500 }, { month: 12, value: 5000 }, { month: 16, value: 7300 }, { month: 20, value: 9000 }, { month: 24, value: 10000 }, { month: 36, value: 10000 }], occupancyAnchors: [{ month: 1, value: 0 }, { month: 24, value: 0 }, { month: 25, value: 2500 }, { month: 26, value: 4500 }, { month: 27, value: 6000 }, { month: 28, value: 7000 }, { month: 29, value: 7800 }, { month: 30, value: 8200 }, { month: 31, value: 8500 }, { month: 36, value: 8500 }] });
  return rows;
}
const chappellRows = makeIndustrialRows();

const gardenHavenRows = makeForSaleRows(gardenHaven, [
  { scenario: { name: "Preliminary Planning — Low", type: "downside", source: baseSource, notes: "Inferred preliminary planning scenario anchored to the user-supplied $11.5M Garden Haven historical figure; the original figure’s component scope is unknown." }, source: baseSource, note: "Inferred preliminary planning assumption anchored to the $11.5M historical planning figure.", totalCost: 13200000, averageSellingPrice: 210000, projectResult: 7800000, stabilizedOccupancyBps: 10000, operatingExpenseBps: 0, debtCommitment: 8580000, interestRateBps: 825, interestOnlyMonths: 24, amortizationMonths: 360, financingFeeBps: 125, exitCapRateBps: 0, saleCostBps: 0, predevelopmentEnd: 4, constructionEnd: 24, leaseUpEnd: 36, costAnchors: [{ month: 0, value: 0 }, { month: 4, value: 1000 }, { month: 8, value: 3000 }, { month: 12, value: 5500 }, { month: 16, value: 7600 }, { month: 20, value: 9000 }, { month: 24, value: 10000 }, { month: 36, value: 10000 }], knownBudget: [{ name: "Historical planning reference", amount: 11500000 }] },
  { scenario: { name: "Historical Planning — Garden Haven Base", type: "base", source: baseSource, notes: "Estimated/user-supplied historical planning figure with inferred component mapping solely for Financial OS model scaffolding." }, source: baseSource, note: "Estimated/user-supplied historical planning figure; component scope is not recovered.", totalCost: 11500000, averageSellingPrice: 225000, projectResult: 11000000, stabilizedOccupancyBps: 10000, operatingExpenseBps: 0, debtCommitment: 7475000, interestRateBps: 750, interestOnlyMonths: 24, amortizationMonths: 360, financingFeeBps: 100, exitCapRateBps: 0, saleCostBps: 0, predevelopmentEnd: 4, constructionEnd: 24, leaseUpEnd: 36, costAnchors: [{ month: 0, value: 0 }, { month: 4, value: 1000 }, { month: 8, value: 3000 }, { month: 12, value: 5500 }, { month: 16, value: 7600 }, { month: 20, value: 9000 }, { month: 24, value: 10000 }, { month: 36, value: 10000 }], knownBudget: [{ name: "Historical planning reference", amount: 11500000 }] },
  { scenario: { name: "Preliminary Planning — High", type: "upside", source: baseSource, notes: "Inferred preliminary planning scenario anchored to the user-supplied Garden Haven historical planning figure." }, source: baseSource, note: "Inferred preliminary planning assumption anchored to the $11.5M historical planning figure.", totalCost: 10400000, averageSellingPrice: 240000, projectResult: 13600000, stabilizedOccupancyBps: 10000, operatingExpenseBps: 0, debtCommitment: 6760000, interestRateBps: 700, interestOnlyMonths: 24, amortizationMonths: 360, financingFeeBps: 100, exitCapRateBps: 0, saleCostBps: 0, predevelopmentEnd: 4, constructionEnd: 24, leaseUpEnd: 36, costAnchors: [{ month: 0, value: 0 }, { month: 4, value: 1000 }, { month: 8, value: 3000 }, { month: 12, value: 5500 }, { month: 16, value: 7600 }, { month: 20, value: 9000 }, { month: 24, value: 10000 }, { month: 36, value: 10000 }], knownBudget: [{ name: "Historical planning reference", amount: 11500000 }] },
]);

fs.rmSync(outputDir, { recursive: true, force: true });
fs.mkdirSync(outputDir, { recursive: true });

writeCsv("01_cedarwood_flats_financial_model_inputs.csv", cedarwoodRows);
writeCsv("02_garden_lofts_financial_model_inputs.csv", gardenLoftsRows);
writeCsv("03_stonepine_residences_financial_model_inputs.csv", stonepineRows);
writeCsv("04_skyline_towers_financial_model_inputs.csv", skylineRows);
writeCsv("05_chappell_international_financial_model_inputs.csv", chappellRows);
writeCsv("06_garden_haven_financial_model_inputs.csv", gardenHavenRows);

const manifest = [
  ["file_name", "project_name", "records", "scenario_count", "known_primary_control", "source_boundary"],
  ["01_cedarwood_flats_financial_model_inputs.csv", cedarwood.name, cedarwoodRows.length, 1, "$40.0M development-cost control", "User-supplied Cedarwood Base Planning Case"],
  ["02_garden_lofts_financial_model_inputs.csv", gardenLofts.name, gardenLoftsRows.length, 1, "$90.0M historical planning cost basis", "Historical planning basis plus estimated model scaffolding"],
  ["03_stonepine_residences_financial_model_inputs.csv", stonepine.name, stonepineRows.length, 2, "$174.6M base / $156.0M optimized", "User-supplied historical planning cases preserved separately"],
  ["04_skyline_towers_financial_model_inputs.csv", skyline.name, skylineRows.length, 3, "$185.0M base development case", "User-supplied preliminary planning case; not recovered historical data"],
  ["05_chappell_international_financial_model_inputs.csv", chappell.name, chappellRows.length, 1, "$41.0M facility CapEx", "Historical facility CapEx plus inferred operating scaffolding; $300M is excluded from facility stack"],
  ["06_garden_haven_financial_model_inputs.csv", gardenHaven.name, gardenHavenRows.length, 3, "$11.5M historical planning figure", "Historical figure plus inferred scenario scaffolding; original component scope unknown"],
];
fs.writeFileSync(path.join(outputDir, "00_ceff_internal_projects_csv_manifest.csv"), manifest.map((line) => line.map(escapeCsv).join(",")).join("\n") + "\n", "utf8");

const gapSummary = [
  ["project_name", "status", "items_to_replace_with_source_backed_evidence"],
  [cedarwood.name, "Base planning data entered", "Market rent comps, actual design drawings, bids, executed debt terms, construction milestones"],
  [gardenLofts.name, "Historical cost basis plus standardized estimates", "Land/site, unit mix, market rents, operating budget, debt proposal, development timeline"],
  [stonepine.name, "Two historical planning cases preserved", "Current lot/home plan, sales absorption, bid-backed cost-to-complete, financing and delivery timing"],
  [skyline.name, "User-supplied preliminary planning case", "Architectural program, market-rent comps, cost plan, commercial lease assumptions, debt proposals"],
  [chappell.name, "Historical facility CapEx plus inferred operations", "Production volume, customer pricing, equipment quotes, operating payroll, executed financing"],
  [gardenHaven.name, "Historical figure plus inferred scenario scaffolding", "Definition of original $11.5M figure, land and infrastructure budget, home program, sales comps, financing"],
];
fs.writeFileSync(path.join(outputDir, "07_ceff_internal_projects_input_gap_summary.csv"), gapSummary.map((line) => line.map(escapeCsv).join(",")).join("\n") + "\n", "utf8");

console.log(JSON.stringify({ outputDir, files: fs.readdirSync(outputDir).sort(), cedarwoodRows: cedarwoodRows.length, gardenLoftsRows: gardenLoftsRows.length, stonepineRows: stonepineRows.length, skylineRows: skylineRows.length, chappellRows: chappellRows.length, gardenHavenRows: gardenHavenRows.length }, null, 2));

import "dotenv/config";
import mysql from "mysql2/promise";

const ownerId = 1;
const projectName = "Stonepine Residences";
const residentialSquareFeet = 350000;
const homeCount = 200;
const averageHomeSquareFeet = 1750;
const sourceReference = "User-provided Stonepine all-in cost scenarios, 2026-10-04";
const ownerName = "User-provided";
const marketSource = "DFW regional planning benchmark; Realtor.com September 2026 median asking price $422,495: https://www.realtor.com/news/local/dallas-tx/real-estate-market-dallas-tx-september-2026/ ; Doorstead July 2026 single-family median rent $2,599: https://www.doorstead.com/blog/dallas-tx-rental-market-report";
const salePrice = 400000;
const monthlyRent = 2500;
const notes = "Estimated current underwriting cost case. Cost per square foot is an all-in development-cost allowance across 200 single-family homes and 350,000 residential square feet. The cost allocation and 36-month timing are user-approved preliminary planning assumptions, not actual spend, a bid-backed budget, committed capital, funded capital, a financing plan, sales forecast, or return calculation.";

const costAllocation = [
  { code: "LAND", description: "Land / acquisition", category: "land_site", bps: 1000, phase: "predevelopment" },
  { code: "SITE", description: "Site, civil, utilities, infrastructure", category: "land_site", bps: 1800, phase: "construction" },
  { code: "VERT", description: "Vertical home construction", category: "building", bps: 5200, phase: "construction" },
  { code: "SOFT", description: "Soft costs, permits, design, insurance", category: "soft_costs", bps: 1000, phase: "predevelopment" },
  { code: "CONT", description: "Contingency", category: "contingency", bps: 500, phase: "construction" },
  { code: "CARRY", description: "Financing, carry, sales / closing allowance", category: "other", bps: 500, phase: "building_completion" },
];

// Monthly projection lines are unique by deployment category. Land and site
// remain separate WBS rows for auditability, while their monthly deployment is
// intentionally combined into the single supported land_site category.
const monthlyDeploymentAllocation = Object.values(
  costAllocation.reduce((groups, allocation) => {
    const existing = groups[allocation.category];
    groups[allocation.category] = existing
      ? { ...existing, bps: existing.bps + allocation.bps, description: `${existing.description} + ${allocation.description}` }
      : { category: allocation.category, bps: allocation.bps, description: allocation.description };
    return groups;
  }, {}),
);

const scheduleBuckets = [
  { start: 1, end: 3, bps: 300, phase: "predevelopment" },
  { start: 4, end: 6, bps: 700, phase: "design_entitlement" },
  { start: 7, end: 12, bps: 1500, phase: "construction" },
  { start: 13, end: 18, bps: 2200, phase: "construction" },
  { start: 19, end: 24, bps: 2500, phase: "construction" },
  { start: 25, end: 30, bps: 1800, phase: "building_completion" },
  { start: 31, end: 36, bps: 1000, phase: "lease_up_stabilization" },
];

function splitEvenly(total, count) {
  const base = Math.floor(total / count);
  return Array.from({ length: count }, (_, index) => base + (index < total - base * count ? 1 : 0));
}

const schedule = scheduleBuckets.flatMap((bucket) =>
  splitEvenly(bucket.bps, bucket.end - bucket.start + 1).map((bps, index) => ({
    monthIndex: bucket.start + index,
    bps,
    phase: bucket.phase,
  })),
);

const costCases = [
  { name: "Current Underwriting — All-In Cost Upside ($165/sf)", type: "upside", costPerSquareFoot: 165 },
  { name: "Current Underwriting — All-In Cost Base ($185/sf)", type: "base", costPerSquareFoot: 185 },
  { name: "Current Underwriting — All-In Cost Downside ($205/sf)", type: "downside", costPerSquareFoot: 205 },
];

const scenarios = [15, 20, 25].flatMap((rentalPercent) => costCases.map((costCase) => ({
  ...costCase,
  name: `${costCase.name} — ${rentalPercent}% Rentals · 1,750 SF`,
  rentalPercent,
  rentalHomes: homeCount * rentalPercent / 100,
  saleHomes: homeCount * (100 - rentalPercent) / 100,
  developmentCost: costCase.costPerSquareFoot * residentialSquareFeet,
})));
if (process.argv.includes("--dry-run")) {
  console.log(JSON.stringify({ homeCount, averageHomeSquareFeet, residentialSquareFeet, scenarios }, null, 2));
  process.exit(0);
}

if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is required to seed Stonepine scenarios.");

const db = await mysql.createConnection(process.env.DATABASE_URL);

try {
  if (process.argv.includes("--verify")) {
    const [rows] = await db.execute(`SELECT s.id, s.scenarioName, s.scenarioStatus,
      MAX(CASE WHEN a.metric = 'development_cost' THEN a.value END) AS cost,
      MAX(CASE WHEN a.metric = 'average_home_sq_ft' THEN a.value END) AS averageSf,
      MAX(CASE WHEN a.metric = 'rental_units' THEN a.value END) AS rentals,
      MAX(CASE WHEN a.metric = 'for_sale_units' THEN a.value END) AS sales,
      MAX(CASE WHEN a.metric = 'sale_price_per_home' THEN a.value END) AS salePrice,
      MAX(CASE WHEN a.metric = 'monthly_rent_per_home' THEN a.value END) AS monthlyRent
      FROM internal_projects p JOIN project_economics_models m ON m.internalProjectId=p.id AND m.ownerId=p.ownerId
      JOIN project_projection_scenarios s ON s.modelId=m.id AND s.ownerId=p.ownerId
      LEFT JOIN project_projection_assumptions a ON a.scenarioId=s.id AND a.ownerId=p.ownerId
      WHERE p.ownerId=? AND p.projectName=? GROUP BY s.id, s.scenarioName, s.scenarioStatus`, [ownerId, projectName]);
    const [needs] = await db.execute("SELECT n.id,n.requirementName,n.amount,n.amountDataState,n.notes FROM internal_project_capital_needs n JOIN internal_projects p ON p.id=n.internalProjectId WHERE p.ownerId=? AND p.projectName=?", [ownerId,projectName]);
    console.log(JSON.stringify({ scenarios: rows, capitalNeeds: needs }, null, 2));
    await db.end();
    process.exit(0);
  }
  await db.beginTransaction();
  const [projects] = await db.execute(
    "SELECT id FROM internal_projects WHERE ownerId = ? AND projectName = ? LIMIT 1",
    [ownerId, projectName],
  );
  const project = projects[0];
  if (!project) throw new Error(`Missing ${projectName} for workspace owner ${ownerId}.`);

  const [models] = await db.execute(
    "SELECT id FROM project_economics_models WHERE ownerId = ? AND internalProjectId = ? LIMIT 1",
    [ownerId, project.id],
  );
  const model = models[0];
  if (!model) throw new Error(`Missing project-economics model for ${projectName}.`);

  await db.execute(
    `UPDATE internal_projects
       SET programUnitCount = ?, programBuildingCount = ?, programUnitsPerBuilding = ?, programAreaSqFt = ?,
           totalProjectCost = ?, totalProjectCostDataState = 'estimated',
           capitalRequirement = ?, capitalRequirementDataState = 'estimated',
           knownProgramSummary = ?, notes = ?
     WHERE ownerId = ? AND id = ?`,
    [
      homeCount,
      homeCount,
      1,
      residentialSquareFeet,
      scenarios.find((scenario) => scenario.type === "base").developmentCost,
      scenarios.find((scenario) => scenario.type === "base").developmentCost,
      "Current underwriting scope: 200 single-family homes averaging 1,750 square feet (350,000 total residential square feet). Compare 15%, 20%, and 25% rental retention (30, 40, or 50 rentals; 170, 160, or 150 homes sold). Regional benchmark estimates: $400,000 sale price and $2,500 monthly rent per home. Timing, operating expenses, and financing remain unset.",
      `${notes} Historical 300-home cases remain preserved in their own scenarios.`,
      ownerId,
      project.id,
    ],
  );

  // Retain the prior 1,875-SF records for audit; the new scope has separate scenarios.
  for (const oldCase of costCases) {
    await db.execute("UPDATE project_projection_scenarios SET scenarioStatus = 'archived' WHERE ownerId = ? AND modelId = ? AND scenarioName = ?", [ownerId, model.id, oldCase.name]);
  }
  for (const scenario of scenarios) {
    const [existing] = await db.execute("SELECT id FROM project_projection_scenarios WHERE ownerId = ? AND modelId = ? AND scenarioName = ?", [ownerId, model.id, scenario.name]);
    // A rerun must not replace later edits to these models.
    if (existing.length) continue;
    await db.execute(
      `INSERT INTO project_projection_scenarios (ownerId, modelId, scenarioName, scenarioType, scenarioStatus, notes)
       VALUES (?, ?, ?, ?, 'active', ?)
       ON DUPLICATE KEY UPDATE scenarioType = VALUES(scenarioType), scenarioStatus = 'active', notes = VALUES(notes), id = LAST_INSERT_ID(id)`,
      [ownerId, model.id, scenario.name, scenario.type, notes],
    );
    const [scenarioRows] = await db.execute(
      "SELECT id FROM project_projection_scenarios WHERE ownerId = ? AND modelId = ? AND scenarioName = ? LIMIT 1",
      [ownerId, model.id, scenario.name],
    );
    const scenarioId = scenarioRows[0].id;

    const assumptions = [
      ["program_mix", "rental_retention_bps", scenario.rentalPercent * 100, "percentage_bps", "Share of homes retained as rentals"],
      ["program_mix", "rental_units", scenario.rentalHomes, "units", "Homes retained as rentals"],
      ["program_mix", "for_sale_units", scenario.saleHomes, "units", "Homes designated for sale"],
      ["program_mix", "rental_residential_sf", scenario.rentalHomes * averageHomeSquareFeet, "other", "Rental residential area"],
      ["program_mix", "for_sale_residential_sf", scenario.saleHomes * averageHomeSquareFeet, "other", "For-sale residential area"],
      ["program_mix", "rental_allocated_cost", scenario.developmentCost * scenario.rentalPercent / 100, "usd", "Proportional share of all-in cost allocated to rentals"],
      ["program_mix", "for_sale_allocated_cost", scenario.developmentCost * (100 - scenario.rentalPercent) / 100, "usd", "Proportional share of all-in cost allocated to homes for sale"],
      ["project_identity", "program_units", homeCount, "units", "Current program count"],
      ["project_identity", "average_home_sq_ft", averageHomeSquareFeet, "other", "Average home square footage"],
      ["project_identity", "program_residential_sf", residentialSquareFeet, "other", "Total residential square footage"],
      ["scenario_driver", "all_in_development_cost_per_sf", scenario.costPerSquareFoot, "other", "All-in development cost per residential square foot"],
      ["scenario_driver", "development_cost", scenario.developmentCost, "usd", "All-in development cost"],
      ["scenario_driver", "development_cost_per_unit", Math.round(scenario.developmentCost / homeCount), "usd", "All-in development cost per home"],
    ];
    for (const [sortOrder, [category, metric, value, unit, detail]] of assumptions.entries()) {
      await db.execute(
        `INSERT INTO project_projection_assumptions
          (ownerId, scenarioId, assumptionCategory, metric, value, valueUnit, dataState, sourceReference, effectiveAt, ownerName, notes, sortOrder)
         VALUES (?, ?, ?, ?, ?, ?, 'estimated', ?, '2026-10-04', ?, ?, ?)`,
        [ownerId, scenarioId, category, metric, value, unit, sourceReference, ownerName, `${detail}. ${notes}`, sortOrder],
      );
    }

    for (const [metric, value, detail] of [
      ["sale_price_per_home", salePrice, "Estimated sale price rounded down from DFW median asking price; not a closed-sale comparable or site appraisal"],
      ["monthly_rent_per_home", monthlyRent, "Estimated monthly rent rounded down from DFW single-family median; not a signed lease or size-adjusted comparable"],
      ["gross_home_sale_proceeds", scenario.saleHomes * salePrice, "Total gross home sales before selling costs; not annual revenue"],
      ["annual_potential_rental_income", scenario.rentalHomes * monthlyRent * 12, "Annual potential rent at full occupancy before expenses; not NOI"],
    ]) {
      await db.execute(`INSERT INTO project_projection_assumptions
        (ownerId,scenarioId,assumptionCategory,metric,value,valueUnit,dataState,sourceReference,effectiveAt,ownerName,notes,sortOrder)
        VALUES (?,?,'market_benchmark',?,?,'usd','estimated',?,'2026-10-04','North Texas market research',?,?)`,
        [ownerId,scenarioId,metric,value,marketSource,`${detail}. Source periods: September 2026 sales listings and July 2026 rental listings; reviewed October 4, 2026. Hold prices constant across cost/retention alternatives.`, assumptions.length]);
    }

    for (const [sortOrder, allocation] of costAllocation.entries()) {
      const allocatedAmount = Math.round(scenario.developmentCost * allocation.bps / 10000);
      await db.execute(
        `INSERT INTO project_planning_wbs_lines
          (ownerId, internalProjectId, projectionScenarioId, wbsCode, description, costCategory, phase, buildingApplicability, quantity, quantityUnit, unitCost, allocatedAmount, dataState, sourceClassification, sourceReference, effectiveAt, ownerName, notes, sortOrder)
         VALUES (?, ?, ?, ?, ?, ?, ?, 'Project-wide', ?, 'planning_allocation', ?, ?, 'estimated', 'derived_quantity', ?, '2026-10-04', ?, ?, ?)`,
        [ownerId, project.id, scenarioId, allocation.code, allocation.description, allocation.category, allocation.phase, allocation.bps, scenario.developmentCost, allocatedAmount, sourceReference, ownerName, `${notes} ${allocation.bps / 100}% preliminary allocation.`, sortOrder],
      );
    }

    const monthlyAmounts = schedule.map((item) => Math.round(scenario.developmentCost * item.bps / 10000));
    monthlyAmounts[monthlyAmounts.length - 1] += scenario.developmentCost - monthlyAmounts.reduce((sum, amount) => sum + amount, 0);
    for (const [index, item] of schedule.entries()) {
      const monthAmount = monthlyAmounts[index];
      await db.execute(
        `INSERT INTO project_planning_schedule_months
          (ownerId, internalProjectId, projectionScenarioId, monthIndex, phase, constructionSpendBps, occupancyBps, dataState, sourceReference, effectiveAt, ownerName, notes)
         VALUES (?, ?, ?, ?, ?, ?, NULL, 'estimated', ?, '2026-10-04', ?, ?)`,
        [ownerId, project.id, scenarioId, item.monthIndex, item.phase, item.bps, sourceReference, ownerName, `${notes} ${item.bps / 100}% planned deployment for month ${item.monthIndex}.`],
      );

      const categoryAmounts = monthlyDeploymentAllocation.map((allocation) => Math.round(monthAmount * allocation.bps / 10000));
      categoryAmounts[categoryAmounts.length - 1] += monthAmount - categoryAmounts.reduce((sum, amount) => sum + amount, 0);
      for (const [allocationIndex, allocation] of monthlyDeploymentAllocation.entries()) {
        await db.execute(
          `INSERT INTO project_projection_monthly_lines
            (ownerId, scenarioId, monthIndex, phase, metricCategory, deploymentCategory, amount, dataState, sourceReference, effectiveAt, ownerName, notes)
           VALUES (?, ?, ?, ?, 'capital_deployment', ?, ?, 'estimated', ?, '2026-10-04', ?, ?)`,
          [ownerId, scenarioId, item.monthIndex, item.phase, allocation.category, -categoryAmounts[allocationIndex], sourceReference, ownerName, `${notes} Preliminary ${allocation.description.toLowerCase()} deployment.`],
        );
      }
    }
  }
  // Reconcile each alternative independently before committing the revision.
  for (const scenario of scenarios) {
    const [checks] = await db.execute(`SELECT s.id,
      (SELECT SUM(w.allocatedAmount) FROM project_planning_wbs_lines w WHERE w.projectionScenarioId=s.id AND w.ownerId=s.ownerId) AS wbsTotal,
      (SELECT -SUM(l.amount) FROM project_projection_monthly_lines l WHERE l.scenarioId=s.id AND l.ownerId=s.ownerId AND l.metricCategory='capital_deployment') AS deploymentTotal,
      (SELECT COUNT(DISTINCT l.monthIndex) FROM project_projection_monthly_lines l WHERE l.scenarioId=s.id AND l.ownerId=s.ownerId AND l.metricCategory='capital_deployment') AS months
      FROM project_projection_scenarios s WHERE s.ownerId=? AND s.modelId=? AND s.scenarioName=?`, [ownerId,model.id,scenario.name]);
    const check = checks[0];
    if (!check || Number(check.wbsTotal) !== scenario.developmentCost || Number(check.deploymentTotal) !== scenario.developmentCost || Number(check.months) !== 36) throw new Error(`Cost reconciliation failed: ${scenario.name}`);
  }
  await db.commit();
  console.log(JSON.stringify({ project: projectName, homeCount, residentialSquareFeet, scenarios }, null, 2));
} catch (error) {
  await db.rollback();
  throw error;
} finally {
  await db.end();
}

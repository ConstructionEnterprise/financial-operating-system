import mysql from "mysql2/promise";
import {
  assertCedarwoodHistoricalPlanningWbs,
  cedarwoodHistoricalControls,
  cedarwoodHistoricalPlanningOwner,
  cedarwoodHistoricalPlanningSource,
  cedarwoodHistoricalPlanningWbs,
} from "../shared/cedarwoodHistoricalPlanning.ts";
import { historicalPlanningMarker } from "../shared/historicalPlanning.ts";

const ownerId = 1;
const sourceReference = `${cedarwoodHistoricalPlanningSource}; reverse-engineering authority lines 380–521`;
const notes = "Reverse-engineered historical planning control from user-authorized $40M Cedarwood control total; effective date unknown; not an actual, current capital requirement, monthly cash-flow line, or return input.";

const controls = [
  ["program", "unit_count", cedarwoodHistoricalControls.units, "units"],
  ["program", "building_count", cedarwoodHistoricalControls.buildings, "units"],
  ["program", "units_per_building", cedarwoodHistoricalControls.unitsPerBuilding, "units"],
  ["development_control", "total_cost", cedarwoodHistoricalControls.totalDevelopmentCost, "usd"],
  ["development_control", "construction_basis_low", cedarwoodHistoricalControls.constructionBasisLow, "other"],
  ["development_control", "construction_basis_central", cedarwoodHistoricalControls.constructionBasisCentral, "other"],
  ["development_control", "construction_basis_high", cedarwoodHistoricalControls.constructionBasisHigh, "other"],
  ["derived_quantity", "gross_sf_central", cedarwoodHistoricalControls.grossSfCentral, "units"],
  ["derived_quantity", "gross_sf_low", cedarwoodHistoricalControls.grossSfLow, "units"],
  ["derived_quantity", "gross_sf_high", cedarwoodHistoricalControls.grossSfHigh, "units"],
  ["derived_quantity", "average_sf_per_unit", cedarwoodHistoricalControls.averageSfPerUnit, "units"],
  ["derived_quantity", "gross_sf_per_building", cedarwoodHistoricalControls.grossSfPerBuilding, "units"],
  ["derived_quantity", "development_cost_per_unit", cedarwoodHistoricalControls.developmentCostPerUnit, "usd"],
  ["derived_quantity", "development_cost_per_building", cedarwoodHistoricalControls.developmentCostPerBuilding, "usd"],
  ["historical_operations", "net_operating_income", cedarwoodHistoricalControls.historicalNoi, "usd"],
  ["derived_return_context", "yield_on_cost_bps", cedarwoodHistoricalControls.yieldOnCostBps, "percentage_bps"],
  ["derived_operations", "noi_per_unit_annual", cedarwoodHistoricalControls.noiPerUnitAnnual, "usd"],
  ["factory_planning", "module_equivalent_area", cedarwoodHistoricalControls.moduleEquivalentArea, "units"],
  ["factory_planning", "module_equivalents", cedarwoodHistoricalControls.moduleEquivalents, "units"],
];

const connection = await mysql.createConnection(process.env.DATABASE_URL);
try {
  assertCedarwoodHistoricalPlanningWbs();
  await connection.beginTransaction();
  const [scenarioRows] = await connection.execute(
    "SELECT s.id AS scenarioId, m.internalProjectId FROM project_projection_scenarios s INNER JOIN project_economics_models m ON m.id = s.modelId INNER JOIN internal_projects p ON p.id = m.internalProjectId WHERE s.ownerId = ? AND p.projectName = ? AND s.notes LIKE ? LIMIT 1",
    [ownerId, "Cedarwood Flats", `%${historicalPlanningMarker}%`],
  );
  const scenario = scenarioRows[0];
  if (!scenario) throw new Error("Authorized Cedarwood historical planning scenario was not found.");

  await connection.execute(
    "DELETE FROM project_projection_assumptions WHERE ownerId = ? AND scenarioId = ? AND assumptionCategory IN ('program', 'development_control', 'derived_quantity', 'historical_operations', 'derived_return_context', 'derived_operations', 'factory_planning')",
    [ownerId, scenario.scenarioId],
  );
  for (let index = 0; index < controls.length; index += 1) {
    const [assumptionCategory, metric, value, valueUnit] = controls[index];
    await connection.execute(
      "INSERT INTO project_projection_assumptions (ownerId, scenarioId, assumptionCategory, metric, value, valueUnit, dataState, sourceReference, effectiveAt, ownerName, notes, sortOrder) VALUES (?, ?, ?, ?, ?, ?, 'estimated', ?, NULL, ?, ?, ?)",
      [ownerId, scenario.scenarioId, assumptionCategory, metric, value, valueUnit, sourceReference, cedarwoodHistoricalPlanningOwner, notes, index + 1],
    );
  }
  for (let index = 0; index < cedarwoodHistoricalPlanningWbs.length; index += 1) {
    const line = cedarwoodHistoricalPlanningWbs[index];
    await connection.execute(
      "INSERT INTO project_planning_wbs_lines (ownerId, internalProjectId, projectionScenarioId, wbsCode, description, costCategory, phase, buildingApplicability, quantity, quantityUnit, unitCost, allocatedAmount, dataState, sourceClassification, sourceReference, effectiveAt, ownerName, notes, sortOrder) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'estimated', 'reverse_engineered_allocation', ?, NULL, ?, ?, ?) ON DUPLICATE KEY UPDATE description = VALUES(description), costCategory = VALUES(costCategory), phase = VALUES(phase), buildingApplicability = VALUES(buildingApplicability), quantity = VALUES(quantity), quantityUnit = VALUES(quantityUnit), unitCost = VALUES(unitCost), allocatedAmount = VALUES(allocatedAmount), dataState = 'estimated', sourceClassification = 'reverse_engineered_allocation', sourceReference = VALUES(sourceReference), effectiveAt = NULL, ownerName = VALUES(ownerName), notes = VALUES(notes), sortOrder = VALUES(sortOrder)",
      [ownerId, scenario.internalProjectId, scenario.scenarioId, line.wbsCode, line.description, line.costCategory, line.phase, line.buildingApplicability, line.quantity, line.quantityUnit, line.unitCost, line.allocatedAmount, sourceReference, cedarwoodHistoricalPlanningOwner, line.notes, index + 1],
    );
  }
  await connection.commit();
  console.log(JSON.stringify({ scenarioId: scenario.scenarioId, internalProjectId: scenario.internalProjectId, controls: controls.length, wbsLines: cedarwoodHistoricalPlanningWbs.length }, null, 2));
} catch (error) {
  await connection.rollback();
  throw error;
} finally {
  await connection.end();
}

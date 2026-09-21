import fs from "node:fs";
import path from "node:path";

const dir = "/home/ubuntu/ceff-deliverables/internal-project-csvs";
const required = ["project_id", "project_name", "project_type", "scenario_name", "scenario_type", "record_group", "sku_id", "metric", "value", "unit", "data_state", "source_reference", "owner_name", "include_in_model"];
const expectedWbs = {
  "Cedarwood Flats": { "Historical Planning — Cedarwood Baseline": 40000000 },
  "Garden Lofts": { "Historical Planning — Garden Lofts Base": 90000000 },
  "Stonepine Residences": { "Historical Planning — Base Case (Superseded)": 174600000, "Historical Planning — Optimized Case": 156000000 },
  "Skyline Towers": { "Preliminary Planning — Low": 200000000, "Preliminary Planning — Base": 185000000, "Preliminary Planning — High": 175000000 },
  "Chappell International Manufacturing Facility": { "Historical Planning — Facility CapEx": 41000000 },
  "Garden Haven": { "Preliminary Planning — Low": 13200000, "Historical Planning — Garden Haven Base": 11500000, "Preliminary Planning — High": 10400000 },
};

function parseCsv(text) {
  const rows = [];
  let cell = ""; let row = []; let quoted = false;
  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    const next = text[index + 1];
    if (quoted && char === '"' && next === '"') { cell += '"'; index += 1; }
    else if (char === '"') quoted = !quoted;
    else if (char === "," && !quoted) { row.push(cell); cell = ""; }
    else if ((char === "\n" || char === "\r") && !quoted) {
      if (char === "\r" && next === "\n") index += 1;
      row.push(cell); if (row.some((value) => value !== "")) rows.push(row); row = []; cell = "";
    } else cell += char;
  }
  if (cell || row.length) { row.push(cell); rows.push(row); }
  const [headers, ...values] = rows;
  return values.map((valuesRow) => Object.fromEntries(headers.map((header, index) => [header, valuesRow[index] ?? ""])));
}

const files = fs.readdirSync(dir).filter((file) => /_financial_model_inputs\.csv$/.test(file)).sort();
if (files.length !== 6) throw new Error(`Expected 6 project input CSVs; found ${files.length}.`);

const report = [];
for (const file of files) {
  const rows = parseCsv(fs.readFileSync(path.join(dir, file), "utf8"));
  const columns = Object.keys(rows[0] ?? {});
  const missingColumns = required.filter((column) => !columns.includes(column));
  if (missingColumns.length) throw new Error(`${file} missing columns: ${missingColumns.join(", ")}`);
  if (rows.length < 100) throw new Error(`${file} contains fewer than 100 entries.`);
  if (rows.some((row) => !row.sku_id || !row.source_reference || !row.data_state)) throw new Error(`${file} has an incomplete SKU/provenance/data-state row.`);
  const project = rows[0].project_name;
  const expectedByScenario = expectedWbs[project];
  if (!expectedByScenario) throw new Error(`${file} project not in expected controls: ${project}`);
  for (const [scenario, expectedTotal] of Object.entries(expectedByScenario)) {
    const scenarioRows = rows.filter((row) => row.scenario_name === scenario);
    if (!scenarioRows.length) throw new Error(`${project}: missing scenario ${scenario}.`);
    const wbsRows = scenarioRows.filter((row) => row.record_group === "wbs_budget");
    if (wbsRows.length !== 100) throw new Error(`${project} / ${scenario}: expected 100 WBS records; found ${wbsRows.length}.`);
    const total = wbsRows.reduce((sum, row) => sum + Number(row.value), 0);
    if (total !== expectedTotal) throw new Error(`${project} / ${scenario}: WBS ${total} does not reconcile to ${expectedTotal}.`);
    const scheduleMonths = new Set(scenarioRows.filter((row) => row.sku_id.startsWith("SCH-")).map((row) => row.month_start));
    if (scheduleMonths.size !== 36) throw new Error(`${project} / ${scenario}: expected 36 schedule months; found ${scheduleMonths.size}.`);
  }
  report.push({ file, project, rows: rows.length, scenarios: Object.keys(expectedByScenario).length });
}

console.table(report);
console.log("Validation passed: six project CSV packages have import columns, provenance, 100 WBS entries per scenario, reconciled control totals, and 36-month schedules.");

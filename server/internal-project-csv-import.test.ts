import { describe, expect, it } from "vitest";
import { groupFinancialOsCsvRows, scenarioImportSummary, type FinancialOsCsvRecord } from "./internalProjectCsvImport";

const base = (overrides: Partial<FinancialOsCsvRecord>): FinancialOsCsvRecord => ({
  project_id: "2", project_name: "Garden Lofts", project_type: "Multifamily", scenario_name: "Planning Base", scenario_type: "base", record_group: "wbs_budget", sku_id: "WBS-001", metric: "extended_cost", description: "Land", value: "100", unit: "usd", data_state: "estimated", source_reference: "user source", effective_date: "", owner_name: "owner", month_start: "", month_end: "", phase: "construction", include_in_model: "yes", notes: "planning", ...overrides,
});

describe("Internal Project CSV import mapping", () => {
  it("groups scenario-isolated rows and reconciles WBS plus 36-month schedule coverage", () => {
    const rows = [
      ...Array.from({ length: 100 }, (_, index) => base({ sku_id: `WBS-${String(index + 1).padStart(3, "0")}`, value: "100" })),
      ...Array.from({ length: 36 }, (_, index) => base({ record_group: "schedule", sku_id: `SCH-CUM-${String(index + 1).padStart(2, "0")}`, metric: "cumulative_deployment_bps", value: String((index + 1) * 277), unit: "percentage_bps", month_start: String(index + 1), month_end: String(index + 1) })),
    ];
    const group = groupFinancialOsCsvRows(rows);
    expect(group).toHaveLength(1);
    expect(scenarioImportSummary(group[0]!)).toMatchObject({ wbsCount: 100, wbsTotal: 10000, scheduleMonthCount: 36 });
  });
});

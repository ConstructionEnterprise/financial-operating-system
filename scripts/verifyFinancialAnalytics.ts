import assert from "node:assert/strict";
import { buildCapitalPathAnalytics, buildProjectCoverage, buildStageAnalytics, summarizeEnterpriseAnalytics } from "../shared/financialAnalytics.ts";

const buckets = [
  { capitalPath: "equity" as const, targetAmount: 1_000_000 },
  { capitalPath: "facility_jv" as const, targetAmount: "10_000_000" },
];
const opportunities = [
  { id: 1, capitalPath: "equity" as const, organizationName: "Fund A", stage: "diligence", requestedAmount: 500_000, committedAmount: 0, fundedAmount: 0, probability: 40, internalProjectId: null },
  { id: 2, capitalPath: "equity" as const, organizationName: "Fund B", stage: "committed", requestedAmount: 250_000, committedAmount: 250_000, fundedAmount: 100_000, probability: 100, internalProjectId: null },
  { id: 3, capitalPath: "facility_jv" as const, organizationName: "Bank A", stage: "term_sheet", requestedAmount: 7_000_000, committedAmount: 0, fundedAmount: 0, probability: 70, internalProjectId: 7 },
  { id: 4, capitalPath: "facility_jv" as const, organizationName: "Passed Bank", stage: "passed", requestedAmount: 99_000_000, committedAmount: 0, fundedAmount: 0, probability: 100, internalProjectId: 7 },
];
const projects = [{ id: 7, projectName: "Stonepine", capitalRequirement: 9_000_000, capitalRequirementDataState: "estimated" }];
const portfolioProjects = [{ projectId: 7, projectName: "Stonepine", developmentCost: 10_000_000, capitalRequirement: 10_000_000, planningDataState: "estimated", annualRevenue: 1_000_000, annualNoi: 600_000, primaryScenarioName: "Base" }];

const paths = buildCapitalPathAnalytics(buckets, opportunities);
const equity = paths.find((row) => row.capitalPath === "equity")!;
assert.equal(equity.weighted, 200_000, "committed capital is excluded from probability-weighted pipeline");
assert.equal(equity.committed, 250_000);
assert.equal(equity.funded, 100_000);
assert.equal(paths.find((row) => row.capitalPath === "equipment_finance")?.target, 0, "an absent bucket uses the governed path default");
const facility = paths.find((row) => row.capitalPath === "facility_jv")!;
assert.equal(facility.requested, 7_000_000, "passed opportunities are excluded");
assert.equal(facility.weighted, 4_900_000);

const coverage = buildProjectCoverage(projects, portfolioProjects, opportunities);
assert.equal(coverage[0].requirement, 10_000_000, "stored primary planning model is the project requirement basis");
assert.equal(coverage[0].weighted, 4_900_000);
assert.equal(coverage[0].linkedOpportunities, 1);

const stages = buildStageAnalytics(opportunities);
assert.equal(stages.find((row) => row.stage === "passed")?.count, 1, "stage analytics retain passed records for audit visibility");
const facilityStages = buildStageAnalytics(opportunities, "facility_jv");
assert.equal(facilityStages.find((row) => row.stage === "term_sheet")?.amount, 7_000_000, "selected path retains its requested amount");
assert.equal(facilityStages.find((row) => row.stage === "diligence")?.count, 0, "selected path excludes other capital paths");
const enterprise = summarizeEnterpriseAnalytics({ buckets, opportunities, projects, portfolioProjects });
assert.equal(enterprise.totals.requirement, 10_000_000);
assert.equal(enterprise.totals.committed, 250_000);
assert.equal(enterprise.totals.funded, 100_000);
assert.equal(enterprise.totals.weighted, 5_100_000);

console.log("Analytics checks passed: capital-path weighting, passed-record exclusion, project linkage, planning-basis precedence, stage audit and enterprise totals.");

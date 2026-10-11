import { expect, it } from "vitest";
import { deploymentMonths, deploymentPeriods, type DeploymentEvidence } from "../shared/deploymentChart";
it("uses categorized spending once and preserves unknown funding in cumulative and quarterly views", () => {
  const evidence: DeploymentEvidence[] = [{ id: 1, monthIndex: 1, metricCategory: "capital_deployment", deploymentCategory: "building", amount: -100, phase: "construction", dataState: "estimated" }, { id: 2, monthIndex: 1, metricCategory: "funding_draw", deploymentCategory: null, amount: 80, phase: "construction", dataState: "projected" }];
  const months = deploymentMonths([{ monthIndex: 1, constructionDeployment: 999 }, { monthIndex: 2, constructionDeployment: 200 }], evidence);
  expect(months[0].total).toBe(100);
  expect(months[0].values.construction).toBe(100);
  expect(months[1].funding).toBeNull();
  const cumulative = deploymentPeriods(months, false, true);
  expect(cumulative[0].gap).toBe(20);
  expect(cumulative[1].gap).toBeNull();
  expect(cumulative[1].total).toBe(300);
  const quarter = deploymentPeriods(months, true, false)[0];
  expect(quarter.total).toBe(300);
  expect(quarter.funding).toBeNull();
  expect(deploymentMonths([], [{ ...evidence[0], amount: null }])[0].total).toBeNull();
});

export type DeploymentEvidence = { id: number; monthIndex: number; metricCategory: string; deploymentCategory: string | null; amount: number | null; phase: string; dataState: string; sourceReference?: string | null };
export type DeploymentSchedule = { monthIndex: number; constructionDeployment: number | null };
export const deploymentCategories = ["land", "construction", "equipment", "professional", "contingency", "other", "unclassified"] as const;
export const deploymentLabels: Record<string, string> = { land: "Land & site", construction: "Construction", equipment: "Equipment", professional: "Professional services", contingency: "Contingency", other: "Other recorded uses", unclassified: "Uncategorized schedule" };
const category = (key: string | null) => {
  if (!key || key === "not_applicable") return "unclassified";
  if (["land_site", "land", "site"].includes(key)) return "land";
  if (["building", "construction"].includes(key)) return "construction";
  if (["equipment", "robotics_automation", "furniture_fixtures_equipment"].includes(key)) return "equipment";
  if (["soft_costs", "professional_services"].includes(key)) return "professional";
  if (key === "contingency") return "contingency";
  return "other";
};
export function deploymentMonths(schedule: DeploymentSchedule[], evidence: DeploymentEvidence[]) {
  const months = Array.from(new Set([...schedule.map(s => s.monthIndex), ...evidence.filter(r => ["capital_deployment", "funding_draw"].includes(r.metricCategory)).map(r => r.monthIndex)])).sort((a, b) => a - b);
  if (!months.length) return [];
  return Array.from({ length: Math.max(...months) }, (_, index) => {
    const month = index + 1;
    const records = evidence.filter(r => r.monthIndex === month && ["capital_deployment", "funding_draw"].includes(r.metricCategory));
    const spending = records.filter(r => r.metricCategory === "capital_deployment" && r.dataState !== "missing");
    const funding = records.filter(r => r.metricCategory === "funding_draw" && r.dataState !== "missing");
    const values: Record<string, number> = Object.fromEntries(deploymentCategories.map(k => [k, 0]));
    const fallback = schedule.find(s => s.monthIndex === month)?.constructionDeployment ?? null;
    spending.forEach(r => { if (r.amount !== null) values[category(r.deploymentCategory)] += -r.amount; });
    if (!spending.length && fallback !== null) values.unclassified = fallback;
    return { month, label: `M${month}`, values, total: spending.length ? spending.every(r => r.amount !== null) ? Object.values(values).reduce((a, b) => a + b, 0) : null : fallback,
      funding: funding.length && funding.every(r => r.amount !== null) ? funding.reduce((sum, r) => sum + (r.amount ?? 0), 0) : null,
      phases: Array.from(new Set(spending.map(r => r.phase))), records,
      basis: spending.length ? Array.from(new Set(spending.map(r => r.dataState))).join(", ") : fallback !== null ? "estimated schedule" : "missing",
      scheduleAmount: fallback };
  });
}
export function deploymentPeriods(months: ReturnType<typeof deploymentMonths>, quarterly: boolean, cumulative: boolean) {
  const groups: typeof months[] = [];
  months.forEach((m, i) => { const group = quarterly ? Math.floor(i / 3) : i; (groups[group] ??= []).push(m); });
  let spent = 0, funded = 0, completeSpend = true, completeFunding = true;
  const running: Record<string, number> = Object.fromEntries(deploymentCategories.map(k => [k, 0]));
  return groups.map((group, i) => {
    const knownSpend = group.every(m => m.total !== null), knownFunding = group.every(m => m.funding !== null);
    const total = group.reduce((sum, m) => sum + (m.total ?? 0), 0), draw = group.reduce((sum, m) => sum + (m.funding ?? 0), 0);
    spent += total; funded += draw; completeSpend &&= knownSpend; completeFunding &&= knownFunding;
    const values = Object.fromEntries(deploymentCategories.map(k => { const v = group.reduce((sum, m) => sum + m.values[k], 0); running[k] += v; return [k, cumulative ? completeSpend ? running[k] : null : knownSpend ? v : null]; }));
    return { ...values, label: quarterly ? `Q${i + 1}` : group[0].label, months: group,
      total: cumulative ? completeSpend ? spent : null : knownSpend ? total : null,
      funding: cumulative ? completeFunding ? funded : null : knownFunding ? draw : null,
      gap: completeSpend && completeFunding ? Math.max(0, spent - funded) : null };
  });
}

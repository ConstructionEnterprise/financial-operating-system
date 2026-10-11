export const deploymentUseLabels = {
  construction: "Construction", land_site: "Land & site", equipment: "Equipment",
  payroll: "Payroll", insurance: "Insurance", software: "Software & technology",
  professional_services: "Professional services", working_capital: "Working capital",
  contingency: "Contingency", other: "Other uses",
} as const;
export type DeploymentUse = keyof typeof deploymentUseLabels;
export type DeploymentRow = {
  id: string; purpose: string; source: string; destination: string; category: string;
  planned: number; committed: number | null; paid: number; month: string | null;
};
export const currencyValue = (value: unknown) => value == null ? 0 : Number(value);
export function summarizeDeployment(rows: DeploymentRow[]) {
  return rows.reduce((sum, row) => ({ planned: sum.planned + row.planned, committed: sum.committed + (row.committed ?? 0), paid: sum.paid + row.paid }), { planned: 0, committed: 0, paid: 0 });
}
export function deploymentGroups(rows: DeploymentRow[], field: "source" | "destination" | "category", measure: "planned" | "committed" | "paid") {
  const groups = new Map<string, number>();
  for (const row of rows) groups.set(row[field], (groups.get(row[field]) ?? 0) + (row[measure] ?? 0));
  return Array.from(groups).map(([name, value]) => ({ name, value })).filter((row) => row.value > 0).sort((a, b) => b.value - a.value);
}
export function deploymentFlow(rows: DeploymentRow[], measure: "planned" | "committed" | "paid") {
  const nodes: { name: string; dimension: "source" | "destination" | "category" }[] = [];
  const ids = new Map<string, number>();
  const links = new Map<string, { source: number; target: number; value: number }>();
  const node = (dimension: "source" | "destination" | "category", name: string) => {
    const key = `${dimension}:${name}`;
    if (!ids.has(key)) { ids.set(key, nodes.length); nodes.push({ name, dimension }); }
    return ids.get(key)!;
  };
  for (const row of rows) {
    const value = row[measure] ?? 0; if (value <= 0) continue;
    const source = node("source", row.source), destination = node("destination", row.destination), category = node("category", row.category);
    for (const [from, to] of [[source, destination], [destination, category]]) {
      const key = `${from}:${to}`;
      const existing = links.get(key);
      if (existing) existing.value += value; else links.set(key, { source: from, target: to, value });
    }
  }
  return { nodes, links: Array.from(links.values()) };
}

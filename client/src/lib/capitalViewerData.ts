import { deploymentFlow, type DeploymentRow } from "../../../shared/capitalDeployment";
import { equipmentLineBudget, strategyLabels, type EquipmentPlanItem } from "../../../shared/equipmentPlan";
import { campaignMeta, campaignTotals, type CampaignType } from "../../../shared/campaignFinance";

export type ViewerRow = DeploymentRow & { unpriced?: boolean };
export type EquipmentPlanRecord = { id: number; projectName: string; plan: { items: EquipmentPlanItem[] } };
export type CampaignRecord = { id: number; name: string; financeType: string; targetAmount: number | string | null; internalProjectId: number | null; recipientEntity: string | null; description: string | null };
export function equipmentViewerRows(plans: EquipmentPlanRecord[]): ViewerRow[] {
  return plans.flatMap(plan => plan.plan.items.map(item => ({ id: `equipment-${plan.id}-${item.key}`, source: strategyLabels[item.strategy], destination: plan.projectName, category: item.name, purpose: `${item.quantity} × ${item.name} · M${item.startMonth}–${item.endMonth} · ${item.basis}`, planned: equipmentLineBudget(item) ?? 0, unpriced: equipmentLineBudget(item) === null, committed: null, paid: 0, month: null })));
}
export function campaignViewerRows(campaigns: CampaignRecord[], opportunities: Parameters<typeof campaignTotals>[0], projects: { id: number; projectName: string }[]): ViewerRow[] {
  return campaigns.map(c => {
    const totals = campaignTotals(opportunities, c.id, c.targetAmount == null ? null : Number(c.targetAmount));
    return { id: `campaign-${c.id}`, source: campaignMeta[c.financeType as CampaignType]?.label ?? "Unclassified", destination: `${c.name} · #${c.id}`, category: c.internalProjectId === null ? c.recipientEntity || "Recipient unassigned" : projects.find(p => p.id === c.internalProjectId)?.projectName ?? `Project #${c.internalProjectId}`, purpose: c.description || c.name, planned: Number(c.targetAmount ?? 0), unpriced: c.targetAmount == null, committed: totals.committed, paid: totals.funded, month: null };
  });
}
// Unpriced and zero-value records remain discoverable, with dashed relationships.
export function viewerFlow(rows: ViewerRow[], measure: "planned" | "committed" | "paid") {
  const graph = deploymentFlow(rows, measure);
  const node = (dimension: "source" | "destination" | "category", name: string) => {
    const found = graph.nodes.findIndex(n => n.dimension === dimension && n.name === name);
    if (found >= 0) return found;
    graph.nodes.push({ dimension, name }); return graph.nodes.length - 1;
  };
  for (const row of rows) {
    const a = node("source", row.source), b = node("destination", row.destination), c = node("category", row.category);
    for (const [source, target] of [[a, b], [b, c]]) if (!graph.links.some(l => l.source === source && l.target === target)) graph.links.push({ source, target, value: 0 });
  }
  return graph;
}

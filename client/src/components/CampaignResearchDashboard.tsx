import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { trpc } from "@/lib/trpc";
import type { CampaignType } from "../../../shared/campaignFinance";

export function CampaignResearchDashboard({ type, tasks, project, opportunities }: { type: CampaignType; tasks: any[]; project?: any; opportunities: any[] }) {
  const jv = trpc.fundraising.jvPartnerProspects.useQuery(undefined, { enabled: type === "project_equity" });
  const equipment = trpc.fundraising.equipmentRentalVendors.useQuery(undefined, { enabled: type === "equipment" });
  const grants = trpc.fundraising.grantFundingPrograms.useQuery(undefined, { enabled: type === "grants" });
  const query = type === "project_equity" ? jv : type === "equipment" ? equipment : type === "grants" ? grants : null;
  const rows: any[] = type === "project_equity" ? jv.data || [] : type === "equipment" ? equipment.data || [] : type === "grants" ? grants.data || [] : opportunities;
  const label = type === "project_equity" ? "JV partner research pool" : type === "equipment" ? "Equipment vendor research pool" : type === "grants" ? "Saved grant program research" : type === "project_debt" ? "Linked lender opportunities" : "Assigned equity opportunities";
  const groups = new Map<string, number>();
  rows.forEach(row => {
    const key = (type === "project_equity" ? row.region : type === "equipment" ? row.region : type === "grants" ? row.mechanismType : row.stage) || "Not categorized";
    groups.set(key, (groups.get(key) || 0) + 1);
  });
  const data = Array.from(groups).map(([name, count]) => ({ name: name.replaceAll("_", " "), count })).sort((a, b) => b.count - a.count);
  const tasksData = ["open", "in_progress", "done", "snoozed"].map(status => ({ name: status.replaceAll("_", " "), count: tasks.filter(task => task.status === status).length }));
  return <div className="campaign-grid">
    <article><small>RESEARCH & SOURCING</small><h3>{label}</h3>{query?.error ? <p role="alert">Research records could not load.</p> : query?.isLoading ? <p>Loading research…</p> : <><strong className="campaign-research-count">{rows.length}</strong><p>{query ? "Workspace research context. These records are not automatically campaign members or funding commitments." : "Capital records explicitly attached to this campaign."}</p>{data.length ? <div className="campaign-chart"><ResponsiveContainer><BarChart data={data} layout="vertical" margin={{ left: 5, right: 18 }}><XAxis type="number" allowDecimals={false} /><YAxis type="category" dataKey="name" width={120} tick={{ fontSize: 11 }} /><Tooltip /><Bar dataKey="count" name="Records" fill="#7192a9" radius={[0, 4, 4, 0]} /></BarChart></ResponsiveContainer></div> : <p>{type === "project_debt" ? "The lender-shortlist task is ready. No bank or agency relationship is recorded yet." : "Add sourced records to build this research view."}</p>}</>}</article>
    <article><small>EXECUTION READINESS</small><h3>Campaign task progress</h3><div className="campaign-chart"><ResponsiveContainer><BarChart data={tasksData}><XAxis dataKey="name" tick={{ fontSize: 11 }} /><YAxis allowDecimals={false} /><Tooltip /><Bar dataKey="count" name="Tasks" fill="#486b53" radius={[4, 4, 0, 0]} /></BarChart></ResponsiveContainer></div>{project && <div className="campaign-project-context"><b>{project.projectName}</b><p>Recorded project requirement: {project.capitalRequirement == null ? "Not recorded" : new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(project.capitalRequirement)} · {project.capitalRequirementDataState}</p><small>Project context only. Debt, JV contributions and other sources must be sized separately.</small></div>}</article>
  </div>;
}

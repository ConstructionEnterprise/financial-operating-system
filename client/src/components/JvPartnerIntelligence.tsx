import { useMemo, useState } from "react";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip, Bar, BarChart, XAxis, YAxis } from "recharts";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import "./JvPartnerIntelligence.css";

const statusOrder = ["prospect", "research", "qualified", "converted", "passed"] as const;
const statusLabels: Record<string, string> = { prospect: "Sourced", research: "Research", qualified: "Qualified", converted: "Opportunity", passed: "Passed" };
const statusColors: Record<string, string> = { prospect: "#83917e", research: "#7192a9", qualified: "#a48848", converted: "#3f7155", passed: "#a46f61" };
const archetypeLabels: Record<string, string> = { industrial_developer: "Industrial", multifamily_residential_developer: "Residential", landowner_land_developer: "Land", facility_manufacturing_partner: "Facility", real_estate_investment_development: "Real estate", logistics_transportation_partner: "Logistics", economic_development_strategic_partner: "Strategic" };
const regionalLayout = ["DFW", "AllianceTexas", "Austin", "San Antonio", "Houston", "Port Houston", "Corpus Christi", "El Paso", "Midland / Odessa", "Other Texas"];

function titleize(value?: string | null) { return value?.replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase()) || "Not recorded"; }
function contributionLabel(prospect: any) {
  const available = [["Land", prospect.landContributionPotential], ["Capital", prospect.capitalContributionPotential], ["Development", prospect.developmentContributionPotential], ["Facility", prospect.facilityContributionPotential]].filter(([, value]) => value === "Yes").map(([label]) => label);
  return available.length ? available.join(" + ") : "Qualification pending";
}

export function JvPartnerIntelligence() {
  const utils = trpc.useUtils();
  const { data: prospects = [], isLoading } = trpc.fundraising.jvPartnerProspects.useQuery();
  const update = trpc.fundraising.updateJvPartnerProspect.useMutation({ onSuccess: () => { void utils.fundraising.jvPartnerProspects.invalidate(); toast.success("JV prospect updated. No outreach was sent."); }, onError: (error) => toast.error(error.message) });
  const convert = trpc.fundraising.convertJvPartnerProspect.useMutation({ onSuccess: () => { void utils.fundraising.jvPartnerProspects.invalidate(); void utils.fundraising.capitalOpportunities.invalidate(); toast.success("Qualified prospect converted to a JV opportunity. No outreach was sent."); }, onError: (error) => toast.error(error.message) });
  const importUniverse = trpc.fundraising.importTexasJvMasterUniverse.useMutation({ onSuccess: (result) => { void utils.fundraising.jvPartnerProspects.invalidate(); toast.success(`${result.inserted} verified Texas records imported; ${result.skipped} existing records preserved.`); }, onError: (error) => toast.error(error.message) });
  const [regionFilter, setRegionFilter] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<number | null>(null);

  const visible = useMemo(() => prospects.filter((prospect: any) => (!regionFilter || prospect.region === regionFilter) && (!statusFilter || prospect.status === statusFilter)), [prospects, regionFilter, statusFilter]);
  const selected = prospects.find((prospect: any) => prospect.id === selectedId) || visible[0] || prospects[0];
  const statusData = statusOrder.map((status) => ({ status, label: statusLabels[status], count: prospects.filter((prospect: any) => prospect.status === status).length }));
  const regionalData = regionalLayout.map((region) => ({ region, count: prospects.filter((prospect: any) => prospect.region === region).length })).filter((item) => item.count > 0);
  const archetypeData = Object.entries(prospects.reduce((groups: Record<string, number>, prospect: any) => { const key = prospect.partnerType || "unknown"; groups[key] = (groups[key] || 0) + 1; return groups; }, {})).map(([type, count]) => ({ type, label: archetypeLabels[type] || titleize(type), count }));
  const priorityQueue = [...visible].sort((left: any, right: any) => (left.priority || "C").localeCompare(right.priority || "C") || Number(right.indicativeCapitalAmount || 0) - Number(left.indicativeCapitalAmount || 0)).slice(0, 5);
  const clearFilters = () => { setRegionFilter(null); setStatusFilter(null); };

  return <section className="jv-intelligence" aria-label="Texas JV partner intelligence">
    <header className="jv-intelligence-header"><div><div className="kicker">TEXAS JV PARTNER INTELLIGENCE</div><h2>See the Texas partnership field before you work the queue.</h2><p>Source-attributed market intelligence stays separate from operating opportunities until a person explicitly qualifies and converts a record.</p></div><div className="jv-intelligence-total"><b>{prospects.length}</b><span>sourced<br />partners</span>{!prospects.length && <Button size="sm" onClick={() => importUniverse.mutate()} disabled={importUniverse.isPending}>{importUniverse.isPending ? "Importing…" : "Import Texas universe"}</Button>}</div></header>

    <div className="jv-status-strip" role="list" aria-label="JV partner pipeline">{statusData.map((item) => <button key={item.status} className={statusFilter === item.status ? "active" : ""} onClick={() => setStatusFilter(statusFilter === item.status ? null : item.status)} role="listitem"><i style={{ background: statusColors[item.status] }} /><span>{item.label}</span><b>{item.count}</b></button>)}</div>

    {prospects.length ? <>
      <div className="jv-intelligence-grid">
        <article className="jv-visual-panel jv-region-map"><div className="jv-panel-heading"><div><div className="kicker">MARKET MAP</div><h3>Where the partner universe is concentrated</h3></div>{(regionFilter || statusFilter) && <button className="jv-clear-filter" onClick={clearFilters}>Clear filters</button>}</div><div className="jv-map-nodes">{regionalData.map((item) => <button key={item.region} className={`${regionFilter === item.region ? "selected " : ""}region-${item.region.toLowerCase().replaceAll(/[^a-z]+/g, "-")}`} onClick={() => setRegionFilter(regionFilter === item.region ? null : item.region)}><span>{item.region}</span><b>{item.count}</b></button>)}</div><small>Click a region to focus the pipeline and partner queue.</small></article>
        <article className="jv-visual-panel jv-archetype-chart"><div className="kicker">PARTNER MIX</div><h3>What each organization can bring</h3><div className="jv-donut-wrap"><ResponsiveContainer width="100%" height={218}><PieChart><Pie data={archetypeData} dataKey="count" nameKey="label" innerRadius={54} outerRadius={85} paddingAngle={2}>{archetypeData.map((item, index) => <Cell key={item.type} fill={["#486b53", "#a48848", "#7192a9", "#8f7654", "#6a7b75", "#88779c", "#9c6f59"][index % 7]} />)}</Pie><Tooltip formatter={(value, _, context: any) => [`${value} partners`, context?.payload?.label || ""]} /></PieChart></ResponsiveContainer><div className="jv-donut-total"><b>{prospects.length}</b><span>records</span></div></div><div className="jv-legend">{archetypeData.slice(0, 5).map((item) => <span key={item.type}>{item.label} <b>{item.count}</b></span>)}</div></article>
      </div>

      <div className="jv-intelligence-grid jv-lower-grid">
        <article className="jv-visual-panel jv-priority-queue"><div className="jv-panel-heading"><div><div className="kicker">PRIORITY QUEUE</div><h3>Five partners to qualify next</h3></div><span>{visible.length} visible</span></div><div className="jv-priority-list">{priorityQueue.map((prospect: any, index) => <button key={prospect.id} className={selected?.id === prospect.id ? "selected" : ""} onClick={() => setSelectedId(prospect.id)}><span className={`jv-priority-mark priority-${prospect.priority || "C"}`}>{prospect.priority || "C"}</span><span><b>{index + 1}. {prospect.organizationName}</b><small>{prospect.region} · {archetypeLabels[prospect.partnerType] || titleize(prospect.partnerType)}</small></span><em>{contributionLabel(prospect)}</em></button>)}</div></article>
        <article className="jv-visual-panel jv-pipeline-chart"><div className="kicker">QUALIFICATION FLOW</div><h3>Where the sourced universe stands</h3><ResponsiveContainer width="100%" height={230}><BarChart data={statusData} layout="vertical" margin={{ left: 6, right: 18 }}><XAxis type="number" allowDecimals={false} /><YAxis type="category" dataKey="label" width={82} /><Tooltip formatter={(value) => [`${value} partners`, "Count"]} /><Bar dataKey="count" radius={[0, 4, 4, 0]}>{statusData.map((item) => <Cell key={item.status} fill={statusColors[item.status]} />)}</Bar></BarChart></ResponsiveContainer><small>Qualification is an explicit, reversible decision. No contact is made from this view.</small></article>
      </div>

      {selected && <article className="jv-selected-partner"><div className="jv-selected-heading"><div><div className="kicker">SELECTED PARTNER</div><h3>{selected.organizationName}</h3><p>{selected.jvThesis || "No partnership thesis has been recorded yet."}</p></div><span className={`jv-priority-mark priority-${selected.priority || "C"}`}>{selected.priority || "C"}</span></div><div className="jv-pathway"><section><span>1</span><div><small>PARTNER</small><b>{archetypeLabels[selected.partnerType] || titleize(selected.partnerType)}</b><p>{selected.region || "Texas region pending"}</p></div></section><i>→</i><section><span>2</span><div><small>STATED FOCUS</small><b>{selected.assetFocus || selected.developmentFocus || "Focus to qualify"}</b><p>{selected.jvExperience || "JV experience not yet recorded"}</p></div></section><i>→</i><section><span>3</span><div><small>POSSIBLE CONTRIBUTION</small><b>{contributionLabel(selected)}</b><p>{selected.ceRelevance || "Record CE relevance during qualification."}</p></div></section></div><div className="jv-selected-footer"><a href={selected.sourceUrl} target="_blank" rel="noreferrer">Open recorded public source</a><span>{selected.status === "qualified" ? "Qualified — ready to form an opportunity" : "Qualification changes only this source-attributed record."}</span>{selected.status === "qualified" ? <Button onClick={() => convert.mutate({ id: selected.id })} disabled={convert.isPending}>{convert.isPending ? "Creating…" : "Create JV opportunity"}</Button> : <Button variant="outline" onClick={() => update.mutate({ id: selected.id, status: "qualified" })} disabled={update.isPending}>{update.isPending ? "Saving…" : "Qualify partner"}</Button>}</div></article>}
    </> : <div className="jv-intelligence-empty">{isLoading ? "Loading partner intelligence…" : "No partner records are available yet. Import the verified Texas universe to begin."}</div>}
  </section>;
}

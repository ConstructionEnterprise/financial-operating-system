import { useState } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { campaignMeta, campaignTypes, campaignTotals, type CampaignType } from "../../../shared/campaignFinance";
import "./CampaignFinanceWorkspace.css";
import { CampaignResearchDashboard } from "./CampaignResearchDashboard";
import { CampaignInstrumentDashboard } from "./CampaignInstrumentDashboard";

const money = (value: number | null) => value == null ? "Not set" : new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(value);
const typeOf = (value: string): CampaignType => campaignTypes.includes(value as CampaignType) ? value as CampaignType : "unclassified";

export function CampaignFinanceWorkspace() {
  const utils = trpc.useUtils();
  const campaignsQuery = trpc.fundraising.campaigns.useQuery();
  const opportunitiesQuery = trpc.fundraising.capitalOpportunities.useQuery();
  const projectsQuery = trpc.fundraising.internalProjects.useQuery();
  const tasksQuery = trpc.fundraising.tasks.useQuery();
  const meetingsQuery = trpc.fundraising.meetings.useQuery();
  const campaigns = campaignsQuery.data || [];
  const opportunities = opportunitiesQuery.data || [];
  const projects = projectsQuery.data || [];
  const [type, setType] = useState<CampaignType>("company_equity");
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [creating, setCreating] = useState(false);
  const [search, setSearch] = useState("");
  const [opportunityId, setOpportunityId] = useState("");
  const [page, setPage] = useState(0);
  const fail = (error: { message: string }) => toast.error(error.message);
  const create = trpc.fundraising.createCampaign.useMutation({ onSuccess: row => { void utils.fundraising.campaigns.invalidate(); if (row) setSelectedId(row.id); setCreating(false); toast.success("Campaign created"); }, onError: fail });
  const update = trpc.fundraising.updateCampaign.useMutation({ onSuccess: () => { void utils.fundraising.campaigns.invalidate(); toast.success("Campaign saved"); }, onError: fail });
  const link = trpc.fundraising.updateCapitalOpportunity.useMutation({ onSuccess: () => { void utils.fundraising.capitalOpportunities.invalidate(); setOpportunityId(""); toast.success("Opportunity linked"); }, onError: fail });
  const visible = campaigns.filter(row => typeOf(row.financeType) === type && row.name.toLowerCase().includes(search.toLowerCase()));
  const selected = visible.find(row => row.id === selectedId) || visible[0];
  const meta = campaignMeta[type];
  const totals = selected ? campaignTotals(opportunities, selected.id, selected.targetAmount == null ? null : Number(selected.targetAmount)) : null;
  const chart = visible.map(row => ({ name: row.name, Target: row.targetAmount == null ? null : Number(row.targetAmount), Committed: campaignTotals(opportunities, row.id, null).committed, Funded: campaignTotals(opportunities, row.id, null).funded }));
  const error = campaignsQuery.error || opportunitiesQuery.error || projectsQuery.error;
  const loading = campaignsQuery.isLoading || opportunitiesQuery.isLoading;
  const milestones = meta.milestones;
  const stages = ["identified", "researching", "outreach", "meeting", "diligence", "term_sheet", "committed", "passed"];
  const linkedTasks = (tasksQuery.data || []).filter(task => task.campaignId === selected?.id && !["done", "snoozed"].includes(task.status));

  return <section className="campaign-finance">
    <header><div><div className="kicker">CAPITAL CAMPAIGNS</div><h2>Finance the company. Fund the projects.</h2><p>Organize each initiative by its instrument, recipient and intended use.</p></div><button onClick={() => setCreating(!creating)}>+ New campaign</button></header>
    <nav aria-label="Campaign financing types">{campaignTypes.map(key => <button key={key} aria-pressed={type === key} className={type === key ? "active" : ""} onClick={() => { setType(key); setSelectedId(null); setPage(0); setCreating(false); setSearch(""); }}><b>{campaignMeta[key].label}</b><span>{campaigns.filter(row => typeOf(row.financeType) === key).length} campaigns</span></button>)}</nav>
    {error && <p role="alert">Campaign data could not load: {error.message} <button onClick={() => { void campaignsQuery.refetch(); void opportunitiesQuery.refetch(); void projectsQuery.refetch(); }}>Retry</button></p>}
    {loading ? <p>Loading campaign records…</p> : <>
    <div className="campaign-purpose"><div><small>USES OF CAPITAL</small><h3>{meta.purpose}</h3></div><div><small>ECONOMIC OBLIGATION</small><p>{meta.obligation}</p></div></div>
    {creating && <CampaignEditor key={`new-${type}`} type={type} projects={projects} pending={create.isPending} onSave={input => create.mutate(input)} />}
    <label className="campaign-search">Find a campaign<input value={search} onChange={event => { setSearch(event.target.value); setPage(0); }} placeholder="Search campaign names" /></label>
    <div className="campaign-cards">{visible.slice(page * 5, page * 5 + 5).map(row => { const sums = campaignTotals(opportunities, row.id, row.targetAmount == null ? null : Number(row.targetAmount)); return <button key={row.id} className={selected?.id === row.id ? "selected" : ""} onClick={() => setSelectedId(row.id)}><small>{row.status} · {row.targetDate || "No target date"}</small><h3>{row.name}</h3><p>{row.recipientEntity || "Recipient not set"}</p><strong>{money(row.targetAmount == null ? null : Number(row.targetAmount))}</strong><progress aria-label={`${row.name} funded against target`} max={Math.max(1, Number(row.targetAmount || 0))} value={Math.min(sums.funded, Number(row.targetAmount || 0))} /><small>{money(sums.funded)} funded · {sums.linked.length} opportunities</small></button>; })}</div>
    {visible.length > 5 && <div className="campaign-pagination"><button disabled={page === 0} onClick={() => setPage(page - 1)}>Previous</button><span>Page {page + 1} of {Math.ceil(visible.length / 5)}</span><button disabled={(page + 1) * 5 >= visible.length} onClick={() => setPage(page + 1)}>Next</button></div>}
    {!visible.length && !error && <div className="campaign-empty"><h3>{search ? "No matching campaigns" : `Create your first ${meta.label.toLowerCase()} campaign`}</h3><p>Set a dollar target and recipient, then attach recorded capital opportunities.</p><button onClick={() => setCreating(true)}>Create campaign</button></div>}
    {selected && totals && <>
      <div className="campaign-selected"><div><small>SELECTED CAMPAIGN</small><h2>{selected.name}</h2><p>{selected.description || meta.purpose}</p></div><span>{selected.campaignOwner || "Owner not assigned"}</span></div>
      <div className="campaign-metrics">{[["Target", selected.targetAmount == null ? null : Number(selected.targetAmount)], ["Committed", totals.committed], ["Funded", totals.funded], ["Uncommitted gap", totals.gap]].map(([label, value]) => <article key={String(label)}><small>{label}</small><strong>{money(value as number | null)}</strong></article>)}</div>
      <small>Commitments and funding are separate views of linked opportunities and are not added together. Target is a campaign planning amount.</small>
      <CampaignInstrumentDashboard key={selected.id} campaign={selected} type={type} opportunities={totals.linked} tasks={(tasksQuery.data || []).filter(task => task.campaignId === selected.id)} meetings={(meetingsQuery.data || []).filter(meeting => meeting.campaignId === selected.id)} project={projects.find(project => project.id === selected.internalProjectId)} />
      {type !== "company_equity" && <CampaignResearchDashboard type={type} tasks={(tasksQuery.data || []).filter(task => task.campaignId === selected.id)} project={projects.find(project => project.id === selected.internalProjectId)} opportunities={totals.linked} />}
      <details className="campaign-detail-drawer"><summary>Open capital records and campaign comparisons</summary>
      <div className="campaign-flow" aria-label="Campaign capital relationships"><article><small>SOURCES</small>{totals.linked.length ? totals.linked.slice(0, 5).map(row => <p key={row.id}>{row.organizationName}</p>) : <p>No opportunities linked</p>}{totals.linked.length > 5 && <small>+ {totals.linked.length - 5} more below</small>}</article><span>→</span><article><small>{meta.label.toUpperCase()}</small><h3>{selected.name}</h3><p>{money(totals.funded)} recorded funded</p></article><span>→</span><article><small>RECIPIENT / DESTINATION</small><h3>{selected.recipientEntity || "Recipient not set"}</h3><p>{projects.find(project => project.id === selected.internalProjectId)?.projectName || "No project linked"}</p><p>{selected.description || meta.purpose}</p></article></div>
      <div className="campaign-grid"><article><h3>Campaign funding comparison</h3><p>Selected financing type · separate target, commitment and funding bars</p><div className="campaign-chart"><ResponsiveContainer><BarChart data={chart} margin={{ left: 12, right: 16, bottom: 10 }}><XAxis dataKey="name" tick={{ fontSize: 10 }} /><YAxis tickFormatter={value => `$${Number(value) / 1000000}M`} /><Tooltip formatter={value => money(Number(value))} /><Legend /><Bar dataKey="Target" fill="#b3bcab" /><Bar dataKey="Committed" fill="#a48848" /><Bar dataKey="Funded" fill="#486b53" /></BarChart></ResponsiveContainer></div></article><article><h3>{type === "project_debt" ? "Loan process" : type === "company_equity" ? "Equity process" : "Campaign process"}</h3><p>Milestone guide for this instrument</p><ol className="campaign-milestones">{milestones.map((label, index) => <li key={label}><b>{index + 1}</b>{label}</li>)}</ol><h4>Recorded opportunity stages</h4><div className="campaign-stage-counts">{stages.map(stage => <span key={stage}>{stage.replaceAll("_", " ")} <b>{totals.linked.filter(row => row.stage === stage).length}</b></span>)}</div></article></div>
      <div className="campaign-grid"><article><h3>Funding opportunities</h3><label>Attach an unassigned opportunity<select value={opportunityId} onChange={event => setOpportunityId(event.target.value)}><option value="">Select a capital record</option>{opportunities.filter(row => row.campaignId == null).map(row => <option key={row.id} value={row.id}>{row.organizationName} · {row.capitalPath.replaceAll("_", " ")}</option>)}</select></label><button disabled={!opportunityId || link.isPending} onClick={() => link.mutate({ id: Number(opportunityId), campaignId: selected.id })}>Attach to campaign</button><div className="campaign-record-scroll">{totals.linked.map(row => <div key={row.id}><b>{row.organizationName}</b><span>{row.stage.replaceAll("_", " ")}</span><small>Requested {money(row.requestedAmount)} · Committed {money(row.committedAmount)} · Funded {money(row.fundedAmount)}</small><p>{row.nextAction || "Next action not recorded"}</p></div>)}</div></article><article><h3>Campaign action queue</h3>{tasksQuery.error ? <p role="alert">Tasks could not load.</p> : linkedTasks.length ? <div className="campaign-record-scroll">{linkedTasks.map(task => <div key={task.id}><b>{task.title}</b><p>{task.dueAt ? `Due ${new Date(task.dueAt).toLocaleDateString()}` : "No due date"} · {task.status}</p></div>)}</div> : <p>No open tasks linked to this campaign. Assign campaign tasks in the Tasks workspace.</p>}<h4>Financing terms & next decisions</h4><p className="campaign-terms">{selected.financingTerms || (type === "project_debt" ? "Record proposed rate, loan term, collateral, borrower equity, closing conditions and draw schedule." : type === "company_equity" ? "Record valuation, ownership offered, hiring plan, monthly burn and runway assumptions." : "Record proposed economics, conditions and upcoming decisions.")}</p></article></div>
      </details>
      <details><summary>Edit campaign purpose, target and financing terms</summary><CampaignEditor key={`${selected.id}-${selected.updatedAt}`} type={type} campaign={selected} projects={projects} pending={update.isPending} onSave={input => update.mutate({ ...input, id: selected.id })} /></details>
    </>}
    </>}
  </section>;
}

function CampaignEditor({ type, campaign, projects, pending, onSave }: { type: CampaignType; campaign?: any; projects: any[]; pending: boolean; onSave: (input: any) => void }) {
  return <form className="campaign-editor" onSubmit={event => {
    event.preventDefault(); const data = new FormData(event.currentTarget);
    const value = (name: string) => String(data.get(name) || "").trim();
    onSave({ name: value("name"), financeType: value("financeType"), recipientEntity: value("recipientEntity") || null, description: value("description"), targetAmount: value("targetAmount") || null, internalProjectId: value("internalProjectId") ? Number(value("internalProjectId")) : null, campaignOwner: value("campaignOwner") || null, targetDate: value("targetDate") || null, financingTerms: value("financingTerms") || null, status: value("status") });
  }}>
    <label>Campaign name<input name="name" required maxLength={255} defaultValue={campaign?.name} /></label>
    <label>Financing instrument<select name="financeType" defaultValue={campaign?.financeType || type}>{campaignTypes.map(key => <option key={key} value={key}>{campaignMeta[key].label}</option>)}</select></label>
    <label>Recipient / borrower entity<input name="recipientEntity" maxLength={255} defaultValue={campaign?.recipientEntity} placeholder="CE operating company or project entity" /></label>
    <label>Capital target ($)<input name="targetAmount" type="number" min="0" max="99999999999999" step="0.01" defaultValue={campaign?.targetAmount} /></label>
    <label>Project<select name="internalProjectId" defaultValue={campaign?.internalProjectId || ""}><option value="">Company / no project assigned</option>{projects.map(project => <option key={project.id} value={project.id}>{project.projectName}</option>)}</select></label>
    <label>Campaign owner<input name="campaignOwner" maxLength={255} defaultValue={campaign?.campaignOwner} /></label>
    <label>Target close date<input name="targetDate" type="date" defaultValue={campaign?.targetDate} /></label>
    <label>Status<select name="status" defaultValue={campaign?.status || "planning"}>{["planning", "active", "paused", "completed"].map(status => <option key={status}>{status}</option>)}</select></label>
    <label className="wide">Objective / intended uses<textarea name="description" defaultValue={campaign?.description} placeholder="What this capital will finance" /></label>
    <label className="wide">Financing terms and assumptions<textarea name="financingTerms" maxLength={10000} rows={4} defaultValue={campaign?.financingTerms} placeholder={type === "project_debt" ? "Interest rate, maturity, collateral, borrower equity and draw conditions" : "Ownership, valuation, hiring, burn and runway; or instrument-specific terms"} /></label>
    <button disabled={pending}>{pending ? "Saving…" : "Save campaign"}</button>
  </form>;
}

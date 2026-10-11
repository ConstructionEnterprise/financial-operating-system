import { useEffect, useMemo, useState } from "react";
import "./CapitalFlowDashboard.css";
import { Bar, BarChart, CartesianGrid, Cell, Legend, Line, LineChart, Pie, PieChart, ResponsiveContainer, Sankey, Tooltip, XAxis, YAxis } from "recharts";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { capitalPathMeta, capitalOpportunityStages, summarizeCapitalFormation, rankCapitalActions, type CapitalPath } from "../../../shared/capitalFormation";
import { deploymentFlow, deploymentGroups, deploymentUseLabels, summarizeDeployment, type DeploymentRow, type DeploymentUse } from "../../../shared/capitalDeployment";

const money = (value: number) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 2 }).format(value);
const shortMoney = (value: number) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", notation: "compact", maximumFractionDigits: 1 }).format(value);
const colors = ["#486b53", "#a48848", "#6288a2", "#af7051", "#829d70", "#82749b", "#678e8a", "#ab9292", "#878370", "#64727c"];
const useLabel = (category: string) => deploymentUseLabels[category as DeploymentUse] ?? category.replaceAll("_", " ");
const modelCategory = (category: string) => (({ building: "construction", technology: "software", robotics_automation: "equipment", furniture_fixtures_equipment: "equipment", soft_costs: "professional_services" } as Record<string, string>)[category] ?? category);
type Measure = "planned" | "committed" | "paid";
type Filter = { dimension: "source" | "destination" | "category"; name: string } | null;
const emptyAllocation = { id: undefined as number | undefined, sourceOpportunityId: "", internalProjectId: "", purpose: "", category: "construction" as DeploymentUse, equipmentName: "", plannedAmount: "", committedAmount: "", plannedMonth: "", reference: "", notes: "" };

function ChartEmpty({ children }: { children: React.ReactNode }) { return <div className="capital-visual-empty">{children}</div>; }
function FlowNode({ x, y, width, height, payload, onSelect }: any) {
  const isMiddle = payload.dimension === "destination";
  return <g role="button" tabIndex={0} aria-label={`Filter ${payload.dimension}: ${payload.name}`} onClick={() => onSelect({ dimension: payload.dimension, name: payload.name })} onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); onSelect({ dimension: payload.dimension, name: payload.name }); } }} style={{ cursor: "pointer" }}>
    <rect x={x} y={y} width={width} height={Math.max(2, height)} fill={isMiddle ? "#a48848" : payload.dimension === "source" ? "#486b53" : "#6288a2"} rx={3} />
    <text x={isMiddle ? x + width + 8 : x - 8} y={y + height / 2} dy=".35em" textAnchor={isMiddle ? "start" : "end"} fontSize={11} fill="#35493d">{payload.name.length > 26 ? `${payload.name.slice(0, 24)}…` : payload.name}</text>
  </g>;
}

export function CapitalFlowDashboard({ buckets, opportunities, onOpenPath }: { buckets: any[]; opportunities: any[]; onOpenPath: (path: CapitalPath) => void }) {
  const utils = trpc.useUtils();
  const ledger = trpc.fundraising.capitalDeployment.useQuery(undefined, { refetchOnWindowFocus: true });
  const projectQuery = trpc.fundraising.internalProjects.useQuery();
  const portfolioQuery = trpc.fundraising.financialOsPortfolioSnapshot.useQuery();
  const projects = projectQuery.data ?? [];
  const allocations = ledger.data?.allocations ?? [];
  const payments = ledger.data?.payments ?? [];
  const [view, setView] = useState<"model" | "recorded">("model");
  const [measure, setMeasure] = useState<Measure>("planned");
  const [filter, setFilter] = useState<Filter>(null);
  const [path, setPath] = useState<CapitalPath | "all">("all");
  const [stage, setStage] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [editor, setEditor] = useState(false);
  const [draft, setDraft] = useState(emptyAllocation);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [paymentDraft, setPaymentDraft] = useState({ amount: "", paidOn: "", reference: "", requestKey: crypto.randomUUID() });
  useEffect(() => { setPaymentDraft({ amount: "", paidOn: "", reference: "", requestKey: crypto.randomUUID() }); }, [selectedId]);
  useEffect(() => { if (editor) document.querySelector(".capital-allocation-form")?.scrollIntoView({ behavior: "smooth", block: "start" }); }, [editor]);
  const invalidate = () => { void utils.fundraising.capitalDeployment.invalidate(); };
  const saveAllocation = trpc.fundraising.saveCapitalAllocation.useMutation({ onSuccess: ({ id }) => { invalidate(); setSelectedId(id); setEditor(false); setDraft(emptyAllocation); toast.success("Capital allocation saved"); }, onError: (error) => toast.error(error.message) });
  const recordPayment = trpc.fundraising.recordCapitalPayment.useMutation({ onSuccess: () => { invalidate(); setPaymentDraft({ amount: "", paidOn: "", reference: "", requestKey: crypto.randomUUID() }); toast.success("Payment recorded"); }, onError: (error) => toast.error(error.message) });
  const voidPayment = trpc.fundraising.setCapitalPaymentVoided.useMutation({ onSuccess: invalidate, onError: (error) => toast.error(error.message) });
  const sourceName = (id: number | null) => id === null ? "Unassigned funding" : `${opportunities.find((row) => row.id === id)?.organizationName ?? "Source"} · #${id}`;
  const destinationName = (id: number | null) => id === null ? "Company operations" : projects.find((row) => row.id === id)?.projectName ?? `Project ${id}`;
  const recordedRows: DeploymentRow[] = allocations.map((allocation) => ({ id: String(allocation.id), purpose: allocation.purpose, source: sourceName(allocation.sourceOpportunityId), destination: destinationName(allocation.internalProjectId), category: useLabel(allocation.category), planned: Number(allocation.plannedAmount), committed: allocation.committedAmount === null ? null : Number(allocation.committedAmount), paid: payments.filter((payment) => payment.allocationId === allocation.id && !payment.voided).reduce((sum, payment) => sum + Number(payment.amount), 0), month: allocation.plannedMonth }));
  const modelRows = useMemo(() => {
    const rows: DeploymentRow[] = [];
    for (const project of portfolioQuery.data?.projects ?? []) {
      const scenario = project.scenarios.find((row) => row.scenarioId === project.primaryScenarioId);
      const mix = scenario?.capitalDeployment ?? [];
      for (const item of mix) rows.push({ id: `model-${project.projectId}-${item.category}`, purpose: project.primaryScenarioName ?? "Planning model", source: "Funding not assigned in model", destination: project.projectName, category: useLabel(modelCategory(item.category)), planned: item.amount, committed: null, paid: 0, month: null });
      const detailed = mix.reduce((sum, item) => sum + item.amount, 0);
      const remainder = (project.developmentCost ?? 0) - detailed;
      if (remainder > 0) rows.push({ id: `model-${project.projectId}-unallocated`, purpose: project.primaryScenarioName ?? "Planning model", source: "Funding not assigned in model", destination: project.projectName, category: "Budget awaiting breakdown", planned: remainder, committed: null, paid: 0, month: null });
    }
    return rows;
  }, [portfolioQuery.data]);
  const sourceRows = view === "model" ? modelRows : recordedRows;
  const shownRows = sourceRows.filter((row) => !filter || row[filter.dimension] === filter.name);
  const effectiveMeasure = view === "model" ? "planned" : measure;
  const totals = summarizeDeployment(shownRows);
  const graph = deploymentFlow(shownRows, effectiveMeasure);
  const useGroups = deploymentGroups(shownRows, "category", effectiveMeasure);
  const projectGroups = deploymentGroups(shownRows, "destination", effectiveMeasure);
  const summary = summarizeCapitalFormation(buckets, opportunities);
  const funding = summary.reduce((sum, row) => ({ target: sum.target + row.targetAmount, committed: sum.committed + row.committedAmount, funded: sum.funded + row.fundedAmount, weighted: sum.weighted + row.weightedPipelineAmount, gap: sum.gap + row.remainingGap }), { target: 0, committed: 0, funded: 0, weighted: 0, gap: 0 });
  const linkedPaid = recordedRows.filter((row) => allocations.find((allocation) => String(allocation.id) === row.id)?.sourceOpportunityId !== null).reduce((sum, row) => sum + row.paid, 0);
  const selectedAllocation = allocations.find((row) => row.id === selectedId);
  const allocationHasHistory = payments.some((row) => row.allocationId === draft.id);
  const visibleLedger = shownRows.filter((row) => `${row.purpose} ${row.source} ${row.destination} ${row.category}`.toLowerCase().includes(search.toLowerCase()));
  const activeOpportunities = opportunities.filter((row) => row.stage !== "passed" && (path === "all" || row.capitalPath === path));
  const stageData = capitalOpportunityStages.filter((value) => value !== "passed").map((value) => ({ stage: value, name: value.replaceAll("_", " "), count: activeOpportunities.filter((row) => row.stage === value).length }));
  const stageRecords = activeOpportunities.filter((row) => !stage || row.stage === stage);
  const actions = rankCapitalActions(opportunities).slice(0, 5);
  const monthly = useMemo(() => {
    const periods = new Map<string, { month: string; planned: number; paid: number }>();
    if (view === "model") {
      for (const project of portfolioQuery.data?.projects ?? []) {
        if (filter?.dimension === "destination" && filter.name !== project.projectName) continue;
        const scenario = project.scenarios.find((row) => row.scenarioId === project.primaryScenarioId);
        for (const item of scenario?.deploymentSeries ?? []) {
          const key = String(item.monthIndex).padStart(2, "0");
          const row = periods.get(key) ?? { month: `M${item.monthIndex}`, planned: 0, paid: 0 };
          row.planned += item.constructionDeployment ?? 0; periods.set(key, row);
        }
      }
    } else {
      for (const row of shownRows) {
        if (row.month) { const month = periods.get(row.month) ?? { month: row.month, planned: 0, paid: 0 }; month.planned += row.planned; periods.set(row.month, month); }
        for (const payment of payments.filter((payment) => String(payment.allocationId) === row.id && !payment.voided)) {
          const key = payment.paidOn.slice(0, 7), month = periods.get(key) ?? { month: key, planned: 0, paid: 0 }; month.paid += Number(payment.amount); periods.set(key, month);
        }
      }
    }
    return Array.from(periods).sort(([a], [b]) => a.localeCompare(b)).map(([, row]) => row);
  }, [view, portfolioQuery.data, filter, shownRows, payments]);
  const switchView = (next: "model" | "recorded") => { setView(next); setFilter(null); setSelectedId(null); setSearch(""); };
  const editAllocation = (id: number) => {
    const row = allocations.find((item) => item.id === id); if (!row) return;
    setDraft({ id: row.id, sourceOpportunityId: row.sourceOpportunityId?.toString() ?? "", internalProjectId: row.internalProjectId?.toString() ?? "", purpose: row.purpose, category: row.category as DeploymentUse, equipmentName: row.equipmentName ?? "", plannedAmount: row.plannedAmount, committedAmount: row.committedAmount ?? "", plannedMonth: row.plannedMonth ?? "", reference: row.reference ?? "", notes: row.notes ?? "" }); setEditor(true);
  };
  return <div className="capital-flow-dashboard">
    <section className="capital-funding-overview"><div className="capital-flow-title"><div><div className="kicker">CAPITAL · SOURCES & USES</div><h2>Follow the money.</h2><p>Fundraising, project budgets, allocations, and payments in one view.</p></div><button className="capital-primary-action" onClick={() => { switchView("recorded"); setDraft(emptyAllocation); setEditor(true); }}>+ Record allocation</button></div>
      <div className="capital-flow-kpis">{[["Fundraising target", funding.target], ["Committed to raise", funding.committed], ["Funding received", funding.funded], ["Remaining raise", funding.gap]].map(([name, value]) => <article key={String(name)}><span>{name}</span><b>{money(Number(value))}</b></article>)}</div>
      <div className="capital-visual-grid"><article className="capital-chart-panel"><h3>Funding by capital path</h3><p>{money(funding.weighted)} in weighted prospects. Select a capital path to inspect its pipeline.</p><div className="capital-chart"><ResponsiveContainer><BarChart layout="vertical" data={summary.map((row) => ({ ...row, name: capitalPathMeta[row.capitalPath].shortLabel }))} margin={{ left: 10, right: 20 }}><CartesianGrid horizontal={false} /><XAxis type="number" tickFormatter={shortMoney} /><YAxis dataKey="name" type="category" width={80} /><Tooltip formatter={(value) => money(Number(value))} /><Legend /><Bar name="Target" dataKey="targetAmount" fill="#d6dbc9" onClick={(row: any) => setPath(row.capitalPath)} /><Bar name="Committed" dataKey="committedAmount" fill="#a48848" onClick={(row: any) => setPath(row.capitalPath)} /><Bar name="Received" dataKey="fundedAmount" fill="#486b53" onClick={(row: any) => setPath(row.capitalPath)} /><Bar name="Weighted prospects" dataKey="weightedPipelineAmount" fill="#6288a2" onClick={(row: any) => setPath(row.capitalPath)} /></BarChart></ResponsiveContainer></div></article>
        <article className="capital-chart-panel"><div className="capital-panel-heading"><h3>Pipeline stages</h3><select aria-label="Pipeline capital path" value={path} onChange={(event) => { setPath(event.target.value as CapitalPath | "all"); setStage(null); }}><option value="all">All paths</option>{summary.map((row) => <option key={row.capitalPath} value={row.capitalPath}>{capitalPathMeta[row.capitalPath].shortLabel}</option>)}</select></div><p>Click a stage to inspect the underlying opportunities.</p><div className="capital-chart"><ResponsiveContainer><BarChart data={stageData}><CartesianGrid vertical={false} /><XAxis dataKey="name" tick={{ fontSize: 10 }} interval={0} angle={-20} height={55} textAnchor="end" /><YAxis allowDecimals={false} /><Tooltip /><Bar dataKey="count" name="Opportunities" fill="#486b53" onClick={(row: any) => setStage(row.stage)} /></BarChart></ResponsiveContainer></div></article></div>
      <details className="capital-audit"><summary>Inspect {stageRecords.length} opportunities{stage ? ` · ${stage.replaceAll("_", " ")}` : ""}</summary><div className="capital-five-rows">{stageRecords.map((row) => <button key={row.id} className="capital-inspect-row" onClick={() => onOpenPath(row.capitalPath)}><strong>{row.organizationName}</strong><span>{row.stage.replaceAll("_", " ")}</span><b>{money(row.requestedAmount ?? 0)} requested</b><span>Open workspace →</span></button>)}</div>{stage && <button onClick={() => setStage(null)}>Clear stage filter</button>}</details>
    </section>

    <section className="capital-deployment-section" aria-label="Capital deployment">
      <div className="capital-flow-title"><div><div className="kicker">CAPITAL DEPLOYMENT</div><h2>Where capital goes.</h2><p>Follow each dollar through its funding source, destination, and use.</p></div><div className="capital-view-switch" role="group" aria-label="Deployment data view"><button aria-pressed={view === "model"} onClick={() => switchView("model")}>Project model budgets</button><button aria-pressed={view === "recorded"} onClick={() => switchView("recorded")}>Allocations & payments</button></div></div>
      {view === "model" ? <p className="capital-context-note">Estimated budgets from one primary scenario per project. Alternate cases are excluded from this total. These models do not identify funding sources or record payments.</p> : <div className="capital-measure-controls"><span>Show flows by</span>{(["planned", "committed", "paid"] as const).map((value) => <button key={value} aria-pressed={measure === value} onClick={() => setMeasure(value)}>{value === "planned" ? "Planned allocation" : value === "committed" ? "Committed expense" : "Actual payments"}</button>)}</div>}
      {(ledger.error || portfolioQuery.error) && <p role="alert">Unable to load {ledger.error ? "allocation records" : "project budgets"}. {ledger.error?.message ?? portfolioQuery.error?.message}</p>}
      {filter && <div className="capital-active-filter">{filter.dimension}: {filter.name}<button onClick={() => setFilter(null)}>Clear filter ×</button></div>}
      <div className="capital-flow-kpis"><article><span>{view === "model" ? "Modeled uses" : "Planned allocation"}</span><b>{money(totals.planned)}</b></article><article><span>Committed expenses</span><b>{view === "model" ? "Not recorded here" : money(totals.committed)}</b></article><article><span>Actual payments</span><b>{view === "model" ? "Not recorded here" : money(totals.paid)}</b></article><article><span>{view === "model" ? "Project scope" : "Plan less paid"}</span><b>{view === "model" ? `${new Set(shownRows.map((row) => row.destination)).size} projects` : money(totals.planned - totals.paid)}</b></article></div>
      <article className="capital-chart-panel capital-flow-panel"><div className="capital-flow-columns"><span>Funding source</span><span>Project / internal destination</span><span>Use of capital</span></div>{graph.links.length ? <div className="capital-flow-scroll"><div style={{ minWidth: 850, height: Math.max(380, Math.max(...["source", "destination", "category"].map((dimension) => graph.nodes.filter((node) => node.dimension === dimension).length)) * 44) }}><ResponsiveContainer><Sankey data={graph} nodeWidth={12} nodePadding={25} margin={{ top: 20, bottom: 20, left: 190, right: 20 }} node={<FlowNode onSelect={setFilter} />} link={{ stroke: "#799384", strokeOpacity: 0.25 }}><Tooltip formatter={(value) => money(Number(value))} /></Sankey></ResponsiveContainer></div></div> : <ChartEmpty>{ledger.isLoading ? "Loading allocation records…" : `No ${effectiveMeasure === "paid" ? "payments" : effectiveMeasure === "committed" ? "committed expenses" : "allocations"} recorded for this view. Use Record allocation to connect a funding source to a purpose.`}</ChartEmpty>}<p className="capital-chart-footnote">Click a node to filter. The same amount passes through all three columns and is counted once in the total.</p></article>
      <div className="capital-visual-grid"><article className="capital-chart-panel"><h3>Uses of capital</h3><p>Equipment, payroll, insurance, and other purposes.</p>{useGroups.length ? <><div className="capital-chart"><ResponsiveContainer><PieChart><Pie data={useGroups} dataKey="value" nameKey="name" innerRadius="50%" outerRadius="80%" paddingAngle={2} onClick={(row: any) => setFilter({ dimension: "category", name: row.name })}>{useGroups.map((row, index) => <Cell key={row.name} fill={colors[index % colors.length]} />)}</Pie><Tooltip formatter={(value) => money(Number(value))} /></PieChart></ResponsiveContainer></div><div className="capital-chart-legend">{useGroups.map((row, index) => <button key={row.name} onClick={() => setFilter({ dimension: "category", name: row.name })}><i style={{ background: colors[index % colors.length] }} />{row.name}<b>{shortMoney(row.value)}</b></button>)}</div></> : <ChartEmpty>No categorized amounts in this view.</ChartEmpty>}</article>
        <article className="capital-chart-panel"><h3>Project and company allocations</h3><p>An equipment purchase can belong to a project and still count once.</p>{projectGroups.length ? <div style={{ height: Math.max(300, projectGroups.length * 44) }}><ResponsiveContainer><BarChart data={projectGroups} layout="vertical" margin={{ left: 10, right: 20 }}><CartesianGrid horizontal={false} /><XAxis type="number" tickFormatter={shortMoney} /><YAxis type="category" dataKey="name" width={155} tick={{ fontSize: 10 }} /><Tooltip formatter={(value) => money(Number(value))} /><Bar dataKey="value" name={effectiveMeasure} fill="#a48848" onClick={(row: any) => setFilter({ dimension: "destination", name: row.name })} /></BarChart></ResponsiveContainer></div> : <ChartEmpty>Record an allocation against a project or Company operations.</ChartEmpty>}</article></div>
      <article className="capital-chart-panel"><h3>{view === "model" ? "Modeled development spend by relative month" : "Planned spending and actual payments"}</h3><p>{view === "model" ? "Month 1 is each model’s own start; this is not a shared calendar cash forecast. This chart follows project selection; use categories are not split in the stored schedule." : "Planned amounts use their scheduled month; payments use their recorded payment date."}</p>{monthly.length ? <div className="capital-chart"><ResponsiveContainer><LineChart data={monthly}><CartesianGrid vertical={false} /><XAxis dataKey="month" /><YAxis tickFormatter={shortMoney} /><Tooltip formatter={(value) => money(Number(value))} /><Legend /><Line type="linear" dataKey="planned" name={view === "model" ? "Modeled development spend" : "Planned spending"} stroke="#a48848" strokeWidth={3} dot={false} />{view === "recorded" && <Line type="linear" dataKey="paid" name="Actual payments" stroke="#486b53" strokeWidth={3} dot />}</LineChart></ResponsiveContainer></div> : <ChartEmpty>No dated spending schedule recorded. Add a planned month or payment date to see the timeline.</ChartEmpty>}{view === "recorded" && <p className="capital-chart-footnote">Undated plans: {money(shownRows.filter((row) => !row.month).reduce((sum, row) => sum + row.planned, 0))}. Funding received less source-linked payments: {money(funding.funded - linkedPaid)} (workspace total, not a bank balance).</p>}</article>

      {editor && <form className="capital-allocation-form" onSubmit={(event) => { event.preventDefault(); saveAllocation.mutate({ id: draft.id, sourceOpportunityId: draft.sourceOpportunityId ? Number(draft.sourceOpportunityId) : null, internalProjectId: draft.internalProjectId ? Number(draft.internalProjectId) : null, purpose: draft.purpose, category: draft.category, equipmentName: draft.equipmentName || null, plannedAmount: Number(draft.plannedAmount), committedAmount: draft.committedAmount === "" ? null : Number(draft.committedAmount), plannedMonth: draft.plannedMonth || null, reference: draft.reference || null, notes: draft.notes || null }); }}><h3>{draft.id ? "Edit allocation" : "Record a capital allocation"}</h3><div className="capital-form-grid">
        <label>Purpose<input required value={draft.purpose} onChange={(event) => setDraft({ ...draft, purpose: event.target.value })} placeholder="e.g. Stonepine site work or October payroll" /></label>
        <label>Funding source<select disabled={allocationHasHistory} value={draft.sourceOpportunityId} onChange={(event) => setDraft({ ...draft, sourceOpportunityId: event.target.value })}><option value="">Unassigned funding</option>{opportunities.map((row) => <option key={row.id} value={row.id}>{row.organizationName} · {capitalPathMeta[row.capitalPath as CapitalPath].shortLabel} · {row.stage}</option>)}</select></label>
        <label>Destination<select disabled={allocationHasHistory} value={draft.internalProjectId} onChange={(event) => setDraft({ ...draft, internalProjectId: event.target.value })}><option value="">Company operations</option>{projects.map((row) => <option key={row.id} value={row.id}>{row.projectName}</option>)}</select></label>
        <label>Use of capital<select disabled={allocationHasHistory} value={draft.category} onChange={(event) => setDraft({ ...draft, category: event.target.value as DeploymentUse })}>{Object.entries(deploymentUseLabels).map(([key, name]) => <option key={key} value={key}>{name}</option>)}</select></label>
        {draft.category === "equipment" && <label>Equipment / asset<input required disabled={allocationHasHistory} value={draft.equipmentName} onChange={(event) => setDraft({ ...draft, equipmentName: event.target.value })} placeholder="Equipment name or asset ID" /></label>}
        <label>Planned allocation ($)<input required type="number" min="0" step="0.01" value={draft.plannedAmount} onChange={(event) => setDraft({ ...draft, plannedAmount: event.target.value })} /></label>
        <label>Committed expenditure ($)<input type="number" min="0" step="0.01" placeholder="Not recorded" value={draft.committedAmount} onChange={(event) => setDraft({ ...draft, committedAmount: event.target.value })} /></label>
        <label>Planned spending month<input type="month" value={draft.plannedMonth} onChange={(event) => setDraft({ ...draft, plannedMonth: event.target.value })} /></label>
        <label>Budget / contract reference<input value={draft.reference} onChange={(event) => setDraft({ ...draft, reference: event.target.value })} placeholder="Document, contract, or source reference" /></label>
      </div><label>Notes<textarea value={draft.notes} onChange={(event) => setDraft({ ...draft, notes: event.target.value })} /></label><p>Linking an opportunity identifies an intended funding source; its received funding remains as recorded in the fundraising workspace.</p><div className="capital-form-actions"><button className="capital-primary-action" disabled={saveAllocation.isPending || ledger.isError}>Save allocation</button><button type="button" onClick={() => setEditor(false)}>Cancel</button></div></form>}

      <details className="capital-audit" open={view === "recorded"}><summary>{view === "model" ? "Inspect model budget sources" : "Allocation ledger & payment records"} · {shownRows.length} records</summary><input aria-label="Search deployment records" placeholder="Search project, equipment, purpose, or source" value={search} onChange={(event) => setSearch(event.target.value)} /><div className="capital-five-rows">{visibleLedger.map((row) => <button key={row.id} className="capital-inspect-row" onClick={() => { if (view === "recorded") setSelectedId(Number(row.id)); else setFilter({ dimension: "destination", name: row.destination }); }}><div><strong>{row.purpose}</strong><small>{row.source} → {row.destination} → {row.category}</small></div><b>{money(row[effectiveMeasure] ?? 0)}</b>{view === "recorded" && <span>Inspect →</span>}</button>)}{!visibleLedger.length && <p>No allocation records match this view.</p>}</div>
        {selectedAllocation && view === "recorded" && <div className="capital-payment-editor"><div className="capital-panel-heading"><h3>{selectedAllocation.purpose}</h3><button onClick={() => editAllocation(selectedAllocation.id)}>Edit allocation</button></div><p>{selectedAllocation.equipmentName ? `Equipment: ${selectedAllocation.equipmentName}. ` : ""}{selectedAllocation.reference || "No budget reference recorded."}</p>{selectedAllocation.notes && <p>{selectedAllocation.notes}</p>}
          <form key={selectedId} onSubmit={(event) => { event.preventDefault(); recordPayment.mutate({ allocationId: selectedAllocation.id, ...paymentDraft, amount: Number(paymentDraft.amount) }); }}><h4>Record an actual payment</h4><div className="capital-form-grid"><label>Amount paid ($)<input type="number" min="0.01" step="0.01" required value={paymentDraft.amount} onChange={(event) => setPaymentDraft({ ...paymentDraft, amount: event.target.value })} /></label><label>Payment date<input type="date" required value={paymentDraft.paidOn} onChange={(event) => setPaymentDraft({ ...paymentDraft, paidOn: event.target.value })} /></label><label>Invoice / payment reference<input required value={paymentDraft.reference} onChange={(event) => setPaymentDraft({ ...paymentDraft, reference: event.target.value })} /></label></div><button className="capital-primary-action" disabled={recordPayment.isPending}>Record payment</button></form>
          <div className="capital-five-rows">{payments.filter((row) => row.allocationId === selectedId).map((payment) => <div className="capital-inspect-row" key={payment.id}><strong>{money(Number(payment.amount))}{payment.voided ? " · Voided" : ""}</strong><span>{payment.paidOn}</span><span>{payment.reference}</span><button disabled={voidPayment.isPending} onClick={() => voidPayment.mutate({ id: payment.id, voided: !payment.voided })}>{payment.voided ? "Restore" : "Void entry"}</button></div>)}</div>
        </div>}
      </details>
    </section>
    <section className="capital-chart-panel"><h3>Next capital actions</h3>{actions.length ? actions.map((action: any) => <button className="capital-inspect-row" key={action.id} onClick={() => onOpenPath(action.capitalPath)}><strong>{action.nextAction}</strong><span>{action.organizationName}</span><b>{action.urgency === 2 ? "Overdue" : action.urgency === 1 ? "Due soon" : "Open"}</b></button>) : <p>Add next actions in a capital workspace to bring upcoming and overdue work here.</p>}</section>
  </div>;
}

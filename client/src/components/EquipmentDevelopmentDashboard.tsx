import { useEffect, useState } from "react";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ComposedChart, Line } from "recharts";
import { trpc } from "@/lib/trpc";
import { equipmentLineBudget, equipmentPlanTotals, equipmentMonthlyPlan, strategyLabels, type EquipmentPlanItem } from "@shared/equipmentPlan";
import "./EquipmentDevelopmentDashboard.css";

const usd = (n: number) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);
const compact = (n: number) => n >= 1e6 ? `$${(n / 1e6).toFixed(1)}M` : n >= 1000 ? `$${Math.round(n / 1000)}K` : `$${n}`;
const colors = { finance: "#a48742", rent: "#648a9e", contractor: "#777e77" };

export function EquipmentDevelopmentDashboard() {
  const query = trpc.equipmentPlanning.list.useQuery();
  const utils = trpc.useUtils();
  const [projectId, setProjectId] = useState<number | null>(null);
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const [editing, setEditing] = useState<EquipmentPlanItem | null>(null);
  const [editRevision, setEditRevision] = useState(0);
  const [reason, setReason] = useState("");
  const [message, setMessage] = useState("");
  const plans = query.data ?? [];
  const selected = plans.find(p => p.projectId === projectId) ?? plans[0];
  const history = trpc.equipmentPlanning.history.useQuery({ planId: selected?.id ?? 0 }, { enabled: !!selected });
  const save = trpc.equipmentPlanning.update.useMutation({
    onSuccess: async () => {
      setEditing(null); setMessage("Planning revision saved. No purchase, rental booking or financing commitment created.");
      await Promise.all([utils.equipmentPlanning.list.invalidate(), utils.equipmentPlanning.history.invalidate()]);
    }, onError: error => setMessage(error.message),
  });
  useEffect(() => { setPage(0); setEditing(null); setMessage(""); }, [projectId, filter, search]);
  if (query.isLoading) return <section className="equipment-development"><p>Loading saved equipment plans…</p></section>;
  if (query.error) return <section className="equipment-development" role="alert"><h2>Equipment plans could not load</h2><p>{query.error.message}</p><button onClick={() => query.refetch()}>Retry</button></section>;
  if (!selected) return <section className="equipment-development"><h2>No development equipment plans recorded</h2><p>Project-scoped planning records have not been initialized in this workspace.</p></section>;
  const totals = equipmentPlanTotals(selected.plan.items);
  const projectBars = plans.map(p => ({ name: p.projectName.startsWith("Chappell") ? "Chappell factory" : "Stonepine homes", projectId: p.projectId, ...equipmentPlanTotals(p.plan.items) }));
  const categories = Array.from(new Set(selected.plan.items.map(i => i.category))).map(name => ({ name, ...equipmentPlanTotals(selected.plan.items.filter(i => i.category === name)) })).filter(c => c.finance || c.rent);
  const monthly = equipmentMonthlyPlan(selected.plan.items);
  const rows = selected.plan.items.filter(i => (filter === "all" || i.strategy === filter) && `${i.name} ${i.category} ${i.specification}`.toLowerCase().includes(search.toLowerCase()));
  const pageCount = Math.max(1, Math.ceil(rows.length / 5));
  const currentPage = Math.min(page, pageCount - 1);
  const display = rows.slice(currentPage * 5, currentPage * 5 + 5);
  const caption = (strategy: string) => selected.plan.items.filter(i => i.strategy === strategy).length;
  return <section className="equipment-development" aria-label="Development equipment planning">
    <header className="ed-heading"><div><div className="kicker">PROJECT EQUIPMENT · WORKING PLAN</div><h2>Build the projects. Equip the factory.</h2><p>Finance durable assets, rent temporary capacity, and keep contractor-provided plant visible.</p></div><span className="ed-estimate">ESTIMATED · NOT ORDERED</span></header>
    <div className="ed-projects" aria-label="Select equipment project">{plans.map(p => {
      const t = equipmentPlanTotals(p.plan.items);
      return <button type="button" key={p.id} aria-pressed={selected.id === p.id} className={selected.id === p.id ? "active" : ""} onClick={() => setProjectId(p.projectId)}><b>{p.projectName}</b><span>{p.plan.items.length} scope packages · {usd(t.finance + t.rent)} priced base scope</span><small>{t.contractorPackages} contractor packages still to price</small></button>;
    })}</div>
    <p className="ed-scope">{selected.plan.scope}</p>
    <div className="ed-metrics">
      <article><span>Finance candidates</span><strong>{usd(totals.finance)}</strong><small>{caption("finance")} packages · gross acquisition value, not loan principal</small></article>
      <article><span>Rental base allowance</span><strong>{usd(totals.rent)}</strong><small>{caption("rent")} packages · over proposed equipment windows</small></article>
      <article><span>Contractor supplied</span><strong>{totals.contractorPackages} packages</strong><small>Unpriced · excluded from equipment subtotal, not zero-cost</small></article>
      <article><span>Procurement status</span><strong>Planning</strong><small>Rates, engineering, quantities and delivery dates need validation</small></article>
    </div>
    <div className="ed-charts">
      <article><h3>Project → acquisition strategy</h3><p>Full asset purchase value versus rental-period cost. Click a project bar to explore.</p>
        <div className="ed-chart" role="img" aria-label={projectBars.map(p => `${p.name}: acquisition ${usd(p.finance)}, rental ${usd(p.rent)}`).join("; ")}>
          <ResponsiveContainer width="100%" height="100%"><BarChart data={projectBars} layout="vertical" margin={{ left: 4, right: 24, top: 16, bottom: 12 }}>
            <CartesianGrid strokeDasharray="3 3" horizontal={false}/><XAxis type="number" tickFormatter={compact}/><YAxis type="category" dataKey="name" width={112}/><Tooltip formatter={(v: number) => usd(v)}/><Legend/>
            <Bar dataKey="finance" name="Finance candidates" stackId="a" fill={colors.finance} maxBarSize={46} onClick={(d: any) => setProjectId(d.projectId)}/><Bar dataKey="rent" name="Rental allowance" stackId="a" fill={colors.rent} maxBarSize={46} onClick={(d: any) => setProjectId(d.projectId)}/>
          </BarChart></ResponsiveContainer>
        </div>
      </article>
      <article><h3>What the equipment supports</h3><p>{selected.projectName} · priced scope by workstream</p>
        <div className="ed-chart" role="img" aria-label="Equipment budget by category; detailed values in scope cards below">
          <ResponsiveContainer width="100%" height="100%"><BarChart data={categories} layout="vertical" margin={{ left: 4, right: 16, top: 8, bottom: 12 }}>
            <CartesianGrid strokeDasharray="3 3" horizontal={false}/><XAxis type="number" tickFormatter={compact}/><YAxis type="category" dataKey="name" width={120} tick={{ fontSize: 12 }}/><Tooltip formatter={(v: number) => usd(v)}/><Legend/>
            <Bar dataKey="finance" name="Finance candidates" stackId="a" fill={colors.finance}/><Bar dataKey="rent" name="Rental allowance" stackId="a" fill={colors.rent}/>
          </BarChart></ResponsiveContainer>
        </div>
      </article>
    </div>
    <article className="ed-schedule"><h3>36-month equipment budget timing</h3><p>Acquisition allowances occur at the proposed first-use month; rental allowances repeat through the off-rent month. This is not a loan-payment or approved draw schedule.</p>
      <div className="ed-chart" role="img" aria-label="36-month acquisition and rental budget timing in dollars">
        <ResponsiveContainer width="100%" height="100%"><ComposedChart data={monthly} margin={{ left: 12, right: 24, top: 12, bottom: 12 }}>
          <CartesianGrid strokeDasharray="3 3"/><XAxis dataKey="month" tickFormatter={v => `M${v}`} interval={2}/><YAxis tickFormatter={compact} width={78}/><Tooltip labelFormatter={v => `Planning month ${v}`} formatter={(v: number) => usd(v)}/><Legend/>
          <Bar dataKey="acquisition" name="Gross acquisition allowance" fill={colors.finance}/><Line type="stepAfter" dataKey="rental" name="Rental base allowance" stroke={colors.rent} strokeWidth={3} dot={false}/>
        </ComposedChart></ResponsiveContainer>
      </div>
    </article>
    <div className="ed-notice"><b>Before treating this as a funding requirement</b><p>Confirm existing fleet, contractor inclusions, OEM specifications and delivered quotes. Priced scope excludes taxes, freight, installation, operators, fuel, insurance and finance charges. It has not been added to project budgets, capital campaigns or commitments.</p></div>
    <section className="ed-detail"><div className="ed-detail-heading"><div><h3>Equipment scope & decisions</h3><p>Five packages at a time · select a package to revise its planning assumptions.</p></div><label>Search scope<input value={search} onChange={e => setSearch(e.target.value)} placeholder="Equipment, category or specification"/></label></div>
      <div className="ed-filters" aria-label="Filter procurement strategy">{["all", "finance", "rent", "contractor"].map(s => <button type="button" key={s} aria-pressed={filter === s} className={filter === s ? "active" : ""} onClick={() => setFilter(s)}>{s === "all" ? "All scope" : strategyLabels[s as EquipmentPlanItem["strategy"]]}</button>)}</div>
      {display.map(i => <article key={i.key} className="ed-equipment-card" style={{ borderLeftColor: colors[i.strategy] }}>
        <div className="ed-line-heading"><div><small>{i.category} · {strategyLabels[i.strategy]}</small><h4>{i.name}</h4></div><strong>{equipmentLineBudget(i) === null ? "Bid required" : usd(equipmentLineBudget(i)!)}</strong></div>
        <p>{i.quantity} {i.quantity === 1 ? "unit / package" : "units / packages"} · M{i.startMonth}–M{i.endMonth} ({i.endMonth - i.startMonth + 1} months){i.strategy === "rent" ? ` · ${usd(i.unitMonthlyRent!)} / unit / planning month` : i.strategy === "finance" ? ` · ${usd(i.unitPurchase!)} / unit` : " · cost resides in trade package"}</p>
        <div className="ed-month-track" aria-label={`Use window month ${i.startMonth} through ${i.endMonth}`}><span style={{ left: `${(i.startMonth - 1) / 36 * 100}%`, width: `${(i.endMonth - i.startMonth + 1) / 36 * 100}%`, background: colors[i.strategy] }}/></div>
        <p>{i.reason}</p>
        <details><summary>Specification & cost basis</summary><p>{i.specification}</p><p>{i.basis}</p>{i.sourceUrl && <a href={i.sourceUrl} target="_blank" rel="noreferrer">Open reference source</a>}</details>
        <button type="button" onClick={() => { setEditing({ ...i }); setEditRevision(selected.revision); setReason(""); setMessage(""); }}>Revise planning line</button>
      </article>)}
      {!rows.length && <p>No equipment matches these filters.</p>}
      <div className="ed-pagination"><span>{rows.length ? currentPage * 5 + 1 : 0}–{Math.min((currentPage + 1) * 5, rows.length)} of {rows.length} packages</span><button type="button" disabled={currentPage === 0} onClick={() => setPage(currentPage - 1)}>Previous</button><span>Page {currentPage + 1} of {pageCount}</span><button type="button" disabled={currentPage + 1 >= pageCount} onClick={() => setPage(currentPage + 1)}>Next</button></div>
      {editing && <form className="ed-editor" onSubmit={e => { e.preventDefault(); save.mutate({ id: selected.id, revision: editRevision, item: editing, reason }); }}>
        <h3>Revise: {editing.name}</h3><p>Changes remain estimates and are saved with your reason and a full revision snapshot.</p>
        <div className="ed-inputs">
          <label>Proposed strategy<select value={editing.strategy} onChange={e => setEditing({ ...editing, strategy: e.target.value as EquipmentPlanItem["strategy"] })}>{Object.entries(strategyLabels).map(([v, label]) => <option key={v} value={v}>{label}</option>)}</select></label>
          <label>Quantity<input required type="number" min="1" max="1000" step="1" value={editing.quantity} onChange={e => setEditing({ ...editing, quantity: Number(e.target.value) })}/></label>
          <label>First-use month<input required type="number" min="1" max="36" step="1" value={editing.startMonth} onChange={e => setEditing({ ...editing, startMonth: Number(e.target.value) })}/></label>
          <label>Last-use month<input required type="number" min={editing.startMonth} max="36" step="1" value={editing.endMonth} onChange={e => setEditing({ ...editing, endMonth: Number(e.target.value) })}/></label>
          {editing.strategy !== "contractor" && <label>{editing.strategy === "finance" ? "Purchase allowance per unit ($)" : "Rental allowance per unit per month ($)"}<input required type="number" min="0" max="100000000" step="0.01" value={(editing.strategy === "finance" ? editing.unitPurchase : editing.unitMonthlyRent) ?? ""} onChange={e => setEditing({ ...editing, [editing.strategy === "finance" ? "unitPurchase" : "unitMonthlyRent"]: e.target.value === "" ? null : Number(e.target.value) })}/></label>}
        </div>
        <label>Reason for revision<textarea required minLength={5} maxLength={2000} value={reason} onChange={e => setReason(e.target.value)}/></label>
        <button disabled={save.isPending} type="submit">{save.isPending ? "Saving…" : "Save planning revision"}</button><button type="button" disabled={save.isPending} onClick={() => setEditing(null)}>Cancel</button>
      </form>}
      {message && <p role="status">{message}</p>}
    </section>
    <details className="ed-basis"><summary>Scope assumptions, boundaries & revision log · revision {selected.revision}</summary>
      <ul>{selected.plan.assumptions.map(a => <li key={a}>{a}</li>)}</ul>
      <p>General rental-contract reference: <a href="https://www.sunbeltrentals.com/legal/terms-and-conditions/us/" target="_blank" rel="noreferrer">Sunbelt billing, shift limits and excluded charges</a> (reviewed October 7, 2026). Supplier-specific quote governs.</p>
      <h4>Latest 20 revisions</h4>{history.isLoading ? <p>Loading revision history…</p> : history.error ? <p role="alert">Revision history could not load.</p> : <ol>{history.data?.map(h => <li key={h.revision}>Revision {h.revision} · {h.actor} · {new Date(h.createdAt).toLocaleString()}<p>{h.reason}</p></li>)}</ol>}
    </details>
  </section>;
}

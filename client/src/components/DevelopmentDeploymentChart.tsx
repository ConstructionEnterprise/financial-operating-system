import { useMemo, useState } from "react";
import { Bar, CartesianGrid, ComposedChart, Line, XAxis, YAxis, Tooltip } from "recharts";
import { ChartContainer } from "@/components/ui/chart";
import { deploymentMonths, deploymentPeriods, deploymentCategories, deploymentLabels, type DeploymentEvidence, type DeploymentSchedule } from "../../../shared/deploymentChart";
import "./DevelopmentDeploymentChart.css";

const colors = ["#a98a48", "#476c57", "#608da7", "#88739d", "#c89d59", "#7b8981", "#aaa69b"];
const money = (n: number | null) => n === null ? "Not recorded" : new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);
const shortMoney = (n: number) => `$${(n / 1e6).toLocaleString("en-US", { maximumFractionDigits: 2 })}M`;
export function DevelopmentDeploymentChart({ schedule, evidence = [] }: { schedule: DeploymentSchedule[]; evidence?: DeploymentEvidence[] }) {
  const [mode, setMode] = useState("monthly");
  const [quarterly, setQuarterly] = useState(false);
  const [coverage, setCoverage] = useState(false);
  const [selected, setSelected] = useState("");
  const months = useMemo(() => deploymentMonths(schedule ?? [], evidence), [schedule, evidence]);
  const periods = useMemo(() => deploymentPeriods(months, quarterly, mode === "cumulative"), [months, quarterly, mode]);
  const categories = deploymentCategories.filter(k => months.some(m => m.values[k] !== 0));
  const total = months.reduce((sum, m) => sum + (m.total ?? 0), 0);
  const peak = months.filter(m => m.total !== null).reduce<(typeof months)[number] | null>((best, m) => !best || m.total! > best.total! ? m : best, null);
  const detail = periods.find(p => p.label === selected);
  const fundingMissing = months.filter(m => m.funding === null).length;
  const bands: { phase: string; start: string; end: string; count: number }[] = [];
  periods.forEach(p => {
    const phase = Array.from(new Set(p.months.flatMap(m => m.phases))).map(s => s.replaceAll("_", " ")).join(" / ") || "Phase not recorded";
    const last = bands[bands.length - 1];
    if (last?.phase === phase) { last.end = p.label; last.count++; }
    else bands.push({ phase, start: p.label, end: p.label, count: 1 });
  });
  const incomplete = months.some(m => m.total === null);
  const config = Object.fromEntries(deploymentCategories.map((k, i) => [k, { label: deploymentLabels[k], color: colors[i] }]));
  if (!months.length) return <p>No stored deployment schedule or monthly deployment records.</p>;
  return <section className="deployment-detail" aria-label="Development spending analysis">
    <div className="deployment-kpis"><div><span>{incomplete ? "Known deployment (incomplete)" : "Total planned / recorded deployment"}</span><strong>{money(total)}</strong></div><div><span>Peak spending month{incomplete ? " (known months)" : ""}</span><strong>{peak ? `Month ${peak.month}` : "Not recorded"}</strong></div><div><span>Peak monthly requirement</span><strong>{money(peak?.total ?? null)}</strong></div></div>
    <div className="deployment-toolbar"><label>View<select value={mode} onChange={e => setMode(e.target.value)}><option value="monthly">Period spending</option><option value="cumulative">Cumulative spending</option></select></label><label>Interval<select value={quarterly ? "quarterly" : "monthly"} onChange={e => { setQuarterly(e.target.value === "quarterly"); setSelected(""); }}><option value="monthly">Monthly</option><option value="quarterly">Quarterly</option></select></label><label><input type="checkbox" checked={coverage} onChange={e => setCoverage(e.target.checked)} /> Funding coverage</label><label>Inspect period<select value={selected} onChange={e => setSelected(e.target.value)}><option value="">Choose a period</option>{periods.map(p => <option key={p.label}>{p.label}</option>)}</select></label></div>
    <p className="deployment-note">Categorized monthly records take precedence over schedule estimates, without adding both. Gray bars are schedule-only amounts without a recorded category breakdown. {incomplete && "Some spending months are missing; cumulative totals stop at the first gap."}</p>
    {coverage && <p className="deployment-coverage" role="status">Funding is from stored monthly funding-draw entries; projected/estimated entries are not receipts, approvals or available cash. Opening cash is not included. {fundingMissing ? `${fundingMissing} months have no funding entry: coverage is incomplete; missing entries are not treated as zero.` : "Red shows the cumulative spending shortfall against the entered draw schedule."}</p>}
    <ChartContainer config={config} className="deployment-chart" style={{ height: 400, width: "100%", aspectRatio: "auto" }}><ComposedChart accessibilityLayer data={periods} margin={{ top: 16, right: 20, bottom: 8, left: 12 }} onClick={(state: any) => { if (state?.activeLabel) setSelected(String(state.activeLabel)); }}>
      <CartesianGrid vertical={false} strokeOpacity={.25} /><XAxis dataKey="label" minTickGap={18} /><YAxis tickFormatter={shortMoney} width={70} />
      <Tooltip content={({ active, payload }: any) => { const p = payload?.[0]?.payload; if (!active || !p) return null; return <div className="deployment-tooltip"><b>{p.label} · {mode === "cumulative" ? "Cumulative through period" : "Period spending"}</b><div>Total: {money(p.total)}</div>{categories.map(k => <div key={k}>{deploymentLabels[k]}: {money(p[k])}</div>)}<small>Evidence: {Array.from(new Set(p.months.map((m: any) => m.basis))).join(" / ")}</small>{coverage && <><div>Funding entries: {money(p.funding)}</div><div>Cumulative shortfall: {money(p.gap)}</div></>}</div>; }} />
      {categories.map(k => <Bar key={k} dataKey={k} name={deploymentLabels[k]} stackId="spending" fill={config[k].color} maxBarSize={34} />)}
      {coverage && <Line type="stepAfter" dataKey="funding" name="Entered funding draws" stroke="#2166ac" strokeWidth={3} dot={false} connectNulls={false} />}
      {coverage && <Line type="stepAfter" dataKey="gap" name="Cumulative shortfall" stroke="#b64438" strokeWidth={2} strokeDasharray="5 3" dot={false} connectNulls={false} />}
    </ComposedChart></ChartContainer>
    <div className="deployment-legend">{categories.map(k => <span key={k}><i style={{ background: config[k].color }} />{deploymentLabels[k]}</span>)}{coverage && <><span><i style={{ background: "#2166ac" }} />Funding draws</span><span><i style={{ background: "#b64438" }} />Cumulative shortfall</span></>}</div>
    <div className="deployment-phases" aria-label="Recorded delivery phases">{bands.map(b => <button key={b.start} style={{ flex: b.count }} onClick={() => setSelected(b.start)} title={`${b.start}–${b.end}: ${b.phase}`}><b>{b.start}{b.start !== b.end ? `–${b.end}` : ""}</b><span>{b.phase}</span></button>)}</div>
    {detail && <div className="deployment-record-detail"><h4>{detail.label} — underlying period records</h4><p>These are period records, even when the chart shows cumulative totals. Signed capital-deployment amounts are inverted for spending; positive corrections reduce spending.</p>{detail.months.map(m => <article key={m.month}><h5>Month {m.month} · {money(m.total)} · {m.basis}</h5><p>Schedule estimate: {money(m.scheduleAmount)}. {m.scheduleAmount !== null && m.total !== null && m.scheduleAmount !== m.total ? `Difference from categorized records: ${money(m.total - m.scheduleAmount)}.` : ""}</p>{m.records.length ? <ul>{m.records.map(r => <li key={r.id}>Record #{r.id} · {r.metricCategory.replaceAll("_", " ")} · {r.deploymentCategory?.replaceAll("_", " ") || "No category"} · signed {money(r.amount)} · {r.dataState} · {r.phase.replaceAll("_", " ")}<small>{r.sourceReference || "Source not recorded"}</small></li>)}</ul> : <p>Schedule-only estimate; no underlying monthly deployment/funding entries.</p>}</article>)}</div>}
  </section>;
}

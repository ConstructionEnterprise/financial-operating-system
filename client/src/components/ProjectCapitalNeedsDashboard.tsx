import { useState } from "react";
import { Bar, BarChart, CartesianGrid, Cell, ComposedChart, Legend, Line, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { trpc } from "@/lib/trpc";
import { formatCapitalAmount } from "../../../shared/capitalFormation";
import { ProjectTenureSummary } from "./ProjectTenureSummary";

type Scenario = { id: number; scenarioName: string; scenarioType: string; scenarioStatus: string };
type Assumption = { scenarioId: number; metric: string; value: number | null; sourceReference: string | null; effectiveAt: Date | string | null };
const palette = ["#41684c", "#bc9451", "#537c9c", "#9a715d", "#8d87ac", "#719993", "#b87f7f", "#738d58"];
const millions = (value: number) => `$${Number((value / 1_000_000).toFixed(1))}M`;
const chartMoney = (value: unknown) => formatCapitalAmount(Number(value));

export function ProjectCapitalNeedsDashboard({ project, scenarios, assumptions, currentRequirement }: {
  project: { projectName: string; programUnitCount?: number | null };
  scenarios: Scenario[];
  assumptions: Assumption[];
  currentRequirement: number | null | undefined;
}) {
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const cases = scenarios.filter((scenario) => scenario.scenarioStatus === "active" && (project.projectName !== "Stonepine Residences" || scenario.scenarioName.startsWith("Current Underwriting — All-In Cost")))
    .map((scenario) => {
      const values = assumptions.filter((item) => item.scenarioId === scenario.id);
      const metric = (name: string) => values.find((item) => item.metric === name)?.value ?? null;
      const costInput = values.find((item) => item.metric === "development_cost" || item.metric === "total_cost");
      return { scenario, cost: costInput?.value ?? null, costPerSf: metric("all_in_development_cost_per_sf") ?? metric("development_cost_per_gross_sf"), units: metric("program_units"), averageSf: metric("average_home_sq_ft"), totalSf: metric("program_residential_sf") ?? metric("program_gross_sf"), source: costInput?.sourceReference, effectiveAt: costInput?.effectiveAt };
    }).filter((item) => item.cost !== null)
    .sort((a, b) => (a.cost ?? 0) - (b.cost ?? 0));
  const selected = cases.find((item) => item.scenario.id === selectedId) ?? cases.find((item) => item.scenario.scenarioType === "base") ?? cases[0];
  const { data: wbs, isLoading: allocationLoading, isError: allocationError } = trpc.fundraising.projectPlanningWbsSummary.useQuery({ scenarioId: selected?.scenario.id ?? 0 }, { enabled: Boolean(selected?.scenario.id) });
  const { data: monthlyLines = [], isLoading: scheduleLoading, isError: scheduleError } = trpc.fundraising.projectionMonthlyLines.useQuery({ scenarioId: selected?.scenario.id ?? 0 }, { enabled: Boolean(selected?.scenario.id) });
  const comparison = cases.map((item) => ({ name: item.scenario.scenarioName.includes("Rentals") ? `$${item.costPerSf}/SF · ${item.scenario.scenarioName.match(/(\d+)% Rentals/)?.[1]}% rental` : item.scenario.scenarioName.replace(/^.*? — /, "").replace(/ \(\$.*$/, "").slice(0, 18), cost: item.cost, id: item.scenario.id }));
  const allocationGroups = new Map<string, number>();
  for (const line of wbs?.lines ?? []) {
    const category = wbs!.lineCount <= 8 ? line.description : line.notes?.match(/Standardized WBS category:\s*([^;.|]+)/i)?.[1]?.trim().replaceAll("_", " ") || line.costCategory.replaceAll("_", " ");
    allocationGroups.set(category, (allocationGroups.get(category) ?? 0) + line.allocatedAmount);
  }
  const allocation = Array.from(allocationGroups, ([name, value]) => ({ name, value }));
  const deployment = monthlyLines.filter((line) => line.metricCategory === "capital_deployment");
  let cumulative = 0;
  let cumulativeComplete = true;
  const schedule = deployment.length ? Array.from({ length: Math.max(...deployment.map((line) => line.monthIndex)) }, (_, index) => {
    const rows = deployment.filter((line) => line.monthIndex === index + 1);
    const spend = rows.length && rows.every((line) => line.amount != null) ? -rows.reduce((sum, line) => sum + (line.amount ?? 0), 0) : null;
    if (spend === null) cumulativeComplete = false;
    else cumulative += spend;
    return { month: index + 1, spend, cumulative: cumulativeComplete ? cumulative : null };
  }) : [];

  if (!cases.length) return <section className="stonepine-case-panel"><h3>{project.projectName} model charts</h3><p>No populated planning scenario is available for this project yet.</p></section>;

  return <section className="stonepine-case-panel" aria-label={`${project.projectName} planning scenarios`}>
    <div className="kicker">{project.projectName === "Stonepine Residences" ? "CURRENT UNDERWRITING · 200-HOME SCOPE" : "STORED PROJECT PLANNING MODEL"}</div>
    <h3>{project.projectName} cost dashboard</h3>
    <p>Compare the stored planning cases, inspect how the selected cost is allocated, and follow its monthly deployment. Case names follow the source material; the bar chart orders them by cost.</p>
    <div className="stonepine-case-choices" role="group" aria-label={`${project.projectName} planning case`}>
      {cases.map((item) => <button key={item.scenario.id} type="button" aria-pressed={selected?.scenario.id === item.scenario.id} className={selected?.scenario.id === item.scenario.id ? "active" : ""} onClick={() => setSelectedId(item.scenario.id)}>
        <span>{item.scenario.scenarioName}</span><strong>{formatCapitalAmount(item.cost!)}</strong><b>{item.costPerSf == null ? "Estimated planning case" : `$${item.costPerSf}/SF · estimated`}</b>
      </button>)}
    </div>
    {selected && <div className="stonepine-case-detail">
      <div><span>Selected estimated development cost</span><strong>{formatCapitalAmount(selected.cost!)}</strong></div>
      <div><span>Program units</span><strong>{selected.units?.toLocaleString() ?? "Not recorded"}</strong></div>
      <div><span>{selected.averageSf ? "Average size × units" : "Modeled area"}</span><strong>{selected.averageSf ? `${selected.averageSf.toLocaleString()} SF × ${selected.units?.toLocaleString() ?? "—"}` : selected.totalSf ? `${selected.totalSf.toLocaleString()} SF` : "Not recorded"}</strong></div>
      <p>Source: {selected.source || "Not recorded"}{selected.effectiveAt ? ` · ${new Date(selected.effectiveAt).toLocaleDateString("en-US", { timeZone: "UTC" })}` : " · effective date not recorded"}. These cost allocations are part of the selected planning total.</p>
    </div>}
    {selected && <ProjectTenureSummary assumptions={assumptions.filter((item) => item.scenarioId === selected.scenario.id)} />}
    <div className="stonepine-chart-grid">
      <article className="stonepine-chart-card">
        <h4>Development cost by scenario</h4><p>Select a case above to update the allocation and spending charts.</p>
        <div style={{ height: 280, width: "100%", minWidth: 0 }}>
          <ResponsiveContainer width="100%" height="100%"><BarChart data={comparison} margin={{ top: 20, right: 16, bottom: 8, left: 8 }} accessibilityLayer>
            <CartesianGrid vertical={false} stroke="#e0e6dc" /><XAxis dataKey="name" tickLine={false} /><YAxis tickFormatter={millions} width={65} tickLine={false} />
            <Tooltip formatter={chartMoney} /><Bar dataKey="cost" name="Development cost" radius={[6, 6, 0, 0]} maxBarSize={85}>{comparison.map((item) => <Cell key={item.id} fill={item.id === selected?.scenario.id ? "#41684c" : "#b8c9b5"} />)}</Bar>
          </BarChart></ResponsiveContainer>
        </div>
      </article>
      <article className="stonepine-chart-card">
        <h4>Where the development budget goes</h4><p>Preliminary allocations within the selected case.</p>
        {allocation.length ? <>
          <div style={{ height: 245, width: "100%", minWidth: 0 }}><ResponsiveContainer width="100%" height="100%"><PieChart>
            <Pie data={allocation} dataKey="value" nameKey="name" innerRadius="48%" outerRadius="80%" paddingAngle={2}>{allocation.map((item, index) => <Cell key={`${item.name}-${index}`} fill={palette[index % palette.length]} />)}</Pie><Tooltip formatter={chartMoney} />
          </PieChart></ResponsiveContainer></div>
          <div className="stonepine-chart-legend">{allocation.map((item, index) => <div key={`${item.name}-${index}`}><i style={{ background: palette[index % palette.length] }} /><span>{item.name}</span><b>{wbs?.total ? `${(item.value / wbs.total * 100).toFixed(1)}%` : "—"}</b></div>)}</div>
          <small>{wbs?.total === selected?.cost ? "Allocation reconciles to selected cost." : "Allocation differs from the selected cost; review the source rows."}</small>
        </> : <p className="stonepine-chart-empty">{allocationError ? "The cost allocation could not be loaded." : allocationLoading ? "Loading the cost allocation…" : "No allocation recorded for this case yet."}</p>}
      </article>
      <article className="stonepine-chart-card stonepine-chart-wide">
        <h4>Monthly spend and cumulative deployment</h4><p>Estimated development spending over the recorded schedule. Hover to inspect each month.</p>
        {schedule.length ? <div style={{ height: 330, width: "100%", minWidth: 0 }}><ResponsiveContainer width="100%" height="100%"><ComposedChart data={schedule} margin={{ top: 20, right: 8, bottom: 8, left: 8 }} accessibilityLayer>
          <CartesianGrid vertical={false} stroke="#e0e6dc" /><XAxis dataKey="month" tickFormatter={(month) => `M${month}`} minTickGap={22} tickLine={false} />
          <YAxis yAxisId="monthly" tickFormatter={millions} width={65} /><YAxis yAxisId="cumulative" orientation="right" tickFormatter={millions} width={70} />
          <Tooltip formatter={chartMoney} labelFormatter={(month) => `Month ${month}`} /><Legend />
          <Bar yAxisId="monthly" dataKey="spend" name="Monthly spend · left axis" fill="#bc9451" radius={[3, 3, 0, 0]} />
          <Line yAxisId="cumulative" dataKey="cumulative" name="Cumulative spend · right axis" stroke="#41684c" strokeWidth={3} dot={false} connectNulls={false} />
        </ComposedChart></ResponsiveContainer></div> : <p className="stonepine-chart-empty">{scheduleError ? "The spending schedule could not be loaded." : scheduleLoading ? "Loading the spending schedule…" : "No monthly spending schedule recorded for this case yet."}</p>}
      </article>
    </div>
    {wbs && wbs.lineCount > 0 && <details className="stonepine-source-detail"><summary>View allocation amounts and source rows</summary><div className="stonepine-wbs">{wbs.lines.map((line) => <div key={line.id}><span>{line.description}</span><strong>{formatCapitalAmount(line.allocatedAmount)}</strong></div>)}</div></details>}
    <p className="stonepine-case-boundary">The Capital Stack currently uses a recorded requirement of {currentRequirement == null ? "not yet recorded" : formatCapitalAmount(currentRequirement)}. Selecting another case is a comparison only; it does not change that requirement, create a financing request, or record committed or funded capital.</p>
  </section>;
}

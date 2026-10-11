import { useState } from "react";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { ProjectFinancialModelVisuals } from "./FinancialPortfolioVisuals";
import { Button } from "./ui/button";
import "./ProjectDashboardSummary.css";
import "./ProjectDashboardSummaryEnhancements.css";

const money = (value: number) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(value);

export function ProjectDashboardSummary(props: any) {
  return <ProjectDashboardBody key={props.project?.id ?? "none"} {...props} />;
}

function ProjectDashboardBody({ project, model, loading, error, capitalStack, onOpenRoi, onOpenFunding }: any) {
  const [scenarioId, setScenarioId] = useState<number | null>(null);
  if (!project) return <p>Select a project to see its dashboard.</p>;
  const scenarios = model?.scenarios ?? [];
  const active = scenarios.find((item: any) => item.scenarioId === scenarioId)
    ?? scenarios.find((item: any) => item.scenarioId === model?.primaryScenarioId)
    ?? scenarios[0];
  const isApartmentProject = /multifamily|apartment/i.test(project.projectType ?? "");
  const apartmentColors = ["#486b53", "#789c83", "#a48848", "#7896a4", "#8a749d"];
  const recordedMix = isApartmentProject
    ? (active?.unitMix ?? []).filter((item: any) => Number(item.unitCount) > 0).map((item: any, index: number) => ({ name: item.unitType, value: Number(item.unitCount), color: apartmentColors[index % apartmentColors.length] }))
    : active ? [
      { name: "Units for sale", value: active.saleUnits, color: "#a48848" },
      { name: "Units retained for rent", value: active.rentalUnits, color: "#486b53" },
    ].filter((item) => typeof item.value === "number" && item.value > 0) : [];
  const allocatedUnits = recordedMix.reduce((sum, item) => sum + item.value, 0);
  const scenarioUnits = typeof active?.unitCount === "number" && active.unitCount > 0 ? active.unitCount : null;
  const unassignedUnits = scenarioUnits === null ? 0 : Math.max(0, scenarioUnits - allocatedUnits);
  const mix = [...recordedMix, ...(unassignedUnits > 0 ? [{ name: isApartmentProject ? "Unit type not assigned" : "Sale/rental status not assigned", value: unassignedUnits, color: "#c8d0c5" }] : [])];
  // Preserve the recorded program count unless the saved allocations exceed it.
  // In that case size the donut to its actual slices and flag the mismatch below.
  const mixTotal = Math.max(scenarioUnits ?? 0, allocatedUnits);
  const mixDescription = `${recordedMix.map((item: { name: string; value: number }) => `${item.value} ${item.name.toLowerCase()} ${isApartmentProject ? "apartments" : "units"}`).join(", ") || "No unit mix allocation recorded"}; ${unassignedUnits} units not assigned`;
  const totals = capitalStack?.totals;
  const committed = Math.max(0, Number(totals?.committed ?? 0));
  const funded = Math.max(0, Number(totals?.funded ?? 0));
  const requirement = Math.max(0, Number(totals?.capitalRequirement ?? 0));
  const fundingScale = Math.max(requirement, committed, funded, 1);
  const commitmentWidth = Math.min(100, committed / fundingScale * 100);
  const fundedWidth = Math.min(100, funded / fundingScale * 100);
  return <section className="project-dashboard-summary" aria-label={`${project.projectName} dashboard`}>
    <header className="project-dashboard-heading"><div><div className="kicker">PROJECT DASHBOARD</div><h2>{project.projectName}</h2><p>{project.knownProgramSummary || project.projectType}</p></div><div className="project-dashboard-actions"><Button variant="outline" onClick={onOpenRoi}>Open projections</Button><Button variant="outline" onClick={onOpenFunding}>Explore funding sources</Button></div></header>
    <div className="project-dashboard-model-status"><span>{loading ? "Loading planning models…" : `${scenarios.length} planning scenarios available`}</span><span>{project.roiProjectId ? "Recorded ROI result linked" : "No recorded ROI result linked"}</span></div>
    {error ? <p role="alert">Project models could not load: {error}</p> : !loading && !active ? <p>No saved planning model is available for this project. Open projections to add model inputs.</p> : null}
    {active && <><label className="project-dashboard-scenario">Planning scenario<select value={active.scenarioId} onChange={(event) => setScenarioId(Number(event.target.value))}>{scenarios.map((item: any) => <option key={item.scenarioId} value={item.scenarioId}>{item.scenarioName}</option>)}</select></label>
      <div className="project-dashboard-chart-grid"><article className="project-dashboard-mix-card"><div className="project-chart-title"><div><span className="project-chart-kicker">SCENARIO PLANNING</span><h3>{isApartmentProject ? "Apartment unit mix" : "Sales and rental mix"}</h3></div><strong>{mixTotal ? `${mixTotal.toLocaleString()} ${isApartmentProject ? "apartments" : "units"}` : "Units not set"}</strong></div>{isApartmentProject && project.programBuildingCount > 0 && <p className="project-chart-note">{project.programBuildingCount} buildings{project.programUnitsPerBuilding > 0 ? ` · ${project.programUnitsPerBuilding} apartments per building` : ""}</p>}{mix.length ? <><div className="project-dashboard-donut"><div className="project-dashboard-chart" role="img" aria-label={mixDescription}><ResponsiveContainer><PieChart><Pie data={mix} dataKey="value" nameKey="name" innerRadius="60%" outerRadius="82%" stroke="#fffefa" strokeWidth={2}>{mix.map((item: { name: string; color: string }) => <Cell key={item.name} fill={item.color} />)}</Pie><Tooltip formatter={(value, name) => [`${value} units`, name]} /></PieChart></ResponsiveContainer></div><div className="project-dashboard-donut-center"><b>{mixTotal.toLocaleString()}</b><small>{isApartmentProject ? "apartments" : "total units"}</small></div></div><div className="project-dashboard-mix-legend">{mix.map((item: { name: string; value: number; color: string }) => <span key={item.name}><i style={{ background: item.color }} />{item.name}: <b>{item.value.toLocaleString()}</b><small>{mixTotal ? ` · ${Math.round(item.value / mixTotal * 100)}%` : ""}</small></span>)}</div>{unassignedUnits > 0 && <p className="project-chart-note">{unassignedUnits.toLocaleString()} {isApartmentProject ? "apartments still need a recorded unit type" : "units still need an explicit sale-or-rent allocation"} in this scenario.</p>}{scenarioUnits !== null && allocatedUnits > scenarioUnits && <p className="project-chart-warning">Recorded allocations exceed the scenario’s {scenarioUnits.toLocaleString()}-unit program. Review the model inputs.</p>}</> : <div className="project-chart-empty"><strong>{isApartmentProject ? "No apartment unit mix recorded" : "No tenure allocation recorded"}</strong><p>{isApartmentProject ? "Record studio, one-, two-, and three-bedroom counts for this scenario." : "Record the scenario’s total units and how many will be sold or retained for rent."}</p></div>}<Button variant="outline" onClick={onOpenRoi}>Edit planning assumptions</Button></article>
      <article className="project-dashboard-funding-card"><div className="project-chart-title"><div><span className="project-chart-kicker">PROJECT-LEVEL FUNDING RECORD</span><h3>Capital recorded against the project</h3></div><strong>{requirement > 0 ? money(requirement) : "Requirement not set"}</strong></div>{totals ? <><p className="project-chart-note">Commitments and funded cash are separate states of the same capital; they are not added together.</p><div className="project-funding-rail-group"><div className="project-funding-rail-label"><span>Recorded commitments</span><b>{money(committed)}</b></div><div className="project-funding-rail" role="img" aria-label={`${money(committed)} recorded commitments${requirement ? ` against ${money(requirement)} project requirement` : ""}`}><i className="committed" style={{ width: `${commitmentWidth}%` }} /></div><small>{requirement > 0 ? `${Math.round(committed / requirement * 100)}% of project requirement` : "No project requirement recorded for a percentage comparison"}</small></div><div className="project-funding-rail-group"><div className="project-funding-rail-label"><span>Recorded funded cash</span><b>{money(funded)}</b></div><div className="project-funding-rail" role="img" aria-label={`${money(funded)} recorded funded cash${requirement ? ` against ${money(requirement)} project requirement` : ""}`}><i className="funded" style={{ width: `${fundedWidth}%` }} /></div><small>{requirement > 0 ? `${Math.round(funded / requirement * 100)}% of project requirement` : "No project requirement recorded for a percentage comparison"}</small></div>{committed === 0 && funded === 0 && <p className="project-chart-zero">No commitment or funding has been recorded for this project.</p>}{requirement > 0 && <p className="project-chart-note">Project requirement ({project.capitalRequirementDataState || "planning"}); funding totals follow the project, not the selected scenario.</p>}</> : <div className="project-chart-empty"><strong>Funding records unavailable</strong><p>Open the capital stack to review linked opportunities and recorded capital.</p></div>}<Button variant="outline" onClick={onOpenFunding}>Open project capital stack</Button></article></div>
      <ProjectFinancialModelVisuals project={model} activeScenarioId={active.scenarioId} />
    </>}
  </section>;
}

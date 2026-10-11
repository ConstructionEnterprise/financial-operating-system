import { useMemo, useState } from "react";
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { formatCapitalAmount } from "../../../shared/capitalFormation";

export type VisualScenario = {
  id: number;
  name: string;
  status: string;
  cost: number | null;
  grossSales: number | null;
  annualRent: number | null;
  saleUnits: number | null;
  rentalUnits: number | null;
};

const compactMoney = (value: number) => `$${(value / 1_000_000).toFixed(value >= 10_000_000 ? 0 : 1)}M`;
const caseLabel = (name: string) => {
  const cost = name.match(/\$(\d+)\/sf/i)?.[1];
  const retention = name.match(/(\d+)% Rentals/i)?.[1];
  return cost && retention ? `$${cost}/SF · ${retention}% rental` : name.replace(/^Current Underwriting — /, "").replace(/^Historical Planning — /, "Historical: ");
};

export function ScenarioComparisonVisuals({ scenarios, projectName }: { scenarios: VisualScenario[]; projectName: string }) {
  const [showHistory, setShowHistory] = useState(false);
  const current = useMemo(() => scenarios.filter((row) => row.status !== "archived" && (projectName !== "Stonepine Residences" || row.name.startsWith("Current Underwriting — All-In Cost"))), [scenarios, projectName]);
  const history = scenarios.filter((row) => !current.includes(row));
  const rows = showHistory ? scenarios : current;
  const costs = rows.filter((row) => row.cost !== null).map((row) => ({ label: caseLabel(row.name), cost: row.cost, grossSales: row.grossSales, id: row.id }));
  const rentalRows = rows.filter((row) => row.annualRent !== null).map((row) => ({ label: caseLabel(row.name), annualRent: row.annualRent, rentalUnits: row.rentalUnits, saleUnits: row.saleUnits, id: row.id }));
  return <section className="scenario-visual-comparison" aria-label={`${projectName} scenario comparison`}>
    <div className="scenario-visual-heading"><div><h3>Compare planning cases</h3><p>{current.length} current cases · amounts are estimates from stored scenario inputs</p></div>{history.length > 0 && <button type="button" onClick={() => setShowHistory((value) => !value)}>{showHistory ? "Hide" : "Show"} {history.length} historical / archived cases</button>}</div>
    <div className="scenario-visual-grid">
      <article><h4>Development cost and gross home sales</h4><p>Sales are total gross proceeds from homes designated for sale. Rental home value is excluded; the two bars are not a profit calculation.</p>{costs.length ? <div style={{ height: Math.max(260, costs.length * 43) }}><ResponsiveContainer width="100%" height="100%"><BarChart data={costs} layout="vertical" margin={{ left: 10, right: 15 }} accessibilityLayer><CartesianGrid horizontal={false} /><XAxis type="number" tickFormatter={compactMoney} /><YAxis type="category" dataKey="label" width={150} tick={{ fontSize: 10 }} /><Tooltip formatter={(value) => formatCapitalAmount(Number(value))} /><Legend /><Bar dataKey="cost" name="All-in cost" fill="#91753c" /><Bar dataKey="grossSales" name="Gross home sales" fill="#477457" /></BarChart></ResponsiveContainer></div> : <p>No stored cost case.</p>}</article>
      <article><h4>Annual potential rental income</h4><p>Full occupancy at the estimated monthly rent. Vacancy, operating expenses, and NOI are not yet modeled.</p>{rentalRows.length ? <div style={{ height: Math.max(260, rentalRows.length * 43) }}><ResponsiveContainer width="100%" height="100%"><BarChart data={rentalRows} layout="vertical" margin={{ left: 10, right: 15 }} accessibilityLayer><CartesianGrid horizontal={false} /><XAxis type="number" tickFormatter={compactMoney} /><YAxis type="category" dataKey="label" width={150} tick={{ fontSize: 10 }} /><Tooltip formatter={(value) => formatCapitalAmount(Number(value))} /><Bar dataKey="annualRent" name="Annual potential rent" fill="#547898" /></BarChart></ResponsiveContainer></div> : <p>Annual rental income is not recorded for these cases.</p>}</article>
    </div>
    {history.length > 0 && <p className="scenario-visual-note">Historical and archived cases may use earlier scopes; compare their source dates before drawing conclusions.{projectName === "Stonepine Residences" ? " The nine current Stonepine cases use 200 homes at 1,750 SF." : ""}</p>}
  </section>;
}

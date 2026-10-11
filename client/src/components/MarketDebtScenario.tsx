import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { marketDebtSensitivity, stonepineDebtReferences, stonepineDebtSensitivities } from "../../../shared/marketDebtScenario";
import "./MarketDebtScenario.css";

const currency = (value: number) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(value);
const millions = (value: number) => `$${(value / 1_000_000).toFixed(1)}M`;

export function MarketDebtScenario({ projectRequirement, selected, onSelect }: { projectRequirement: number | null; selected: number; onSelect: (index: number) => void }) {
  if (projectRequirement == null || projectRequirement <= 0) return null;

  const rows = stonepineDebtSensitivities.map((caseInput, index) => ({
    ...caseInput,
    index,
    ...marketDebtSensitivity(projectRequirement, caseInput.loanToCostPct, caseInput.interestRatePct),
  }));
  const active = rows[selected];

  return <section className="market-debt-scenario" aria-label="Stonepine market-referenced debt sensitivity">
    <div className="market-debt-heading">
      <div><small>MARKET-REFERENCED · PLANNING ONLY</small><h3>Stonepine construction debt sensitivity</h3></div>
      <span>Sources reviewed October 7, 2026</span>
    </div>
    <p>Three illustrative loan-to-cost and rate combinations against the recorded {currency(projectRequirement)} project requirement. These are <strong>not lender quotes, approvals, committed capital, or saved campaign terms</strong>. The rates bracket published small-project offerings; the leverage points are modeling choices, not quoted Stonepine limits.</p>
    <div className="market-debt-cases" role="group" aria-label="Select a debt sensitivity">
      {rows.map(row => <button type="button" key={row.label} aria-pressed={selected === row.index} className={selected === row.index ? "selected" : ""} onClick={() => onSelect(row.index)}>
        <b>{row.label}</b><span>{row.loanToCostPct}% LTC · {row.interestRatePct}% rate</span>
      </button>)}
    </div>
    <div className="market-debt-visuals">
      <div className="market-debt-chart" role="img" aria-label="Illustrative loan and borrower-equity amounts across three leverage cases">
        <ResponsiveContainer><BarChart data={rows} layout="vertical" margin={{ left: 12, right: 20 }}><CartesianGrid strokeDasharray="3 3" horizontal={false} /><XAxis type="number" tickFormatter={millions} /><YAxis type="category" dataKey="label" width={105} tick={{ fontSize: 11 }} /><Tooltip formatter={value => currency(Number(value))} /><Legend /><Bar name="Illustrative loan" dataKey="loan" stackId="capital" fill="#6288a2" /><Bar name="Required equity" dataKey="borrowerEquity" stackId="capital" fill="#b2934d" /></BarChart></ResponsiveContainer>
      </div>
      <div className="market-debt-selected">
        <small>{active.label.toUpperCase()}</small>
        <div><span>Illustrative loan</span><strong>{currency(active.loan)}</strong></div>
        <div><span>Required borrower equity</span><strong>{currency(active.borrowerEquity)}</strong></div>
        <div><span>Interest at full draw / month</span><strong>{currency(active.fullDrawMonthlyInterest)}</strong></div>
        <p>Interest is calculated on the full illustrative balance solely for comparison. Actual construction interest depends on draws, timing, lender pricing and fees; it is not an amortizing monthly payment.</p>
      </div>
    </div>
    <div className="market-debt-caution"><b>Term and product-fit gap</b><span>Stonepine’s saved development schedule is 36 months. The cited short-term products publish terms through 24 months, and Kiavi caps its published loan range at $10M. A whole-project facility, extensions, phased closings and a separate take-out for retained rentals need lender underwriting.</span></div>
    <details className="market-debt-sources"><summary>Market references and calculation basis</summary><ul>{stonepineDebtReferences.map(source => <li key={source.url}><a href={source.url} target="_blank" rel="noreferrer">{source.name}</a> · {source.observedAt}: {source.detail}</li>)}</ul><p>Loan = project requirement × selected LTC. Borrower equity = project requirement − loan. Full-draw monthly interest = loan × annual rate ÷ 12. No amounts are written to the campaign or funding ledger.</p></details>
  </section>;
}

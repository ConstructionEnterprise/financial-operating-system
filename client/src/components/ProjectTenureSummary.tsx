import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { formatCapitalAmount } from "../../../shared/capitalFormation";

export function ProjectTenureSummary({ assumptions }: { assumptions: Array<{ metric: string; value: number | null }> }) {
  const metric = (name: string) => assumptions.find((row) => row.metric === name)?.value ?? null;
  const rentals = metric("rental_units");
  const sales = metric("for_sale_units");
  if (rentals === null || sales === null) return null;
  const salePrice = metric("sale_price_per_home");
  const rent = metric("monthly_rent_per_home");
  return <section className="stonepine-case-panel" aria-label="Rental and sale model">
    <h3>Rental retention and home sales</h3>
    <p>{rentals} rental homes · {sales} homes for sale · {metric("average_home_sq_ft")?.toLocaleString()} SF per home</p>
    <div style={{ height: 170, width: "100%" }}>
      <ResponsiveContainer width="100%" height="100%"><BarChart data={[{ name: "Homes", rentals, sales }]} layout="vertical" accessibilityLayer>
        <CartesianGrid horizontal={false} /><XAxis type="number" domain={[0, rentals + sales]} /><YAxis type="category" dataKey="name" width={55} />
        <Tooltip /><Bar dataKey="rentals" name="Retained rentals" stackId="homes" fill="#41684c" /><Bar dataKey="sales" name="Homes for sale" stackId="homes" fill="#bc9451" />
      </BarChart></ResponsiveContainer>
    </div>
    {salePrice !== null && rent !== null && <>
      <div className="stonepine-case-detail">
        <div><span>Estimated sale price / home</span><strong>{formatCapitalAmount(salePrice)}</strong></div>
        <div><span>Estimated monthly rent / home</span><strong>{formatCapitalAmount(rent)}</strong></div>
        <div><span>Gross sales proceeds · all sale homes</span><strong>{formatCapitalAmount(sales * salePrice)}</strong></div>
        <div><span>Annual potential rent · full occupancy</span><strong>{formatCapitalAmount(rentals * rent * 12)}</strong></div>
      </div>
      <p>DFW regional planning benchmarks. Gross proceeds exclude selling costs; potential rent precedes vacancy and operating expenses. Timing, financing, and CE distributions still require inputs.</p>
      <p>Sources: <a href="https://www.realtor.com/news/local/dallas-tx/real-estate-market-dallas-tx-september-2026/" target="_blank" rel="noreferrer">September 2026 DFW asking prices</a> · <a href="https://www.doorstead.com/blog/dallas-tx-rental-market-report" target="_blank" rel="noreferrer">July 2026 DFW single-family rents</a>. Benchmarks are rounded down from regional medians and need site-specific comparables.</p>
    </>}
  </section>;
}

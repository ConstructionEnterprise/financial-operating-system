import { useState } from "react";
import { Cable, CheckCircle2, LockKeyhole } from "lucide-react";
import "./ConnectedWorkspaces.css";

const accountingConnectors = [
  { name: "QuickBooks", focus: "Accounting records, vendors, bills, invoices and payments" },
  { name: "Xero", focus: "Accounting records and financial transaction mapping" },
  { name: "Sage", focus: "Construction accounting and project cost mapping" },
] as const;

export function IntegrationsWorkspace({ gmailStatus, gmailEmail, connectGmail, retryGmailStatus }: { gmailStatus: "connected" | "disconnected" | "checking" | "unavailable"; gmailEmail?: string | null; connectGmail: () => void; retryGmailStatus: () => void }) {
  const [selected, setSelected] = useState<string>("QuickBooks");
  const gmailConnected = gmailStatus === "connected";
  return <section className="connected-workspace">
    <div className="connected-banner"><Cable size={30} /><div><h2>Connect your financial ecosystem</h2><p>Accounting actuals belong to their source system. FOS connects them to project planning and capital decisions.</p></div></div>
    <div className="connector-grid">
      <article className="connector-card"><div className="connector-heading"><h3>Gmail</h3><span className={gmailConnected ? "connection-live" : "connection-pending"}>{gmailStatus === "connected" ? "Connected" : gmailStatus === "disconnected" ? "Not connected" : gmailStatus === "checking" ? "Checking…" : "Status unavailable"}</span></div><p>Existing approval-first outreach connection.</p><small>{gmailConnected ? gmailEmail || "Authorized workspace connection" : gmailStatus === "disconnected" ? "Authorize your account through the existing Gmail flow." : gmailStatus === "checking" ? "Checking the workspace connection." : "Could not verify the connection. Retry before authorizing again."}</small><button onClick={gmailStatus === "unavailable" ? retryGmailStatus : connectGmail} disabled={gmailStatus === "checking"}>{gmailConnected ? "Review Gmail connection" : gmailStatus === "disconnected" ? "Connect Gmail" : gmailStatus === "checking" ? "Checking Gmail…" : "Retry status"}</button></article>
      {accountingConnectors.map(connector => <article key={connector.name} className={`connector-card ${selected === connector.name ? "selected" : ""}`}><div className="connector-heading"><h3>{connector.name}</h3><span className="connection-pending">Setup required</span></div><p>{connector.focus}</p><small>No account connected · No records synchronized</small><button onClick={() => setSelected(connector.name)} aria-pressed={selected === connector.name}>Inspect setup requirements</button></article>)}
    </div>
    <article className="connector-card"><h3>{selected} · Connection readiness</h3><p>This is a connector planning workspace, not an active accounting integration. No credentials are collected here.</p><div className="connector-readiness">{["Register the provider application and configure its authorization callback", "Implement secure server-side authorization and encrypted token storage", "Choose an accounting organization and approved read-only record scopes", "Map projects, accounts and vendors; establish duplicate detection", "Preview imported records, reconcile totals and retain sync audit logs"].map((step, index) => <div key={step}><LockKeyhole size={18} /><span><b>{index + 1}. </b>{step}</span><small>Pending implementation</small></div>)}</div></article>
    <div className="connected-banner"><CheckCircle2 size={24} /><p>Read-only first. Future write-back and sending actions require explicit approval. Forecasts, commitments and accounting actuals must remain separate.</p></div>
  </section>;
}

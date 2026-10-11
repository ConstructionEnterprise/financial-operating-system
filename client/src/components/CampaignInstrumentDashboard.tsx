import { useMemo, useState, type CSSProperties } from "react";
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Sankey, Tooltip, XAxis, YAxis } from "recharts";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { campaignMeta, type CampaignType } from "../../../shared/campaignFinance";
import { deploymentUseLabels, type DeploymentUse } from "../../../shared/capitalDeployment";
import { marketDebtSensitivity, stonepineDebtSensitivities } from "../../../shared/marketDebtScenario";
import { MarketDebtScenario } from "./MarketDebtScenario";
import "./CampaignInstrumentDashboard.css";

const stageOrder = ["identified", "researching", "outreach", "meeting", "diligence", "term_sheet", "committed", "passed"] as const;
const stageLabel: Record<string, string> = { identified: "Identified", researching: "Research", outreach: "Outreach", meeting: "Meetings", diligence: "Diligence", term_sheet: "Terms", committed: "Committed", passed: "Passed" };
const money = (value: unknown) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(Number(value || 0));
const compactMoney = (value: unknown) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", notation: "compact", maximumFractionDigits: 1 }).format(Number(value || 0));
const number = (value: unknown) => value == null || value === "" ? null : Number(value);

function FlowNode({ x, y, width, height, payload }: any) {
  const colors = ["#486b53", "#a48848", "#7192a9", "#88779c"];
  return <g>
    <title>{String(payload.name)}</title>
    <rect x={x} y={y} width={width} height={Math.max(3, height)} rx={3} fill={colors[payload.depth || 0] || "#6288a2"} />
  </g>;
}

type CampaignFlow = {
  nodes: Array<{ name: string; depth: number }>;
  links: Array<{ source: number; target: number; value: number }>;
};

function CampaignFlowChart({ flow }: { flow: CampaignFlow }) {
  if (!flow.links.length) return <p>Set a campaign target or record a planned use to activate the capital-flow diagram.</p>;
  const columns = ["Funding source", "Campaign", "Recipient", "Planned use"];
  return <>
    <div className="campaign-sankey-chart"><ResponsiveContainer><Sankey data={flow} node={<FlowNode />} nodePadding={32} margin={{ left: 20, right: 20, top: 15, bottom: 15 }} link={{ stroke: "#c9d3c5" }}><Tooltip formatter={value => money(value)} /></Sankey></ResponsiveContainer></div>
    <div className="campaign-flow-key">{columns.map((title, depth) => <div key={title} className={`campaign-flow-key-column depth-${depth}`}><small>{title}</small>{flow.nodes.map((node, index) => node.depth === depth ? <span key={index} title={node.name}><b>{node.name}</b><em>{compactMoney(flow.links.filter(link => depth === 3 ? link.target === index : link.source === index).reduce((sum, link) => sum + link.value, 0))}</em></span> : null)}</div>)}</div>
  </>;
}

export function CampaignInstrumentDashboard({ campaign, type, opportunities, tasks, meetings, project }: { campaign: any; type: CampaignType; opportunities: any[]; tasks: any[]; meetings: any[]; project?: any }) {
  const utils = trpc.useUtils();
  const defaultUseCategory: DeploymentUse = type === "equipment" ? "equipment" : type === "project_debt" || type === "project_equity" ? "construction" : type === "company_equity" ? "payroll" : "other";
  const ledger = trpc.fundraising.capitalDeployment.useQuery(undefined, { refetchOnWindowFocus: true });
  const [stage, setStage] = useState<string | null>(null);
  const [marketCaseIndex, setMarketCaseIndex] = useState(1);
  const [showUseForm, setShowUseForm] = useState(false);
  const [useDraft, setUseDraft] = useState<{ purpose: string; category: DeploymentUse; amount: string; month: string; notes: string }>({ purpose: "", category: defaultUseCategory, amount: "", month: "", notes: "" });
  const [queuePage, setQueuePage] = useState(0);
  const saveUse = trpc.fundraising.saveCapitalAllocation.useMutation({ onSuccess: () => { void utils.fundraising.capitalDeployment.invalidate(); setUseDraft({ purpose: "", category: defaultUseCategory, amount: "", month: "", notes: "" }); setShowUseForm(false); toast.success("Campaign use of capital saved"); }, onError: error => toast.error(error.message) });
  const allocations = (ledger.data?.allocations || []).filter(row => row.campaignId === campaign.id);
  const payments = ledger.data?.payments || [];
  const allocationRows = allocations.map(row => ({ ...row, planned: Number(row.plannedAmount), paid: payments.filter(payment => payment.allocationId === row.id && !payment.voided).reduce((sum, payment) => sum + Number(payment.amount), 0) }));
  const plannedUses = allocationRows.reduce((sum, row) => sum + row.planned, 0);
  const paidUses = allocationRows.reduce((sum, row) => sum + row.paid, 0);
  const target = number(campaign.targetAmount);
  const unallocated = target == null ? null : Math.max(0, target - plannedUses);
  const overAllocated = target == null ? 0 : Math.max(0, plannedUses - target);
  const funnel = stageOrder.map(value => ({ stage: value, label: stageLabel[value], count: opportunities.filter(row => row.stage === value).length, capital: opportunities.filter(row => row.stage === value).reduce((sum, row) => sum + Number(row.requestedAmount || 0), 0) }));
  const maxFunnelCount = Math.max(1, ...funnel.map(item => item.count));
  const queue = opportunities.filter(row => !stage || row.stage === stage).slice(queuePage * 5, queuePage * 5 + 5);
  const useChart: Array<{ name: string; Planned: number; Deployed: number }> = allocationRows.map(row => ({ name: deploymentUseLabels[row.category as DeploymentUse] || row.category, Planned: row.planned, Deployed: row.paid }));
  if (unallocated && unallocated > 0) useChart.push({ name: "Awaiting allocation", Planned: unallocated, Deployed: 0 });
  const flow = useMemo(() => {
    const funded = opportunities.filter(row => Number(row.fundedAmount || 0) > 0).sort((a, b) => Number(b.fundedAmount) - Number(a.fundedAmount));
    const fundedTotal = funded.reduce((sum, row) => sum + Number(row.fundedAmount), 0);
    const total = Math.max(target || 0, plannedUses, fundedTotal);
    const sources: Array<{ name: string; value: number }> = funded.slice(0, 4).map(row => ({ name: row.organizationName, value: Number(row.fundedAmount) }));
    if (funded.length > 4) sources.push({ name: "Other funded sources", value: funded.slice(4).reduce((sum, row) => sum + Number(row.fundedAmount), 0) });
    if (total > fundedTotal) sources.push({ name: "Funding pending", value: total - fundedTotal });
    const useTotals = new Map<string, number>();
    for (const row of allocationRows) if (row.planned > 0) {
      const label = deploymentUseLabels[row.category as DeploymentUse] || row.category;
      useTotals.set(label, (useTotals.get(label) || 0) + row.planned);
    }
    const uses = Array.from(useTotals, ([name, value]) => ({ name, value }));
    if (total > plannedUses) uses.push({ name: "Awaiting allocation", value: total - plannedUses });
    const campaignIndex = sources.length;
    const recipientIndex = campaignIndex + 1;
    const nodes = [...sources.map(source => ({ name: source.name, depth: 0 })), { name: campaign.name, depth: 1 }, { name: campaign.recipientEntity || "Recipient pending", depth: 2 }, ...uses.map(use => ({ name: use.name, depth: 3 }))];
    const links = total > 0 ? [...sources.map((source, index) => ({ source: index, target: campaignIndex, value: source.value })), { source: campaignIndex, target: recipientIndex, value: total }, ...uses.map((use, index) => ({ source: recipientIndex, target: recipientIndex + 1 + index, value: use.value }))] : [];
    return { nodes, links };
  }, [allocationRows, opportunities, target, plannedUses, campaign.name, campaign.recipientEntity]);
  const typeChecks = readinessChecks(type, campaign, opportunities, tasks, meetings, plannedUses);
  const complete = typeChecks.filter(item => item.complete).length;

  return <section className="campaign-command-center" aria-label={`${campaign.name} command center`}>
    <div className="campaign-command-bar"><article><small>SETUP READINESS</small><strong>{Math.round((complete / typeChecks.length) * 100)}%</strong><progress max={typeChecks.length} value={complete} /><span>{complete} of {typeChecks.length} readiness gates recorded</span></article><article><small>NEXT DECISION</small><strong>{typeChecks.find(item => !item.complete)?.label || "Campaign readiness recorded"}</strong><span>{typeChecks.find(item => !item.complete)?.action || "Continue monitoring funding and deployment."}</span></article><article><small>USES OF CAPITAL</small><strong>{target == null ? "Target needed" : `${compactMoney(plannedUses)} / ${compactMoney(target)}`}</strong><span>{compactMoney(paidUses)} deployed · {unallocated == null ? "target unset" : `${compactMoney(unallocated)} unallocated`}</span></article><article><small>OWNER / CLOSE</small><strong>{campaign.campaignOwner || "Unassigned"}</strong><span>{campaign.targetDate || "No target close date"}</span></article></div>

    <div className="campaign-funnel-panel"><div className="campaign-panel-heading"><div><small>LIVE CAPITAL FUNNEL</small><h3>Relationships by recorded stage</h3><p>Bar height reflects recorded count. Click a stage to filter the five-record work queue.</p></div><span>{opportunities.length} assigned capital records</span></div><div className="campaign-funnel">{funnel.map(item => <button key={item.stage} className={stage === item.stage ? "selected" : ""} onClick={() => { setStage(stage === item.stage ? null : item.stage); setQueuePage(0); }} style={{ "--funnel-height": `${70 + item.count / maxFunnelCount * 80}px` } as CSSProperties}><span>{item.label}</span><b>{item.count}</b><small>{item.capital ? compactMoney(item.capital) : "No amount"}</small></button>)}</div><div className="campaign-stage-queue">{queue.map(row => <article key={row.id}><div><b>{row.organizationName}</b><span>{stageLabel[row.stage] || row.stage.replaceAll("_", " ")} · {row.probability || 0}% probability</span></div><div><strong>{row.requestedAmount ? compactMoney(row.requestedAmount) : "Amount unset"}</strong><small>{row.nextAction || "Next action not recorded"}</small></div></article>)}{!queue.length && <p>No records in this stage.</p>}</div>{opportunities.filter(row => !stage || row.stage === stage).length > 5 && <div className="campaign-pagination"><button disabled={queuePage === 0} onClick={() => setQueuePage(queuePage - 1)}>Previous</button><span>{queuePage * 5 + 1}–{Math.min(queuePage * 5 + 5, opportunities.filter(row => !stage || row.stage === stage).length)}</span><button disabled={(queuePage + 1) * 5 >= opportunities.filter(row => row.stage === stage || !stage).length} onClick={() => setQueuePage(queuePage + 1)}>Next</button></div>}</div>

    <div className="campaign-readiness-grid"><article><div className="campaign-panel-heading"><div><small>READINESS TRACKER</small><h3>What is blocking the next stage</h3></div><span>{complete}/{typeChecks.length}</span></div><div className="campaign-readiness-list">{typeChecks.map(item => <div key={item.label} className={item.complete ? "complete" : "blocked"}><i>{item.complete ? "✓" : "!"}</i><span><b>{item.label}</b><small>{item.complete ? item.completeText : item.action}</small></span></div>)}</div>{type === "project_debt" && project?.projectName === "Stonepine Residences" && <p className="campaign-planning-note">{isStonepineWorkingDecision(campaign) ? "The saved 70% internal sizing decision satisfies the planning target and sizing checks. Market rate comparisons below are not lender terms; the remaining readiness items are shown above." : "The market case below is a planning comparison and does not record campaign decisions or lender terms."}</p>}</article><CampaignUnderwriting campaign={campaign} type={type} project={project} marketCaseIndex={marketCaseIndex} /></div>
    {type === "project_debt" && project?.projectName === "Stonepine Residences" && <MarketDebtScenario projectRequirement={project.capitalRequirement == null ? null : Number(project.capitalRequirement)} selected={marketCaseIndex} onSelect={setMarketCaseIndex} />}

    <article className="campaign-uses-panel"><div className="campaign-panel-heading"><div><small>CAMPAIGN → RECIPIENT → USES</small><h3>Planned and deployed capital</h3><p>The flow diagram shows the capital plan. The bars separate planned allocations from recorded payments.</p></div><button onClick={() => setShowUseForm(!showUseForm)}>+ Record planned use</button></div>{ledger.error && <p role="alert">Capital deployment records could not load: {ledger.error.message}</p>}{showUseForm && <form className="campaign-use-form" onSubmit={event => { event.preventDefault(); if (!useDraft.purpose.trim() || !useDraft.amount) return; saveUse.mutate({ campaignId: campaign.id, sourceOpportunityId: null, internalProjectId: campaign.internalProjectId || null, purpose: useDraft.purpose.trim(), category: useDraft.category, equipmentName: useDraft.category === "equipment" ? useDraft.purpose.trim() : null, plannedAmount: Number(useDraft.amount), committedAmount: null, plannedMonth: useDraft.month || null, reference: null, notes: useDraft.notes.trim() || null }); }}><label>Use / purpose<input required value={useDraft.purpose} onChange={event => setUseDraft({ ...useDraft, purpose: event.target.value })} placeholder="Engineering payroll, software, insurance…" /></label><label>Category<select value={useDraft.category} onChange={event => setUseDraft({ ...useDraft, category: event.target.value as DeploymentUse })}>{Object.entries(deploymentUseLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label><label>Planned amount<input required type="number" min="0" step="0.01" value={useDraft.amount} onChange={event => setUseDraft({ ...useDraft, amount: event.target.value })} /></label><label>Planned month<input type="month" value={useDraft.month} onChange={event => setUseDraft({ ...useDraft, month: event.target.value })} /></label><label className="wide">Notes<input value={useDraft.notes} onChange={event => setUseDraft({ ...useDraft, notes: event.target.value })} /></label><button disabled={saveUse.isPending}>{saveUse.isPending ? "Saving…" : "Save planned use"}</button></form>}{overAllocated > 0 && <p className="campaign-warning">Planned uses exceed the campaign target by {money(overAllocated)}.</p>}<div className="campaign-uses-charts"><div className="campaign-sankey"><CampaignFlowChart flow={flow} /></div><div className="campaign-use-bars"><ResponsiveContainer><BarChart data={useChart} layout="vertical" margin={{ left: 30, right: 18 }}><CartesianGrid strokeDasharray="3 3" /><XAxis type="number" tickFormatter={value => compactMoney(value)} /><YAxis type="category" dataKey="name" width={115} tick={{ fontSize: 10 }} /><Tooltip formatter={value => money(value)} /><Legend /><Bar dataKey="Planned" fill="#a48848" /><Bar dataKey="Deployed" fill="#486b53" /></BarChart></ResponsiveContainer></div></div><div className="campaign-use-ledger">{allocationRows.slice(0, 5).map(row => <div key={row.id}><span><b>{row.purpose}</b><small>{deploymentUseLabels[row.category as DeploymentUse] || row.category}{row.plannedMonth ? ` · ${row.plannedMonth}` : ""}</small></span><span><b>{money(row.planned)}</b><small>{money(row.paid)} deployed</small></span></div>)}{!allocationRows.length && <p>No campaign uses have been allocated. The full target remains awaiting allocation.</p>}</div></article>
  </section>;
}

function readinessChecks(type: CampaignType, campaign: any, opportunities: any[], tasks: any[], meetings: any[], plannedUses: number) {
  const internalPlanning = isStonepineWorkingDecision(campaign);
  const common = [
    { label: "Campaign owner assigned", complete: Boolean(campaign.campaignOwner), action: "Assign a responsible owner.", completeText: campaign.campaignOwner || "Assigned" },
    { label: "Target close date recorded", complete: Boolean(campaign.targetDate), action: "Set the campaign decision deadline.", completeText: campaign.targetDate || "Recorded" },
    { label: "Capital target recorded", complete: campaign.targetAmount != null, action: "Size the campaign capital target.", completeText: `${money(campaign.targetAmount)}${internalPlanning ? " internal working target" : ""}` },
    { label: "Uses of capital planned", complete: plannedUses > 0, action: type === "project_debt" ? "Allocate proposed debt to eligible project costs; linking Stonepine alone does not allocate dollars." : "Allocate the target to project or company uses.", completeText: `${money(plannedUses)} planned` },
  ];
  const typed = type === "company_equity" ? [
    { label: "Investor research underway", complete: opportunities.some(row => row.stage !== "identified"), action: "Advance researched investors from the identified pool.", completeText: "At least one relationship advanced" },
    { label: "Meetings recorded", complete: meetings.some(meeting => meeting.status !== "cancelled") || opportunities.some(row => ["meeting", "diligence", "term_sheet", "committed"].includes(row.stage)), action: "Schedule and record an investor conversation.", completeText: `${meetings.filter(meeting => meeting.status !== "cancelled").length} campaign meetings` },
    { label: "Equity economics recorded", complete: campaign.preMoneyValuation != null && campaign.monthlyBurn != null, action: "Record valuation and monthly burn.", completeText: "Valuation and burn available" },
  ] : type === "project_debt" ? [
    { label: "Loan sizing recorded", complete: campaign.loanToCostBps != null && campaign.borrowerEquity != null, action: "Record loan-to-cost and borrower equity.", completeText: internalPlanning ? "70% internal planning case; lender sizing pending" : "Capital structure inputs available" },
    { label: "Debt terms recorded", complete: campaign.interestRateBps != null && campaign.termMonths != null, action: "Record rate and loan term.", completeText: "Rate and term available" },
  ] : type === "project_equity" ? [
    { label: "Contributions recorded", complete: campaign.partnerContribution != null && campaign.ceContribution != null, action: "Record partner and CE contributions.", completeText: "Both contribution amounts available" },
    { label: "JV economics recorded", complete: campaign.ownershipOfferedBps != null && campaign.preferredReturnBps != null, action: "Record ownership and preferred return.", completeText: "Ownership and preferred return available" },
  ] : type === "equipment" ? [
    { label: "Payment structure recorded", complete: campaign.downPayment != null && campaign.monthlyPayment != null && campaign.termMonths != null, action: "Record deposit, monthly payment and term.", completeText: "Payment schedule available" },
    { label: "Expected utilization recorded", complete: campaign.expectedUtilizationBps != null, action: "Record expected equipment utilization.", completeText: `${Number(campaign.expectedUtilizationBps) / 100}% utilization` },
  ] : type === "grants" ? [
    { label: "Request and match recorded", complete: campaign.grantRequestedAmount != null && campaign.grantMatchAmount != null, action: "Record grant request and required match.", completeText: "Request and match available" },
    { label: "Application work assigned", complete: tasks.length > 0, action: "Assign application tasks and deadlines.", completeText: `${tasks.length} campaign tasks` },
  ] : [];
  return [...common, ...typed];
}

function CampaignUnderwriting({ campaign, type, project, marketCaseIndex }: { campaign: any; type: CampaignType; project?: any; marketCaseIndex: number }) {
  const utils = trpc.useUtils();
  const update = trpc.fundraising.updateCampaign.useMutation({ onSuccess: () => { void utils.fundraising.campaigns.invalidate(); toast.success("Underwriting inputs saved"); }, onError: error => toast.error(error.message) });
  const target = Number(campaign.targetAmount || 0), preMoney = Number(campaign.preMoneyValuation || 0), burn = Number(campaign.monthlyBurn || 0), cash = Number(campaign.currentCash || 0);
  const hasEquityInputs = campaign.preMoneyValuation != null && campaign.targetAmount != null;
  const equity = { postMoney: hasEquityInputs ? preMoney + target : null, implied: hasEquityInputs && preMoney + target > 0 ? target / (preMoney + target) * 100 : null, runway: campaign.currentCash != null && campaign.monthlyBurn != null && campaign.targetAmount != null && burn > 0 ? (cash + target) / burn : null };
  const debtRate = Number(campaign.interestRateBps || 0) / 120000, months = Number(campaign.termMonths || 0), payment = campaign.targetAmount != null && campaign.interestRateBps != null && target > 0 && months > 0 ? (debtRate > 0 ? target * debtRate / (1 - Math.pow(1 + debtRate, -months)) : target / months) : null;
  const projectRequirement = Number(project?.capitalRequirement || 0);
  const marketCase = type === "project_debt" && project?.projectName === "Stonepine Residences" && projectRequirement > 0 ? stonepineDebtSensitivities[marketCaseIndex] : null;
  const marketPreview = marketCase ? marketDebtSensitivity(projectRequirement, marketCase.loanToCostPct, marketCase.interestRatePct) : null;
  const cards = type === "company_equity" ? [["Post-money valuation", equity.postMoney == null ? "Unavailable" : money(equity.postMoney)], ["Implied dilution", equity.implied == null ? "Unavailable" : `${equity.implied.toFixed(1)}%`], ["Planned offer", campaign.ownershipOfferedBps == null ? "Unavailable" : `${Number(campaign.ownershipOfferedBps) / 100}%`], ["Runway after raise", equity.runway == null ? "Unavailable" : `${equity.runway.toFixed(1)} months`], ["Planned hires", campaign.plannedHeadcount ?? "Unavailable"]] : type === "project_debt" ? [["Loan target", campaign.targetAmount == null ? "Unavailable" : money(target)], ["Project requirement", project?.capitalRequirement == null ? "Unavailable" : money(projectRequirement)], ["Loan-to-cost", campaign.loanToCostBps == null ? "Unavailable" : `${Number(campaign.loanToCostBps) / 100}%`], ["Est. monthly payment", payment == null ? "Unavailable" : money(payment)], ["Borrower equity", campaign.borrowerEquity == null ? "Unavailable" : money(campaign.borrowerEquity)]] : type === "project_equity" ? [["Partner contribution", campaign.partnerContribution == null ? "Unavailable" : money(campaign.partnerContribution)], ["CE contribution", campaign.ceContribution == null ? "Unavailable" : money(campaign.ceContribution)], ["Partner ownership", campaign.ownershipOfferedBps == null ? "Unavailable" : `${Number(campaign.ownershipOfferedBps) / 100}%`], ["Preferred return", campaign.preferredReturnBps == null ? "Unavailable" : `${Number(campaign.preferredReturnBps) / 100}%`]] : type === "equipment" ? [["Down payment", campaign.downPayment == null ? "Unavailable" : money(campaign.downPayment)], ["Monthly payment", campaign.monthlyPayment == null ? "Unavailable" : money(campaign.monthlyPayment)], ["Term", campaign.termMonths == null ? "Unavailable" : `${campaign.termMonths} months`], ["Total scheduled payments", campaign.downPayment != null && campaign.monthlyPayment != null && campaign.termMonths != null ? money(Number(campaign.downPayment) + Number(campaign.monthlyPayment) * Number(campaign.termMonths)) : "Unavailable"], ["Expected utilization", campaign.expectedUtilizationBps == null ? "Unavailable" : `${Number(campaign.expectedUtilizationBps) / 100}%`]] : type === "grants" ? [["Grant request", campaign.grantRequestedAmount == null ? "Unavailable" : money(campaign.grantRequestedAmount)], ["Required match", campaign.grantMatchAmount == null ? "Unavailable" : money(campaign.grantMatchAmount)], ["Total enabled budget", campaign.grantRequestedAmount != null && campaign.grantMatchAmount != null ? money(Number(campaign.grantRequestedAmount) + Number(campaign.grantMatchAmount)) : "Unavailable"]] : [];
  if (marketCase && marketPreview) {
    if (campaign.targetAmount == null) cards[0] = ["Loan target · planning", money(marketPreview.loan)];
    if (campaign.loanToCostBps == null) cards[2] = ["Loan-to-cost · planning", `${marketCase.loanToCostPct}%`];
    if (campaign.borrowerEquity == null) cards[4] = ["Borrower equity · planning", money(marketPreview.borrowerEquity)];
  }
  const recordedPlanning = isStonepineWorkingDecision(campaign);
  if (recordedPlanning && type === "project_debt") {
    cards[0][0] = "Working loan target · planning";
    cards[2][0] = "Working LTC · planning";
    cards[4][0] = "Implied equity · planning";
  }
  return <article className="campaign-underwriting"><small>{campaignMeta[type].label.toUpperCase()} UNDERWRITING</small><h3>Decision economics</h3><div className="campaign-underwriting-cards">{cards.map(([label, value]) => <div key={String(label)} className={String(label).includes("· planning") ? "planning" : ""}><small>{label}</small><b>{value}</b></div>)}</div>{marketCase && <p className="campaign-planning-note">{recordedPlanning ? "The 70% case is saved as an internal working target. Selecting another case below compares sensitivities; it does not change that decision. " : `Planning previews use the selected ${marketCase.label.toLowerCase()} below. `}No lender rate, loan term, approval or funding is recorded. Construction interest varies with draws.</p>}<details><summary>Record underwriting inputs</summary><form onSubmit={event => { event.preventDefault(); const data = new FormData(event.currentTarget); const raw = (name: string) => String(data.get(name) || "").trim(); const percent = (name: string) => raw(name) ? Math.round(Number(raw(name)) * 100) : null; const dollars = (name: string) => raw(name) || null; const integer = (name: string) => raw(name) ? Number(raw(name)) : null; const fields: any = type === "company_equity" ? { preMoneyValuation: dollars("preMoneyValuation"), ownershipOfferedBps: percent("ownershipOffered"), monthlyBurn: dollars("monthlyBurn"), currentCash: dollars("currentCash"), plannedHeadcount: integer("plannedHeadcount") } : type === "project_debt" ? { interestRateBps: percent("interestRate"), termMonths: integer("termMonths"), loanToCostBps: percent("loanToCost"), borrowerEquity: dollars("borrowerEquity") } : type === "project_equity" ? { partnerContribution: dollars("partnerContribution"), ceContribution: dollars("ceContribution"), ownershipOfferedBps: percent("ownershipOffered"), preferredReturnBps: percent("preferredReturn") } : type === "equipment" ? { downPayment: dollars("downPayment"), monthlyPayment: dollars("monthlyPayment"), termMonths: integer("termMonths"), interestRateBps: percent("interestRate"), expectedUtilizationBps: percent("expectedUtilization") } : type === "grants" ? { grantRequestedAmount: dollars("grantRequestedAmount"), grantMatchAmount: dollars("grantMatchAmount") } : {}; update.mutate({ id: campaign.id, ...fields }); }}><UnderwritingFields type={type} campaign={campaign} /><button disabled={update.isPending}>{update.isPending ? "Saving…" : "Save underwriting"}</button></form></details></article>;
}

function isStonepineWorkingDecision(campaign: any) {
  return String(campaign.financingTerms || "").includes("Internal planning decision (2026-10-07)")
    && Number(campaign.targetAmount) === 45_325_000
    && Number(campaign.loanToCostBps) === 7_000
    && Number(campaign.borrowerEquity) === 19_425_000;
}

function UnderwritingFields({ type, campaign }: { type: CampaignType; campaign: any }) {
  const field = (name: string, label: string, value: unknown, suffix?: string) => <label key={name}>{label}<span><input name={name} type="number" min="0" step={suffix === "%" ? "0.01" : "1"} defaultValue={value == null ? "" : String(value)} />{suffix && <i>{suffix}</i>}</span></label>;
  if (type === "company_equity") return <>{field("preMoneyValuation", "Pre-money valuation", campaign.preMoneyValuation)}{field("ownershipOffered", "Ownership offered", campaign.ownershipOfferedBps == null ? null : Number(campaign.ownershipOfferedBps) / 100, "%")}{field("monthlyBurn", "Monthly operating burn", campaign.monthlyBurn)}{field("currentCash", "Current unrestricted cash", campaign.currentCash)}{field("plannedHeadcount", "Planned hires", campaign.plannedHeadcount)}</>;
  if (type === "project_debt") return <>{field("interestRate", "Annual interest rate", campaign.interestRateBps == null ? null : Number(campaign.interestRateBps) / 100, "%")}{field("termMonths", "Loan term (months)", campaign.termMonths)}{field("loanToCost", "Loan-to-cost", campaign.loanToCostBps == null ? null : Number(campaign.loanToCostBps) / 100, "%")}{field("borrowerEquity", "Borrower equity", campaign.borrowerEquity)}</>;
  if (type === "project_equity") return <>{field("partnerContribution", "Partner contribution", campaign.partnerContribution)}{field("ceContribution", "CE contribution", campaign.ceContribution)}{field("ownershipOffered", "Partner ownership", campaign.ownershipOfferedBps == null ? null : Number(campaign.ownershipOfferedBps) / 100, "%")}{field("preferredReturn", "Preferred return", campaign.preferredReturnBps == null ? null : Number(campaign.preferredReturnBps) / 100, "%")}</>;
  if (type === "equipment") return <>{field("downPayment", "Down payment", campaign.downPayment)}{field("monthlyPayment", "Monthly payment", campaign.monthlyPayment)}{field("termMonths", "Term (months)", campaign.termMonths)}{field("interestRate", "Annual rate", campaign.interestRateBps == null ? null : Number(campaign.interestRateBps) / 100, "%")}{field("expectedUtilization", "Expected utilization", campaign.expectedUtilizationBps == null ? null : Number(campaign.expectedUtilizationBps) / 100, "%")}</>;
  if (type === "grants") return <>{field("grantRequestedAmount", "Grant request", campaign.grantRequestedAmount)}{field("grantMatchAmount", "Required match", campaign.grantMatchAmount)}</>;
  return <p>Classify this campaign to activate instrument underwriting.</p>;
}

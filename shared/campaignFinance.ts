export const campaignTypes = ["company_equity", "project_debt", "project_equity", "equipment", "grants", "unclassified"] as const;
export type CampaignType = typeof campaignTypes[number];
export const campaignMeta: Record<CampaignType, { label: string; purpose: string; obligation: string; milestones: string[] }> = {
  company_equity: { label: "Company equity", purpose: "Employees, engineering, software and operating runway", obligation: "Ownership and participation in company value", milestones: ["Investor research", "Meetings", "Diligence", "Equity terms", "Close & fund"] },
  project_debt: { label: "Project debt", purpose: "Land, construction, acquisition and refinancing", obligation: "Interest, principal repayment and collateral", milestones: ["Lender qualification", "Loan proposal", "Underwriting", "Closing conditions", "Close & draws"] },
  project_equity: { label: "Project equity / JV", purpose: "Equity participation in a specific project", obligation: "Project ownership and distribution waterfall", milestones: ["Partner qualification", "Project review", "Diligence", "JV agreement", "Contributions"] },
  equipment: { label: "Equipment finance", purpose: "Productive machinery and equipment", obligation: "Loan or lease payments and asset terms", milestones: ["Asset scope", "Quotes", "Credit review", "Agreement", "Delivery & funding"] },
  grants: { label: "Grants", purpose: "Eligible project or company program costs", obligation: "Eligibility, matching funds and reporting", milestones: ["Eligibility", "Application", "Review", "Award", "Disbursement"] },
  unclassified: { label: "Unclassified", purpose: "Select the financing instrument and recipient", obligation: "Not recorded", milestones: ["Define purpose", "Select instrument", "Assign recipient"] },
};
export function campaignTotals<T extends { campaignId?: number | null; requestedAmount?: number | null; committedAmount?: number | null; fundedAmount?: number | null; stage?: string }>(opportunities: T[], id: number, target: number | null) {
  const linked = opportunities.filter(row => row.campaignId === id);
  const pipeline = linked.filter(row => !["passed", "committed"].includes(row.stage || "")).reduce((sum, row) => sum + Number(row.requestedAmount || 0), 0);
  const committed = linked.reduce((sum, row) => sum + Number(row.committedAmount || 0), 0);
  const funded = linked.reduce((sum, row) => sum + Number(row.fundedAmount || 0), 0);
  return { linked, pipeline, committed, funded, gap: target == null ? null : Math.max(0, target - committed) };
}

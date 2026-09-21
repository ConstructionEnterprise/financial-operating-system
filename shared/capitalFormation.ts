export const capitalPaths = ["equity", "facility_jv", "equipment_finance", "grants"] as const;
export type CapitalPath = (typeof capitalPaths)[number];

export const capitalPathMeta: Record<CapitalPath, { label: string; shortLabel: string; description: string; defaultTarget: number }> = {
  equity: { label: "Equity Investors", shortLabel: "Equity", description: "Technology-company equity for software, robotics, engineering, and productization.", defaultTarget: 1_000_000 },
  facility_jv: { label: "JV / Facility Partners", shortLabel: "Facility JV", description: "Land, building, and facility capitalization separated from technology-company ownership.", defaultTarget: 0 },
  equipment_finance: { label: "Equipment Financing", shortLabel: "Equipment", description: "Asset-backed financing for productive machinery, robotics, fabrication, and conveyance.", defaultTarget: 0 },
  grants: { label: "Grants & Incentives", shortLabel: "Grants", description: "Non-dilutive federal, state, local, and strategic-program funding.", defaultTarget: 0 },
};

export const capitalOpportunityStages = ["identified", "researching", "outreach", "meeting", "diligence", "term_sheet", "committed", "passed"] as const;
export type CapitalOpportunityStage = (typeof capitalOpportunityStages)[number];

export type CapitalBucketInput = { capitalPath: CapitalPath; targetAmount: number | null };
export type CapitalOpportunityInput = { capitalPath: CapitalPath; requestedAmount: number | null; committedAmount: number | null; fundedAmount?: number | null; probability: number; stage: CapitalOpportunityStage; nextAction?: string | null; nextActionDueAt?: Date | string | null; organizationName?: string };

export type CapitalPathSummary = { capitalPath: CapitalPath; targetAmount: number; requestedAmount: number; committedAmount: number; fundedAmount: number; weightedPipelineAmount: number; expectedCapitalAmount: number; remainingGap: number; remainingExpectedGap: number; opportunityCount: number };

export function summarizeCapitalFormation(buckets: CapitalBucketInput[], opportunities: CapitalOpportunityInput[]): CapitalPathSummary[] {
  return capitalPaths.map((capitalPath) => {
    const targetAmount = Math.max(0, buckets.find((bucket) => bucket.capitalPath === capitalPath)?.targetAmount ?? capitalPathMeta[capitalPath].defaultTarget);
    const rows = opportunities.filter((opportunity) => opportunity.capitalPath === capitalPath && opportunity.stage !== "passed");
    const requestedAmount = rows.reduce((sum, row) => sum + Math.max(0, row.requestedAmount ?? 0), 0);
    const committedAmount = rows.reduce((sum, row) => sum + Math.max(0, row.committedAmount ?? 0), 0);
    const fundedAmount = rows.reduce((sum, row) => sum + Math.max(0, row.fundedAmount ?? 0), 0);
    const weightedPipelineAmount = rows.filter((row) => row.stage !== "committed").reduce((sum, row) => sum + Math.round(Math.max(0, row.requestedAmount ?? 0) * Math.min(100, Math.max(0, row.probability)) / 100), 0);
    const expectedCapitalAmount = committedAmount + weightedPipelineAmount;
    return { capitalPath, targetAmount, requestedAmount, committedAmount, fundedAmount, weightedPipelineAmount, expectedCapitalAmount, remainingGap: Math.max(0, targetAmount - committedAmount), remainingExpectedGap: Math.max(0, targetAmount - expectedCapitalAmount), opportunityCount: rows.length };
  });
}

export function rankCapitalActions(opportunities: CapitalOpportunityInput[], now = new Date()) {
  return opportunities.filter((opportunity) => opportunity.stage !== "passed" && opportunity.nextAction?.trim()).map((opportunity) => {
    const due = opportunity.nextActionDueAt ? new Date(opportunity.nextActionDueAt) : null;
    const urgency = due && due.getTime() < now.getTime() ? 2 : due && due.getTime() - now.getTime() <= 7 * 24 * 60 * 60 * 1000 ? 1 : 0;
    const impact = Math.max(0, (opportunity.requestedAmount ?? 0) - (opportunity.committedAmount ?? 0));
    return { ...opportunity, urgency, impact, score: impact + urgency * 1_000_000_000 };
  }).sort((left, right) => right.score - left.score);
}

export function formatCapitalAmount(amount: number): string {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(amount);
}

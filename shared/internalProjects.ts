import { capitalPaths, type CapitalPath } from "./capitalFormation";

export const internalProjectStrategyTypes = [...capitalPaths, "other"] as const;
export type InternalProjectStrategyType = (typeof internalProjectStrategyTypes)[number];
export type InternalProjectDataState = "actual" | "projected" | "estimated" | "missing";

export type InternalProjectCapitalNeed = {
  id: number;
  internalProjectId: number;
  amount?: number | null;
  amountDataState: InternalProjectDataState;
};

export type InternalProjectCapitalNeedStrategy = {
  capitalNeedId: number;
  strategyType: InternalProjectStrategyType;
};

export type InternalProjectCapitalOpportunity = {
  id: number;
  capitalPath: CapitalPath;
  internalProjectId?: number | null;
  projectName?: string | null;
  facilityName?: string | null;
  requestedAmount?: number | null;
  committedAmount?: number | null;
  fundedAmount?: number | null;
  stage: string;
};

const recordedAmount = (value: number | null | undefined) => typeof value === "number" && Number.isFinite(value) ? Math.max(value, 0) : null;
const normalized = (value: string | null | undefined) => value?.trim().toLocaleLowerCase() ?? "";

export function internalProjectOpportunityLinkReason(projectId: number, projectName: string, opportunity: InternalProjectCapitalOpportunity) {
  if (opportunity.internalProjectId === projectId) return "explicit Internal Project link";
  if (normalized(projectName) && normalized(projectName) === normalized(opportunity.projectName)) return "matching recorded project name";
  if (normalized(projectName) && normalized(projectName) === normalized(opportunity.facilityName)) return "matching recorded facility name";
  return null;
}

export function summarizeInternalProjectCapitalStack({ projectId, projectName, capitalRequirement, capitalNeeds, capitalNeedStrategies, opportunities }: {
  projectId: number;
  projectName: string;
  capitalRequirement?: number | null;
  capitalNeeds: InternalProjectCapitalNeed[];
  capitalNeedStrategies: InternalProjectCapitalNeedStrategy[];
  opportunities: InternalProjectCapitalOpportunity[];
}) {
  const needById = new Map(capitalNeeds.map((need) => [need.id, need]));
  const targetByStrategy = new Map<InternalProjectStrategyType, number>();
  const missingNeedIds = new Set<number>();
  for (const strategy of capitalNeedStrategies) {
    const need = needById.get(strategy.capitalNeedId);
    if (!need) continue;
    const amount = recordedAmount(need.amount);
    if (amount === null || need.amountDataState === "missing") {
      missingNeedIds.add(need.id);
      continue;
    }
    targetByStrategy.set(strategy.strategyType, (targetByStrategy.get(strategy.strategyType) ?? 0) + amount);
  }
  const linkedOpportunities = opportunities.filter((opportunity) => opportunity.stage !== "passed" && internalProjectOpportunityLinkReason(projectId, projectName, opportunity));
  const rows = internalProjectStrategyTypes.map((strategyType) => {
    const pathOpportunities = strategyType === "other" ? [] : linkedOpportunities.filter((opportunity) => opportunity.capitalPath === strategyType);
    const potential = pathOpportunities.reduce((sum, opportunity) => sum + (recordedAmount(opportunity.requestedAmount) ?? 0), 0);
    const committed = pathOpportunities.reduce((sum, opportunity) => sum + (recordedAmount(opportunity.committedAmount) ?? 0), 0);
    const funded = pathOpportunities.reduce((sum, opportunity) => sum + (recordedAmount(opportunity.fundedAmount) ?? 0), 0);
    return { strategyType, target: targetByStrategy.get(strategyType) ?? 0, potential, committed, funded, opportunityCount: pathOpportunities.length };
  });
  const requirementFromNeeds = capitalNeeds.length > 0 && missingNeedIds.size === 0 ? capitalNeeds.reduce((sum, need) => sum + (recordedAmount(need.amount) ?? 0), 0) : null;
  const explicitRequirement = recordedAmount(capitalRequirement);
  const totalRequirement = requirementFromNeeds ?? explicitRequirement;
  const totals = rows.reduce((summary, row) => ({ potential: summary.potential + row.potential, committed: summary.committed + row.committed, funded: summary.funded + row.funded }), { potential: 0, committed: 0, funded: 0 });
  return {
    rows,
    linkedOpportunities: linkedOpportunities.map((opportunity) => ({ ...opportunity, linkReason: internalProjectOpportunityLinkReason(projectId, projectName, opportunity)! })),
    missingCapitalNeedIds: Array.from(missingNeedIds),
    totals: { ...totals, target: totalRequirement ?? 0, capitalRequirement: totalRequirement, remainingCommittedGap: totalRequirement === null ? null : Math.max(totalRequirement - totals.committed, 0), remainingFundedGap: totalRequirement === null ? null : Math.max(totalRequirement - totals.funded, 0) },
  };
}

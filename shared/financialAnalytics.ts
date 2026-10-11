import { capitalPathMeta, capitalPaths, type CapitalPath } from "./capitalFormation.ts";

export type AnalyticsBucket = { capitalPath: CapitalPath; targetAmount: number | string | null };
export type AnalyticsOpportunity = {
  id: number;
  capitalPath: CapitalPath;
  organizationName: string;
  stage: string;
  requestedAmount: number | string | null;
  committedAmount: number | string | null;
  fundedAmount: number | string | null;
  probability: number | string | null;
  internalProjectId?: number | null;
  projectName?: string | null;
  facilityName?: string | null;
  campaignId?: number | null;
  nextAction?: string | null;
  nextActionDueAt?: Date | string | null;
  targetCloseAt?: Date | string | null;
};
export type AnalyticsProject = { id: number; projectName: string; capitalRequirement?: number | string | null; capitalRequirementDataState?: string | null };

const value = (input: unknown) => {
  const number = Number(input ?? 0);
  return Number.isFinite(number) ? Math.max(0, number) : 0;
};

export function buildCapitalPathAnalytics(buckets: AnalyticsBucket[], opportunities: AnalyticsOpportunity[]) {
  return capitalPaths.map((capitalPath) => {
    const active = opportunities.filter((row) => row.capitalPath === capitalPath && row.stage !== "passed");
    const storedTarget = buckets.find((bucket) => bucket.capitalPath === capitalPath)?.targetAmount;
    const target = value(storedTarget ?? capitalPathMeta[capitalPath].defaultTarget);
    const requested = active.reduce((sum, row) => sum + value(row.requestedAmount), 0);
    const committed = active.reduce((sum, row) => sum + value(row.committedAmount), 0);
    const funded = active.reduce((sum, row) => sum + value(row.fundedAmount), 0);
    const weighted = active.filter((row) => row.stage !== "committed").reduce((sum, row) => sum + value(row.requestedAmount) * Math.min(100, value(row.probability)) / 100, 0);
    return { capitalPath, name: capitalPathMeta[capitalPath].shortLabel, target, requested, weighted: Math.round(weighted), committed, funded, gap: Math.max(0, target - committed), opportunities: active.length };
  });
}

export function buildProjectCoverage(projects: AnalyticsProject[], portfolioProjects: any[] = [], opportunities: AnalyticsOpportunity[] = []) {
  return projects.map((project) => {
    const modeled = portfolioProjects.find((row) => Number(row.projectId) === project.id);
    const requirement = value(modeled?.capitalRequirement ?? modeled?.developmentCost ?? (project.capitalRequirementDataState === "missing" ? 0 : project.capitalRequirement));
    const linked = opportunities.filter((row) => row.stage !== "passed" && (row.internalProjectId === project.id || (!row.internalProjectId && [row.projectName, row.facilityName].some((name) => name?.trim().toLowerCase() === project.projectName.trim().toLowerCase()))));
    const committed = linked.reduce((sum, row) => sum + value(row.committedAmount), 0);
    const funded = linked.reduce((sum, row) => sum + value(row.fundedAmount), 0);
    const weighted = linked.filter((row) => row.stage !== "committed").reduce((sum, row) => sum + value(row.requestedAmount) * Math.min(100, value(row.probability)) / 100, 0);
    return {
      projectId: project.id,
      name: project.projectName,
      requirement,
      committed,
      funded,
      weighted: Math.round(weighted),
      gap: Math.max(0, requirement - committed),
      coverageBps: requirement ? Math.min(10_000, Math.round(committed / requirement * 10_000)) : 0,
      linkedOpportunities: linked.length,
      state: modeled?.planningDataState ?? project.capitalRequirementDataState ?? "missing",
      developmentCost: value(modeled?.developmentCost),
      annualRevenue: value(modeled?.annualRevenue),
      annualNoi: value(modeled?.annualNoi),
      costPerUnit: value(modeled?.costPerUnit),
      costPerSf: value(modeled?.costPerSf),
      scenario: modeled?.primaryScenarioName ?? null,
    };
  });
}

export function buildStageAnalytics(opportunities: AnalyticsOpportunity[], capitalPath: CapitalPath | "all" = "all") {
  const stages = ["identified", "researching", "outreach", "meeting", "diligence", "term_sheet", "committed", "passed"];
  const scoped = capitalPath === "all" ? opportunities : opportunities.filter((row) => row.capitalPath === capitalPath);
  return stages.map((stage) => ({
    stage,
    name: stage.replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase()),
    count: scoped.filter((row) => row.stage === stage).length,
    amount: scoped.filter((row) => row.stage === stage).reduce((sum, row) => sum + value(row.requestedAmount), 0),
  }));
}

export function summarizeEnterpriseAnalytics(input: { buckets: AnalyticsBucket[]; opportunities: AnalyticsOpportunity[]; projects: AnalyticsProject[]; portfolioProjects?: any[] }) {
  const capitalPaths = buildCapitalPathAnalytics(input.buckets, input.opportunities);
  const projectCoverage = buildProjectCoverage(input.projects, input.portfolioProjects, input.opportunities);
  return {
    capitalPaths,
    projectCoverage,
    totals: {
      requirement: projectCoverage.reduce((sum, row) => sum + row.requirement, 0),
      target: capitalPaths.reduce((sum, row) => sum + row.target, 0),
      weighted: capitalPaths.reduce((sum, row) => sum + row.weighted, 0),
      committed: capitalPaths.reduce((sum, row) => sum + row.committed, 0),
      funded: capitalPaths.reduce((sum, row) => sum + row.funded, 0),
      projectGap: projectCoverage.reduce((sum, row) => sum + row.gap, 0),
    },
  };
}

export const historicalPlanningMarker = "HISTORICAL_PLANNING" as const;

export function isHistoricalPlanningScenario(notes: string | null | undefined) {
  return Boolean(notes?.includes(historicalPlanningMarker));
}

export function historicalPlanningDisclosure(notes: string | null | undefined) {
  if (!isHistoricalPlanningScenario(notes)) return null;
  return "Historical planning scenario · user-supplied source · effective date unknown · excluded from actual ROI, IRR, payback, and capital-commitment outputs.";
}

type HistoricalProject = { id: number; projectName: string };
type HistoricalModel = { id: number; internalProjectId: number };
type HistoricalScenario = { id: number; modelId: number; scenarioName: string; scenarioStatus: string; notes: string | null };
type HistoricalAssumption = { scenarioId: number; metric: string; value: number | null; dataState: string; sourceReference: string | null; effectiveAt: Date | null; ownerName: string | null };

const primaryMetrics = ["total_development_cost", "total_cost", "facility_capex", "unclassified_planning_figure"];

export function buildHistoricalPlanningComparison(projects: HistoricalProject[], models: HistoricalModel[], scenarios: HistoricalScenario[], assumptions: HistoricalAssumption[]) {
  const modelProject = new Map(models.map((model) => [model.id, model.internalProjectId]));
  return projects.map((project) => {
    const scenarioRows = scenarios.filter((scenario) => modelProject.get(scenario.modelId) === project.id && isHistoricalPlanningScenario(scenario.notes)).map((scenario) => {
      const scenarioAssumptions = assumptions.filter((assumption) => assumption.scenarioId === scenario.id && assumption.dataState === "estimated" && assumption.value !== null);
      const primary = primaryMetrics.map((metric) => scenarioAssumptions.find((assumption) => assumption.metric === metric)).find(Boolean) ?? scenarioAssumptions[0] ?? null;
      return {
        scenarioId: scenario.id,
        scenarioName: scenario.scenarioName,
        scenarioStatus: scenario.scenarioStatus,
        primaryMetric: primary ? { metric: primary.metric, value: primary.value, sourceReference: primary.sourceReference, effectiveAt: primary.effectiveAt, ownerName: primary.ownerName } : null,
        assumptionCount: scenarioAssumptions.length,
        disclosure: historicalPlanningDisclosure(scenario.notes),
      };
    });
    return { projectId: project.id, projectName: project.projectName, scenarios: scenarioRows, hasRecoverableHistoricalPlanning: scenarioRows.length > 0 };
  });
}

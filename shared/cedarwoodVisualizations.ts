import { cedarwoodHistoricalControls, cedarwoodHistoricalControlTotal } from "./cedarwoodHistoricalPlanning";

export function cedarwoodHistoricalFinancialControlChartData() {
  return [
    { metric: "Development cost", amount: cedarwoodHistoricalControls.totalDevelopmentCost },
    { metric: "Annual NOI", amount: cedarwoodHistoricalControls.historicalNoi },
  ];
}

export function cedarwoodCostBasisSensitivityChartData() {
  return [
    { basis: `$${cedarwoodHistoricalControls.constructionBasisLow}/SF`, dollarsPerSf: cedarwoodHistoricalControls.constructionBasisLow, impliedSf: cedarwoodHistoricalControls.grossSfLow },
    { basis: `$${cedarwoodHistoricalControls.constructionBasisCentral}/SF`, dollarsPerSf: cedarwoodHistoricalControls.constructionBasisCentral, impliedSf: cedarwoodHistoricalControls.grossSfCentral },
    { basis: `$${cedarwoodHistoricalControls.constructionBasisHigh}/SF`, dollarsPerSf: cedarwoodHistoricalControls.constructionBasisHigh, impliedSf: cedarwoodHistoricalControls.grossSfHigh },
  ];
}

export function assertCedarwoodVisualizationControls() {
  const financial = cedarwoodHistoricalFinancialControlChartData();
  const sensitivity = cedarwoodCostBasisSensitivityChartData();
  if (financial[0]?.amount !== cedarwoodHistoricalControlTotal) throw new Error("Cedarwood historical development-cost chart must use the $40M control total.");
  if (financial[1]?.amount !== 4_750_000) throw new Error("Cedarwood historical NOI chart must use the authorized $4.75M control.");
  if (sensitivity[1]?.dollarsPerSf !== 160 || sensitivity[1]?.impliedSf !== 250_000) throw new Error("Cedarwood central cost-basis sensitivity must use $160/SF and 250,000 SF.");
  return true;
}

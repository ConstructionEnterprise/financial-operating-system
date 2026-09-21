import { capitalPaths, type CapitalPath } from "./capitalFormation";

export type CrossDomainCapitalState = "potential" | "committed" | "funded";
export type CrossDomainDataState = "actual" | "projected" | "missing";

export type CrossDomainProject = { id: number; projectName: string; capitalRequirement?: number | null };
export type CrossDomainRoiSource = { id: number; projectId: number; capitalOpportunityId?: number | null; capitalPath: CapitalPath; sourceName: string };
export type CrossDomainCapitalOpportunity = { id: number; capitalPath: CapitalPath; organizationName: string; opportunityName?: string | null; projectName?: string | null; facilityName?: string | null; stage: string; requestedAmount?: number | null; committedAmount?: number | null; fundedAmount?: number | null };
export type CrossDomainRentalRequirement = { id: number; projectName?: string | null; facilityName?: string | null; equipmentName: string; status: string };
export type CrossDomainRentalQuote = { requirementId: number; quoteStatus: string; estimatedTotal?: number | null };
export type CrossDomainActiveRental = { requirementId: number; status: string; actualRentalCost?: number | null; actualDeliveryFee?: number | null; actualPickupFee?: number | null };

const present = (value: number | null | undefined): value is number => typeof value === "number" && Number.isFinite(value);
const amount = (value: number | null | undefined) => present(value) ? Math.max(0, value) : 0;
const normalized = (value: string | null | undefined) => value?.trim().toLocaleLowerCase() ?? "";
const sameLabel = (left: string | null | undefined, right: string | null | undefined) => Boolean(normalized(left) && normalized(right) && normalized(left) === normalized(right));

export function projectLinkReason(project: CrossDomainProject, source: CrossDomainRoiSource | undefined, opportunity: CrossDomainCapitalOpportunity) {
  if (source?.capitalOpportunityId === opportunity.id) return "explicit ROI source link";
  if (sameLabel(project.projectName, opportunity.projectName)) return "matching recorded project name";
  if (sameLabel(project.projectName, opportunity.facilityName)) return "matching recorded facility name";
  return null;
}

export function summarizeCrossDomainRoi({ project, sources, opportunities, rentalRequirements, rentalQuotes, activeRentals }: { project: CrossDomainProject; sources: CrossDomainRoiSource[]; opportunities: CrossDomainCapitalOpportunity[]; rentalRequirements: CrossDomainRentalRequirement[]; rentalQuotes: CrossDomainRentalQuote[]; activeRentals: CrossDomainActiveRental[] }) {
  const projectSources = sources.filter((source) => source.projectId === project.id);
  const sourceByOpportunity = new Map(projectSources.filter((source) => source.capitalOpportunityId).map((source) => [source.capitalOpportunityId!, source]));
  const linkedOpportunities = opportunities.map((opportunity) => ({ opportunity, source: sourceByOpportunity.get(opportunity.id), linkReason: projectLinkReason(project, sourceByOpportunity.get(opportunity.id), opportunity) })).filter((row) => row.linkReason && row.opportunity.stage !== "passed");
  const rows = linkedOpportunities.flatMap(({ opportunity, source, linkReason }) => ([
    { id: `${opportunity.id}:potential`, capitalPath: opportunity.capitalPath, capitalState: "potential" as const, dataState: "projected" as const, amount: amount(opportunity.requestedAmount), sourceName: source?.sourceName ?? opportunity.opportunityName ?? opportunity.organizationName, opportunityId: opportunity.id, linkReason, includedInCapitalization: false },
    { id: `${opportunity.id}:committed`, capitalPath: opportunity.capitalPath, capitalState: "committed" as const, dataState: "projected" as const, amount: amount(opportunity.committedAmount), sourceName: source?.sourceName ?? opportunity.opportunityName ?? opportunity.organizationName, opportunityId: opportunity.id, linkReason, includedInCapitalization: amount(opportunity.committedAmount) > 0 },
    { id: `${opportunity.id}:funded`, capitalPath: opportunity.capitalPath, capitalState: "funded" as const, dataState: "actual" as const, amount: amount(opportunity.fundedAmount), sourceName: source?.sourceName ?? opportunity.opportunityName ?? opportunity.organizationName, opportunityId: opportunity.id, linkReason, includedInCapitalization: amount(opportunity.fundedAmount) > 0 },
  ]).filter((row) => row.amount > 0));
  const linkedWithoutRecordedCapital = linkedOpportunities.filter(({ opportunity }) => amount(opportunity.requestedAmount) === 0 && amount(opportunity.committedAmount) === 0 && amount(opportunity.fundedAmount) === 0).map(({ opportunity, source, linkReason }) => ({ id: opportunity.id, capitalPath: opportunity.capitalPath, sourceName: source?.sourceName ?? opportunity.opportunityName ?? opportunity.organizationName, linkReason }));
  const byPath = capitalPaths.map((capitalPath) => {
    const pathRows = rows.filter((row) => row.capitalPath === capitalPath);
    return { capitalPath, potential: pathRows.filter((row) => row.capitalState === "potential").reduce((total, row) => total + row.amount, 0), committed: pathRows.filter((row) => row.capitalState === "committed").reduce((total, row) => total + row.amount, 0), funded: pathRows.filter((row) => row.capitalState === "funded").reduce((total, row) => total + row.amount, 0) };
  });
  const total = (state: CrossDomainCapitalState) => rows.filter((row) => row.capitalState === state).reduce((sum, row) => sum + row.amount, 0);
  const rentalRequirementsForProject = rentalRequirements.filter((requirement) => sameLabel(project.projectName, requirement.projectName) || sameLabel(project.projectName, requirement.facilityName));
  const rentalRequirementIds = new Set(rentalRequirementsForProject.map((requirement) => requirement.id));
  const selectedQuoteExposure = rentalQuotes.filter((quote) => rentalRequirementIds.has(quote.requirementId) && quote.quoteStatus === "selected").reduce((sum, quote) => sum + amount(quote.estimatedTotal), 0);
  const actualRentalExposure = activeRentals.filter((rental) => rentalRequirementIds.has(rental.requirementId)).reduce((sum, rental) => sum + amount(rental.actualRentalCost) + amount(rental.actualDeliveryFee) + amount(rental.actualPickupFee), 0);
  const committed = total("committed");
  const funded = total("funded");
  const capitalRequirement = present(project.capitalRequirement) ? project.capitalRequirement : null;
  return {
    rows,
    byPath,
    totals: { potential: total("potential"), committed, funded, capitalRequirement, remainingCommittedGap: capitalRequirement === null ? null : Math.max(capitalRequirement - committed, 0), remainingFundedGap: capitalRequirement === null ? null : Math.max(capitalRequirement - funded, 0), capitalizationDataState: funded > 0 ? "actual" as CrossDomainDataState : committed > 0 ? "projected" as CrossDomainDataState : "missing" as CrossDomainDataState },
    composition: { equity: byPath.find((row) => row.capitalPath === "equity")!, jv: byPath.find((row) => row.capitalPath === "facility_jv")!, equipment: byPath.find((row) => row.capitalPath === "equipment_finance")!, nonDilutive: byPath.find((row) => row.capitalPath === "grants")! },
    rentals: { requirementCount: rentalRequirementsForProject.length, selectedQuoteExposure: selectedQuoteExposure || null, actualRentalExposure: actualRentalExposure || null, state: actualRentalExposure > 0 ? "actual" as CrossDomainDataState : selectedQuoteExposure > 0 ? "projected" as CrossDomainDataState : "missing" as CrossDomainDataState },
    linkedWithoutRecordedCapital,
    unlinkedProjectSources: projectSources.filter((source) => !source.capitalOpportunityId).map((source) => ({ id: source.id, sourceName: source.sourceName, capitalPath: source.capitalPath })),
  };
}

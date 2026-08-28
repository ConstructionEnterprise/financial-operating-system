export const texasJvRegions = ["DFW", "Houston", "Austin", "San Antonio", "Port Houston", "Beaumont / Port Arthur", "Freeport", "Corpus Christi", "Brownsville", "Laredo", "Port San Antonio", "AllianceTexas", "El Paso", "Rio Grande Valley", "Midland / Odessa", "Other Texas"] as const;
export const jvPartnerArchetypes = ["industrial_developer", "multifamily_residential_developer", "landowner_land_developer", "facility_manufacturing_partner", "real_estate_investment_development", "logistics_transportation_partner", "economic_development_strategic_partner"] as const;
export type JvPartnerPriority = "A" | "B" | "C";
export type JvProspectStatus = "prospect" | "research" | "qualified" | "converted" | "passed";

export type JvProspectInput = { partnerType: typeof jvPartnerArchetypes[number]; region: typeof texasJvRegions[number]; assetFocus?: string | null; developmentFocus?: string | null; jvExperience?: string | null; landContributionPotential?: string | null; capitalContributionPotential?: string | null; developmentContributionPotential?: string | null; facilityContributionPotential?: string | null; strategicFit?: "High" | "Medium" | "Low" | null; jvThesis?: string | null };

export function scoreJvProspect(input: JvProspectInput): { priority: JvPartnerPriority; score: number; rationale: string } {
  let score = 0;
  if (["industrial_developer", "landowner_land_developer", "facility_manufacturing_partner", "real_estate_investment_development"].includes(input.partnerType)) score += 3;
  if (["DFW", "Houston", "Austin", "San Antonio", "AllianceTexas", "Port Houston", "Port San Antonio"].includes(input.region)) score += 2;
  if (input.strategicFit === "High") score += 3; else if (input.strategicFit === "Medium") score += 1;
  if (input.jvExperience?.trim()) score += 1;
  if ([input.landContributionPotential, input.capitalContributionPotential, input.developmentContributionPotential, input.facilityContributionPotential].some((value) => value === "Yes")) score += 1;
  const priority: JvPartnerPriority = score >= 7 ? "A" : score >= 4 ? "B" : "C";
  return { priority, score, rationale: priority === "A" ? "Strategic candidate for JV qualification." : priority === "B" ? "Potential fit requiring further qualification." : "Market intelligence record; not an immediate outreach target." };
}

export function summarizeJvProspectRegions(prospects: Array<{ region?: string | null }>): Array<{ region: string; count: number }> {
  const counts = new Map<string, number>();
  prospects.forEach((prospect) => {
    const region = prospect.region?.trim() || "Unspecified Texas region";
    counts.set(region, (counts.get(region) ?? 0) + 1);
  });
  return Array.from(counts.entries()).map(([region, count]) => ({ region, count })).sort((left, right) => right.count - left.count || left.region.localeCompare(right.region));
}

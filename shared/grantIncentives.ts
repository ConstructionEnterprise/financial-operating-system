export const GRANT_MECHANISM_TYPES = ["grant", "tax_credit", "tax_abatement", "rebate", "loan", "forgivable_loan", "workforce_incentive", "infrastructure_incentive", "economic_development_incentive", "research_funding", "technical_assistance", "other"] as const;
export type GrantMechanismType = (typeof GRANT_MECHANISM_TYPES)[number];
export const GRANT_PROGRAM_STATES = ["research", "qualified", "passed"] as const;
export const GRANT_APPLICATION_STATES = ["not_started", "drafting", "submitted", "under_review", "awarded", "declined", "withdrawn", "closed"] as const;
export const GRANT_DATA_STATES = ["actual", "projected", "estimated", "missing"] as const;

export const GRANT_QUALIFICATION_WEIGHTS = { ceEligibility: 2, projectEligibility: 2, geographicEligibility: 1, manufacturingRelevance: 1, roboticsAutomationRelevance: 1, activeApplicationWindow: 1, strategicFit: 1 } as const;
export type GrantQualificationEvidence = { ceEligibility: boolean | null; projectEligibility: boolean | null; geographicEligibility: boolean | null; manufacturingRelevance: boolean | null; roboticsAutomationRelevance: boolean | null; activeApplicationWindow: boolean | null; strategicFit: boolean | null };

export function scoreGrantOpportunity(evidence: GrantQualificationEvidence) {
  const entries = Object.entries(GRANT_QUALIFICATION_WEIGHTS) as Array<[keyof GrantQualificationEvidence, number]>;
  const supported = entries.filter(([key]) => evidence[key] === true);
  const missing = entries.filter(([key]) => evidence[key] === null).map(([key]) => key);
  const score = supported.reduce((total, [key]) => total + GRANT_QUALIFICATION_WEIGHTS[key], 0);
  const coreEligibilitySatisfied = evidence.ceEligibility === true && evidence.projectEligibility === true;
  const priority = coreEligibilitySatisfied && score >= 7 ? "A" : coreEligibilitySatisfied && score >= 4 ? "B" : "C";
  const rationale = [
    `Priority ${priority} uses recorded qualification evidence only (${score}/${Object.values(GRANT_QUALIFICATION_WEIGHTS).reduce((total, weight) => total + weight, 0)} points).`,
    coreEligibilitySatisfied ? "CE and project eligibility are recorded as supported." : "CE and/or project eligibility is not yet supported.",
    missing.length ? `Missing evidence: ${missing.join(", ")}.` : "No qualification evidence fields are missing.",
  ].join(" ");
  return { score, priority, rationale, missing };
}

export function calculateNonDilutiveCapitalLeverage(input: { awardedAmount?: number | null; matchAmount?: number | null }) {
  if (input.awardedAmount === null || input.awardedAmount === undefined || input.matchAmount === null || input.matchAmount === undefined) return { leverage: null, unavailableReason: "Non-dilutive leverage unavailable — awarded amount or required match is missing." };
  if (input.matchAmount <= 0) return { leverage: null, unavailableReason: "Non-dilutive leverage unavailable — required match must be greater than zero." };
  return { leverage: input.awardedAmount / input.matchAmount, unavailableReason: null };
}

export function summarizeGrantCapitalState(input: { requestedAmount?: number | null; awardedAmount?: number | null; fundedAmount?: number | null }) {
  const requested = input.requestedAmount ?? null;
  const awarded = input.awardedAmount ?? null;
  const funded = input.fundedAmount ?? null;
  return { requested, awarded, funded, awardGap: requested !== null && awarded !== null ? requested - awarded : null, unfundedAwardBalance: awarded !== null && funded !== null ? awarded - funded : null };
}

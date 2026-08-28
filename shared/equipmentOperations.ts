export const equipmentRentalRegions = ["Dallas–Fort Worth", "Houston", "Austin", "San Antonio", "Corpus Christi", "Beaumont / Port Arthur", "Laredo", "El Paso", "Rio Grande Valley", "Waco", "East Texas", "Midland / Odessa", "Amarillo", "Lubbock", "Other Texas"] as const;
export const equipmentRentalCategories = ["Heavy Equipment", "Material Handling", "Construction Support", "Access", "Specialty / Industrial"] as const;
export type EquipmentVendorPriority = "A" | "B" | "C";

type VendorScoringInput = { equipmentCategories?: string | null; region?: string | null; deliveryAvailable?: "Yes" | "No" | "Unknown"; pickupAvailable?: "Yes" | "No" | "Unknown"; operatorServices?: "Yes" | "No" | "Unknown"; shortTermRental?: "Yes" | "No" | "Unknown"; longTermRental?: "Yes" | "No" | "Unknown"; serviceMaintenance?: "Yes" | "No" | "Unknown"; strategicFit?: "High" | "Medium" | "Low" };
type EquipmentEconomicsInput = { equipmentCost?: number | null; downPayment?: number | null; monthlyPayment?: number | null; termMonths?: number | null; residualBuyout?: number | null; financingCost?: number | null; incrementalRevenue?: number | null; operatingSavings?: number | null; economicsPeriodMonths?: number | null; rentalTermMonths?: number | null; rentalTotal?: number | null };

const recorded = (value?: number | null) => typeof value === "number" && Number.isFinite(value);
const ratio = (numerator?: number | null, denominator?: number | null) => recorded(numerator) && recorded(denominator) && denominator! > 0 ? numerator! / denominator! : null;

export function scoreEquipmentRentalVendor(vendor: VendorScoringInput) {
  const signals = { equipmentCoverage: Boolean(vendor.equipmentCategories?.trim()), geographicCoverage: Boolean(vendor.region?.trim() && vendor.region !== "Other Texas"), delivery: vendor.deliveryAvailable === "Yes", service: vendor.serviceMaintenance === "Yes" || vendor.operatorServices === "Yes", rentalAvailability: vendor.shortTermRental === "Yes" || vendor.longTermRental === "Yes", strategicFit: vendor.strategicFit === "High" ? 2 : vendor.strategicFit === "Medium" ? 1 : 0 };
  const score = (signals.equipmentCoverage ? 25 : 0) + (signals.geographicCoverage ? 15 : 0) + (signals.delivery ? 15 : 0) + (signals.service ? 15 : 0) + (signals.rentalAvailability ? 15 : 0) + (signals.strategicFit * 7.5);
  const evidenceCount = [signals.equipmentCoverage, signals.geographicCoverage, signals.delivery, signals.service, signals.rentalAvailability, signals.strategicFit > 0].filter(Boolean).length;
  const priority: EquipmentVendorPriority = score >= 70 && evidenceCount >= 4 ? "A" : score >= 40 && evidenceCount >= 3 ? "B" : "C";
  const rationale = `${evidenceCount} recorded qualification signals: ${signals.equipmentCoverage ? "equipment coverage" : "coverage not recorded"}; ${signals.geographicCoverage ? "regional coverage" : "region not yet specific"}; ${signals.delivery ? "delivery" : "delivery not confirmed"}; ${signals.service ? "service support" : "service not confirmed"}; ${signals.rentalAvailability ? "rental availability" : "rental term availability not confirmed"}; ${vendor.strategicFit?.toLowerCase() || "low"} strategic fit.`;
  return { score, priority, rationale };
}

export function calculateRentalTermMonths(start?: Date | null, end?: Date | null) {
  if (!start || !end || end <= start) return null;
  const months = (end.getUTCFullYear() - start.getUTCFullYear()) * 12 + end.getUTCMonth() - start.getUTCMonth();
  return months > 0 ? months : null;
}

export function calculateEquipmentEconomics(input: EquipmentEconomicsInput) {
  const periodBenefit = recorded(input.incrementalRevenue) && recorded(input.operatingSavings) ? input.incrementalRevenue! + input.operatingSavings! : null;
  const monthlyOperatingBenefit = ratio(periodBenefit, input.economicsPeriodMonths);
  const capexPaybackMonths = ratio(input.equipmentCost, monthlyOperatingBenefit);
  const financingCashOutlay = recorded(input.downPayment) && recorded(input.monthlyPayment) && recorded(input.termMonths) ? input.downPayment! + input.monthlyPayment! * input.termMonths! + (input.residualBuyout ?? 0) : null;
  const impliedFinancingCost = recorded(input.financingCost) ? input.financingCost! : recorded(financingCashOutlay) && recorded(input.equipmentCost) ? financingCashOutlay! - input.equipmentCost! : null;
  const comparableFinancingOutlay = recorded(input.downPayment) && recorded(input.monthlyPayment) && recorded(input.termMonths) && recorded(input.rentalTermMonths) ? input.downPayment! + input.monthlyPayment! * Math.min(input.termMonths!, input.rentalTermMonths!) + (input.rentalTermMonths! >= input.termMonths! ? input.residualBuyout ?? 0 : 0) : null;
  const rentalVsAcquireCashDifference = recorded(input.rentalTotal) && recorded(comparableFinancingOutlay) ? input.rentalTotal! - comparableFinancingOutlay! : null;
  const operatingRoi = recorded(periodBenefit) && recorded(input.equipmentCost) && input.equipmentCost! > 0 ? periodBenefit! / input.equipmentCost! : null;
  const missing = [] as string[];
  if (monthlyOperatingBenefit === null) missing.push("incremental revenue, operating savings, and an economics period");
  if (financingCashOutlay === null) missing.push("down payment, monthly payment, and term");
  if (input.rentalTotal === null || input.rentalTotal === undefined || comparableFinancingOutlay === null) missing.push("a comparable rental total and rental term");
  return { periodBenefit, monthlyOperatingBenefit, capexPaybackMonths, financingCashOutlay, impliedFinancingCost, comparableFinancingOutlay, rentalVsAcquireCashDifference, operatingRoi, state: missing.length ? "missing" as const : "projected" as const, unavailableReason: missing.length ? `Comparison unavailable — record ${missing.join("; ")}.` : null };
}

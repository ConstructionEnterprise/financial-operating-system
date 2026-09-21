import { describe, expect, it } from "vitest";
import { calculateEquipmentEconomics, scoreEquipmentRentalVendor } from "../shared/equipmentOperations";

describe("equipment operations calculations", () => {
  it("requires multiple recorded vendor signals before assigning high qualification priority", () => {
    const high = scoreEquipmentRentalVendor({ equipmentCategories: "Material handling", region: "Houston", deliveryAvailable: "Yes", serviceMaintenance: "Yes", shortTermRental: "Yes", strategicFit: "High" });
    const incomplete = scoreEquipmentRentalVendor({ equipmentCategories: "Material handling", region: "Other Texas", strategicFit: "High" });
    expect(high.priority).toBe("A");
    expect(incomplete.priority).toBe("C");
    expect(incomplete.rationale).toContain("delivery not confirmed");
  });

  it("keeps equipment financing and rental comparison unavailable when comparable terms are not recorded", () => {
    const result = calculateEquipmentEconomics({ equipmentCost: 100_000, incrementalRevenue: 30_000, operatingSavings: 10_000 });
    expect(result.monthlyOperatingBenefit).toBeNull();
    expect(result.financingCashOutlay).toBeNull();
    expect(result.rentalVsAcquireCashDifference).toBeNull();
    expect(result.unavailableReason).toContain("economics period");
  });

  it("calculates a transparent cash comparison from user-entered finance, operating, and rental values", () => {
    const result = calculateEquipmentEconomics({ equipmentCost: 120_000, downPayment: 20_000, monthlyPayment: 2_000, termMonths: 36, residualBuyout: 5_000, incrementalRevenue: 4_000, operatingSavings: 1_000, economicsPeriodMonths: 1, rentalTermMonths: 12, rentalTotal: 48_000 });
    expect(result.monthlyOperatingBenefit).toBe(5_000);
    expect(result.capexPaybackMonths).toBe(24);
    expect(result.financingCashOutlay).toBe(97_000);
    expect(result.comparableFinancingOutlay).toBe(44_000);
    expect(result.rentalVsAcquireCashDifference).toBe(4_000);
    expect(result.operatingRoi).toBeCloseTo(1 / 24);
    expect(result.unavailableReason).toBeNull();
  });
});

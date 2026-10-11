import { describe, expect, it } from "vitest";
import { marketDebtSensitivity } from "./marketDebtScenario";

describe("market debt sensitivity", () => {
  it("keeps loan and sponsor equity within the recorded project requirement", () => {
    const result = marketDebtSensitivity(64_750_000, 70, 11);
    expect(result.loan).toBe(45_325_000);
    expect(result.borrowerEquity).toBe(19_425_000);
    expect(result.loan + result.borrowerEquity).toBe(64_750_000);
    expect(result.fullDrawMonthlyInterest).toBeCloseTo(415_479.1667, 2);
  });

  it("does not imply capital for an unrecorded requirement", () => {
    expect(marketDebtSensitivity(0, 70, 11)).toEqual({ loan: 0, borrowerEquity: 0, fullDrawMonthlyInterest: 0 });
  });
});

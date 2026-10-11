import { describe, expect, it } from "vitest";
import { buildProjectionDriverSchedule } from "./projectionDriverSchedule";

const drivers = {
  horizonMonths: 36,
  saleUnits: 170,
  rentalUnits: 30,
  salePricePerHome: 400_000,
  monthlyRentPerHome: 2_500,
  salesStartMonth: 13,
  salesEndMonth: 30,
  leaseStartMonth: 16,
  leaseEndMonth: 24,
  sellingExpenseBps: null,
  rentalOperatingExpenseBps: null,
};

describe("buildProjectionDriverSchedule", () => {
  it("distributes every home exactly once and preserves missing operating costs", () => {
    const rows = buildProjectionDriverSchedule(drivers);
    expect(rows).toHaveLength(36);
    expect(rows.reduce((sum, row) => sum + row.homesSold, 0)).toBe(170);
    expect(rows.reduce((sum, row) => sum + row.saleRevenue, 0)).toBe(68_000_000);
    expect(rows[0].revenue).toBe(0);
    expect(rows[0].operatingCost).toBeNull();
    expect(rows[35].occupiedRentals).toBe(30);
    expect(rows[35].rentalRevenue).toBe(75_000);
  });

  it("only computes rental operating costs when an explicit percentage is entered", () => {
    const rows = buildProjectionDriverSchedule({ ...drivers, sellingExpenseBps: 600, rentalOperatingExpenseBps: 3_500 });
    expect(rows[35].operatingCost).toBe(-26_250);
    expect(rows[0].operatingCost).toBe(0);
  });

  it("rejects a schedule outside the model horizon", () => {
    expect(() => buildProjectionDriverSchedule({ ...drivers, salesEndMonth: 37 })).toThrow();
  });

  it("does not treat rental-only expenses as a complete operating-cost series", () => {
    expect(() => buildProjectionDriverSchedule({ ...drivers, rentalOperatingExpenseBps: 3_500 })).toThrow();
  });
});

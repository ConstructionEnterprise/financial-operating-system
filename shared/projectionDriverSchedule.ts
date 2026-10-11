export type ProjectionScheduleDrivers = {
  horizonMonths: number;
  saleUnits: number;
  rentalUnits: number;
  salePricePerHome: number;
  monthlyRentPerHome: number;
  salesStartMonth: number;
  salesEndMonth: number;
  leaseStartMonth: number;
  leaseEndMonth: number;
  sellingExpenseBps: number | null;
  rentalOperatingExpenseBps: number | null;
};

export type GeneratedProjectionMonth = {
  month: number;
  homesSold: number;
  occupiedRentals: number;
  saleRevenue: number;
  rentalRevenue: number;
  revenue: number;
  operatingCost: number | null;
};

const evenlyDistribute = (units: number, start: number, end: number, month: number) => {
  if (month < start || month > end) return 0;
  const duration = end - start + 1;
  return Math.floor((month - start + 1) * units / duration) - Math.floor((month - start) * units / duration);
};

export function buildProjectionDriverSchedule(drivers: ProjectionScheduleDrivers): GeneratedProjectionMonth[] {
  const { horizonMonths, saleUnits, rentalUnits, salePricePerHome, monthlyRentPerHome, salesStartMonth, salesEndMonth, leaseStartMonth, leaseEndMonth, sellingExpenseBps, rentalOperatingExpenseBps } = drivers;
  if (![horizonMonths, saleUnits, rentalUnits, salePricePerHome, monthlyRentPerHome, salesStartMonth, salesEndMonth, leaseStartMonth, leaseEndMonth].every(Number.isFinite)
    || !Number.isInteger(horizonMonths) || horizonMonths < 1 || !Number.isInteger(saleUnits) || saleUnits < 0 || !Number.isInteger(rentalUnits) || rentalUnits < 0
    || salePricePerHome < 0 || monthlyRentPerHome < 0 || !Number.isInteger(salesStartMonth) || !Number.isInteger(salesEndMonth) || !Number.isInteger(leaseStartMonth) || !Number.isInteger(leaseEndMonth)
    || salesStartMonth < 1 || salesEndMonth > horizonMonths || salesStartMonth > salesEndMonth
    || leaseStartMonth < 1 || leaseEndMonth > horizonMonths || leaseStartMonth > leaseEndMonth
    || (sellingExpenseBps === null) !== (rentalOperatingExpenseBps === null)
    || (sellingExpenseBps !== null && (!Number.isFinite(sellingExpenseBps) || sellingExpenseBps < 0 || sellingExpenseBps > 10_000))
    || (rentalOperatingExpenseBps !== null && (!Number.isFinite(rentalOperatingExpenseBps) || rentalOperatingExpenseBps < 0 || rentalOperatingExpenseBps > 10_000))) {
    throw new Error("Enter valid unit counts, prices, and schedule months within the model horizon.");
  }
  let occupiedRentals = 0;
  return Array.from({ length: horizonMonths }, (_, index) => {
    const month = index + 1;
    const homesSold = evenlyDistribute(saleUnits, salesStartMonth, salesEndMonth, month);
    occupiedRentals += evenlyDistribute(rentalUnits, leaseStartMonth, leaseEndMonth, month);
    const saleRevenue = Math.round(homesSold * salePricePerHome);
    const rentalRevenue = Math.round(occupiedRentals * monthlyRentPerHome);
    return {
      month, homesSold, occupiedRentals, saleRevenue, rentalRevenue,
      revenue: saleRevenue + rentalRevenue,
      operatingCost: sellingExpenseBps === null || rentalOperatingExpenseBps === null ? null : -Math.round((saleRevenue * sellingExpenseBps + rentalRevenue * rentalOperatingExpenseBps) / 10_000),
    };
  });
}

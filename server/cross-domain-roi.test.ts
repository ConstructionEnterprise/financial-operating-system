import { describe, expect, it } from "vitest";
import { summarizeCrossDomainRoi } from "../shared/crossDomainRoi";

describe("cross-domain ROI attribution", () => {
  const project = { id: 9, projectName: "Cedar Facility", capitalRequirement: 25_000_000 };
  const sources = [{ id: 1, projectId: 9, capitalOpportunityId: 10, capitalPath: "grants" as const, sourceName: "Awarded energy incentive" }];

  it("includes only explicit or recorded project-linked capital and keeps potential separate", () => {
    const result = summarizeCrossDomainRoi({ project, sources, opportunities: [
      { id: 10, capitalPath: "grants", organizationName: "State program", stage: "committed", requestedAmount: 2_500_000, committedAmount: 2_000_000, fundedAmount: 0 },
      { id: 11, capitalPath: "equity", organizationName: "Unlinked investor", stage: "meeting", requestedAmount: 8_000_000, committedAmount: 0, fundedAmount: 0 },
      { id: 12, capitalPath: "equipment_finance", organizationName: "Lender", projectName: "Cedar Facility", stage: "committed", requestedAmount: 5_000_000, committedAmount: 5_000_000, fundedAmount: 0 },
    ], rentalRequirements: [], rentalQuotes: [], activeRentals: [] });
    expect(result.totals).toMatchObject({ potential: 7_500_000, committed: 7_000_000, funded: 0, remainingCommittedGap: 18_000_000 });
    expect(result.composition.nonDilutive.committed).toBe(2_000_000);
    expect(result.composition.equity.potential).toBe(0);
    expect(result.rows.every((row) => row.sourceName !== "Unlinked investor")).toBe(true);
  });

  it("keeps selected rental estimates and actual rental cost outside the capital stack", () => {
    const result = summarizeCrossDomainRoi({ project, sources: [], opportunities: [], rentalRequirements: [{ id: 20, projectName: "Cedar Facility", equipmentName: "Lift", status: "active" }], rentalQuotes: [{ requirementId: 20, quoteStatus: "selected", estimatedTotal: 40_000 }], activeRentals: [{ requirementId: 20, status: "active", actualRentalCost: 42_000, actualDeliveryFee: 1_000, actualPickupFee: 1_000 }] });
    expect(result.totals).toMatchObject({ potential: 0, committed: 0, funded: 0 });
    expect(result.rentals).toMatchObject({ requirementCount: 1, selectedQuoteExposure: 40_000, actualRentalExposure: 44_000, state: "actual" });
  });

  it("keeps an explicitly linked zero-amount prospect visible without presenting it as capital", () => {
    const result = summarizeCrossDomainRoi({ project, sources: [{ id: 8, projectId: 9, capitalOpportunityId: 22, capitalPath: "equity", sourceName: "Recorded equity prospect" }], opportunities: [{ id: 22, capitalPath: "equity", organizationName: "Recorded equity prospect", stage: "identified", requestedAmount: null, committedAmount: null, fundedAmount: null }], rentalRequirements: [], rentalQuotes: [], activeRentals: [] });
    expect(result.totals).toMatchObject({ potential: 0, committed: 0, funded: 0 });
    expect(result.linkedWithoutRecordedCapital).toEqual([expect.objectContaining({ sourceName: "Recorded equity prospect", linkReason: "explicit ROI source link" })]);
  });
});

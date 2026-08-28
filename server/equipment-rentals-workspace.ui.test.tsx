import React from "react";
import { describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { EquipmentRentalsWorkspace } from "../client/src/App";

const mutation = { mutate: vi.fn(), isPending: false };
const props = { vendors: [{ id: 1, organizationName: "Source-attributed Rentals", vendorType: "Rental", equipmentCategories: "Material Handling", region: "Houston", source: "Official vendor site", sourceUrl: "https://example.com", status: "research", priority: "A", priorityRationale: "Recorded qualification evidence", deliveryAvailable: "Yes", serviceMaintenance: "Yes", updatedAt: new Date() }], requirements: [{ id: 3, equipmentName: "Telehandler", projectName: "Cedarwood", status: "sourcing", quantity: 1 }], quotes: [], activeRentals: [], financeDetails: [], createVendor: mutation, updateVendor: mutation, createRequirement: mutation, updateRequirement: mutation, createQuote: mutation, updateQuote: mutation, createActiveRental: mutation, updateActiveRental: mutation };

describe("Equipment Rentals workspace", () => {
  it("keeps public-source prospects, qualification, requirements, quotes, active rentals, and returns as distinct operational states", () => {
    const markup = renderToStaticMarkup(<EquipmentRentalsWorkspace {...props} />);
    expect(markup).toContain("Equipment Rentals");
    expect(markup).toContain("PUBLIC-SOURCE VENDOR INTAKE");
    expect(markup).toContain("QUALIFICATION QUEUE");
    expect(markup).toContain("Qualified vendor");
    expect(markup).toContain("Rental requirement");
    expect(markup).toContain("Vendor quote");
    expect(markup).toContain("Schedule / return");
    expect(markup).toContain("Rent versus acquire");
  });

  it("communicates that a vendor must be qualified before a quote or active rental can be created", () => {
    const markup = renderToStaticMarkup(<EquipmentRentalsWorkspace {...props} />);
    expect(markup).toContain("must be explicitly qualified before CE records a quote");
    expect(markup).toContain("must be selected before scheduling");
    expect(markup).toContain("The system will not infer an equipment match or a rental term.");
  });
});

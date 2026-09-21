import React from "react";
import { describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { EquipmentDomainWorkspace, navItems } from "../client/src/App";

const mutation = { mutate: vi.fn(), isPending: false };
const baseProps = { opportunities: [], buckets: [], documents: [], documentLinks: [], createCapitalOpportunity: mutation, updateCapitalOpportunity: mutation, updateCapitalBucket: mutation, linkDocument: mutation, unlinkDocument: mutation, vendors: [], requirements: [], quotes: [], activeRentals: [], financeDetails: [], importSeed: mutation, createVendor: mutation, updateVendor: mutation, createRequirement: mutation, updateRequirement: mutation, createQuote: mutation, updateQuote: mutation, createActiveRental: mutation, updateActiveRental: mutation };

describe("Equipment command ribbon", () => {
  it("keeps Equipment Finance as the only global equipment navigation domain", () => {
    expect(navItems.some((item) => item.id === "equipment_finance")).toBe(true);
    expect(navItems.map((item) => item.label)).not.toContain("Equipment Rentals");
  });

  it("keeps the full rental workspace available through the paired Equipment Finance and Equipment Rental commands", () => {
    const markup = renderToStaticMarkup(<EquipmentDomainWorkspace {...baseProps} view="rentals" setView={vi.fn()} />);
    expect(markup).toContain("Equipment Finance");
    expect(markup).toContain("Equipment Rental");
    expect(markup).toContain("Equipment Rentals");
    expect(markup).toContain("PUBLIC-SOURCE VENDOR INTAKE");
    expect(markup).toContain("Rent versus acquire");
  });
});

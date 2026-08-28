// @vitest-environment jsdom
import React from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render } from "@testing-library/react";

const mocks = vi.hoisted(() => ({
  saveFacility: { mutate: vi.fn(), isPending: false },
  saveEquipment: { mutate: vi.fn(), isPending: false },
  saveGrant: { mutate: vi.fn(), isPending: false },
  updateOpportunity: { mutate: vi.fn(), isPending: false },
  query: { data: undefined, refetch: vi.fn() },
}));

vi.mock("@/lib/trpc", () => ({
  trpc: {
    fundraising: {
      facilityJvDetail: { useQuery: () => mocks.query },
      equipmentFinanceDetail: { useQuery: () => mocks.query },
      grantDetail: { useQuery: () => mocks.query },
      saveFacilityJvDetail: { useMutation: () => mocks.saveFacility },
      saveEquipmentFinanceDetail: { useMutation: () => mocks.saveEquipment },
      saveGrantDetail: { useMutation: () => mocks.saveGrant },
      updateCapitalOpportunity: { useMutation: () => mocks.updateOpportunity },
    },
  },
}));

import { CapitalFundingStatus, CapitalSpecializedDetails } from "../client/src/App";

afterEach(() => cleanup());

describe("specialized capital detail saves", () => {
  it("saves facility/JV responsibilities and structure on the linked capital opportunity", () => {
    const { getByLabelText, getByRole } = render(<CapitalSpecializedDetails capitalPath="facility_jv" opportunity={{ id: 31, organizationName: "Facility Partner" }} />);
    fireEvent.change(getByLabelText("Partner role"), { target: { value: "Land and building partner" } });
    fireEvent.change(getByLabelText("Partner contribution"), { target: { value: "1500000" } });
    fireEvent.change(getByLabelText("Ownership structure"), { target: { value: "Project-level JV; CE/FF retains platform IP" } });
    fireEvent.click(getByRole("button", { name: "Save specialized detail" }));
    expect(mocks.saveFacility.mutate).toHaveBeenCalledWith(expect.objectContaining({ capitalOpportunityId: 31, partnerRole: "Land and building partner", facilityContribution: 1500000, ownershipStructure: "Project-level JV; CE/FF retains platform IP" }));
  });

  it("saves shared relationship context and structured diligence choices with the JV record", () => {
    const { getByLabelText, getByRole } = render(<CapitalSpecializedDetails capitalPath="facility_jv" opportunity={{ id: 32, organizationName: "Facility Partner" }} />);
    fireEvent.change(getByLabelText("Opportunity name"), { target: { value: "Regional facility JV" } });
    fireEvent.change(getByLabelText("Linked project"), { target: { value: "CE/FF pilot factory" } });
    fireEvent.change(getByLabelText("Contact role"), { target: { value: "Managing partner" } });
    fireEvent.change(getByLabelText("Decision maker"), { target: { value: "Investment committee" } });
    fireEvent.click(getByLabelText("Financials received"));
    fireEvent.click(getByLabelText("LOI received"));
    fireEvent.click(getByRole("button", { name: "Save specialized detail" }));
    expect(mocks.updateOpportunity.mutate).toHaveBeenCalledWith(expect.objectContaining({ id: 32, opportunityName: "Regional facility JV", projectName: "CE/FF pilot factory", contactRole: "Managing partner", decisionMaker: "Investment committee" }));
    expect(mocks.saveFacility.mutate).toHaveBeenCalledWith(expect.objectContaining({ capitalOpportunityId: 32, financialsReceived: true, loiReceived: true }));
  });

  it("saves equipment-finance terms without treating them as an investor record", () => {
    const { getByLabelText, getByRole } = render(<CapitalSpecializedDetails capitalPath="equipment_finance" opportunity={{ id: 41, organizationName: "Lender One" }} />);
    fireEvent.change(getByLabelText("Equipment / asset"), { target: { value: "Automated panel line" } });
    fireEvent.change(getByLabelText("Financing amount"), { target: { value: "450000" } });
    fireEvent.change(getByLabelText("Lease vs. loan"), { target: { value: "lease" } });
    fireEvent.click(getByRole("button", { name: "Save specialized detail" }));
    expect(mocks.saveEquipment.mutate).toHaveBeenCalledWith(expect.objectContaining({ capitalOpportunityId: 41, equipmentAsset: "Automated panel line", financingAmount: 450000, structure: "lease" }));
  });

  it("records acquisition context and a defined economics period before calculating equipment economics", () => {
    const { getByLabelText, getByRole } = render(<CapitalSpecializedDetails capitalPath="equipment_finance" opportunity={{ id: 42, organizationName: "Equipment lender" }} />);
    fireEvent.change(getByLabelText("Equipment category"), { target: { value: "Material Handling" } });
    fireEvent.change(getByLabelText("Manufacturer"), { target: { value: "CE Systems" } });
    fireEvent.change(getByLabelText("Monthly payment"), { target: { value: "3200" } });
    fireEvent.change(getByLabelText("Incremental revenue"), { target: { value: "12000" } });
    fireEvent.change(getByLabelText("Operating savings"), { target: { value: "3000" } });
    fireEvent.change(getByLabelText("Economics period (months)"), { target: { value: "1" } });
    fireEvent.click(getByRole("button", { name: "Save specialized detail" }));
    expect(mocks.saveEquipment.mutate).toHaveBeenCalledWith(expect.objectContaining({ capitalOpportunityId: 42, equipmentCategory: "Material Handling", manufacturer: "CE Systems", monthlyPayment: 3200, incrementalRevenue: 12000, operatingSavings: 3000, economicsPeriodMonths: 1 }));
  });

  it("saves grant program eligibility and application conditions on the linked opportunity", () => {
    const { getByLabelText, getByRole } = render(<CapitalSpecializedDetails capitalPath="grants" opportunity={{ id: 61, organizationName: "State Program" }} />);
    fireEvent.change(getByLabelText("Program"), { target: { value: "Industrial modernization incentive" } });
    fireEvent.change(getByLabelText("Award ceiling"), { target: { value: "250000" } });
    fireEvent.change(getByLabelText("Eligibility"), { target: { value: "Advanced manufacturing project" } });
    fireEvent.click(getByRole("button", { name: "Save specialized detail" }));
    expect(mocks.saveGrant.mutate).toHaveBeenCalledWith(expect.objectContaining({ capitalOpportunityId: 61, program: "Industrial modernization incentive", awardCeiling: 250000, eligibility: "Advanced manufacturing project" }));
  });

  it("records funded capital separately from a commitment", () => {
    const { getByLabelText, getByRole } = render(<CapitalFundingStatus opportunity={{ id: 52, organizationName: "Lease Provider", requestedAmount: 500000, committedAmount: 400000, fundedAmount: 0 }} />);
    fireEvent.change(getByLabelText("Funded amount"), { target: { value: "125000" } });
    fireEvent.click(getByRole("button", { name: "Save funded" }));
    expect(mocks.updateOpportunity.mutate).toHaveBeenCalledWith({ id: 52, fundedAmount: 125000 });
  });
});

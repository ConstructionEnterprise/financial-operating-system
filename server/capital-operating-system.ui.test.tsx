import React from "react";
import { describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { BaseCapitalPathWorkspace, CapitalDashboard, CapitalPathWorkspace, JvPartnershipIntake, JvProspectActionPanel, JvRegionBreakdown } from "../client/src/App";

const noopMutation = { mutate: vi.fn() };
const baseProps = {
  opportunities: [],
  buckets: [
    { capitalPath: "equity", targetAmount: 1_000_000 },
    { capitalPath: "facility_jv", targetAmount: 2_000_000 },
    { capitalPath: "equipment_finance", targetAmount: 500_000 },
    { capitalPath: "grants", targetAmount: 250_000 },
  ],
  documents: [],
  documentLinks: [],
  createCapitalOpportunity: noopMutation,
  updateCapitalOpportunity: noopMutation,
  updateCapitalBucket: noopMutation,
  linkDocument: noopMutation,
  unlinkDocument: noopMutation,
};

describe("Capital Operating System workspaces", () => {
  it("keeps JV, equipment finance, and grants as distinct operational environments", () => {
    const facility = renderToStaticMarkup(<CapitalPathWorkspace {...baseProps} capitalPath="facility_jv" />);
    const equipment = renderToStaticMarkup(<CapitalPathWorkspace {...baseProps} capitalPath="equipment_finance" />);
    const grants = renderToStaticMarkup(<CapitalPathWorkspace {...baseProps} capitalPath="grants" />);
    expect(facility).toContain("JV / Facility Partners");
    expect(equipment).toContain("Equipment Financing");
    expect(grants).toContain("Grants &amp; Incentives");
  });

  it("reports committed, funded, and remaining capital as distinct aggregate measures", () => {
    const markup = renderToStaticMarkup(<CapitalDashboard buckets={baseProps.buckets} opportunities={[{ capitalPath: "equipment_finance", requestedAmount: 500_000, committedAmount: 400_000, fundedAmount: 150_000, probability: 80, stage: "committed" }]} />);
    expect(markup).toContain("COMMITTED");
    expect(markup).toContain("OPEN GAP");
    expect(markup).toContain("Equipment Financing");
  });

  it("distinguishes active and passed opportunity counts inside each capital path", () => {
    const markup = renderToStaticMarkup(<BaseCapitalPathWorkspace {...baseProps} capitalPath="facility_jv" opportunities={[
      { id: 1, capitalPath: "facility_jv", organizationName: "Active partner", stage: "identified", requestedAmount: 100_000 },
      { id: 2, capitalPath: "facility_jv", organizationName: "Passed partner", stage: "passed", requestedAmount: 50_000 },
    ]} />);
    expect(markup).toContain("JV / Facility Partners · 1 active · 1 passed");
    expect(markup).toContain("Active partner");
    expect(markup).not.toContain("Passed partner");
  });

  it("summarizes a JV partnership with facility, probability, and next-action context in the opportunity queue", () => {
    const markup = renderToStaticMarkup(<BaseCapitalPathWorkspace {...baseProps} capitalPath="facility_jv" opportunities={[{
      id: 1,
      capitalPath: "facility_jv",
      organizationName: "Partner ABC",
      opportunityName: "Cedarwood facility JV",
      facilityName: "Cedarwood Flats Manufacturing Facility",
      stage: "diligence",
      requestedAmount: 15_000_000,
      probability: 65,
      termsNotes: "JV type: Development / build-to-suit",
      nextAction: "Review proposed JV economics",
    }]} />);
    expect(markup).toContain("Cedarwood facility JV");
    expect(markup).toContain("Cedarwood Flats Manufacturing Facility");
    expect(markup).toContain("65% probability");
    expect(markup).toContain("Development / build-to-suit");
    expect(markup).toContain("Next: Review proposed JV economics");
  });

  it("shows partnership, facility, capital-structure, and initial-diligence context before a JV opportunity exists", () => {
    const markup = renderToStaticMarkup(<JvPartnershipIntake createCapitalOpportunity={noopMutation} />);
    expect(markup).toContain("Partnership opportunity");
    expect(markup).toContain("Opportunity name");
    expect(markup).toContain("Linked facility");
    expect(markup).toContain("CE contribution");
    expect(markup).toContain("Partner contribution");
    expect(markup).toContain("Initial diligence");
  });

  it("renders a regional breakdown for the sourced Texas JV universe", () => {
    const markup = renderToStaticMarkup(<JvRegionBreakdown prospects={[{ region: "Houston" }, { region: "DFW" }, { region: "Houston" }]} />);
    expect(markup).toContain("Houston 2");
    expect(markup).toContain("DFW 1");
  });

  it("renders the selected-prospect action interface with persisted capital and next-action controls", () => {
    const markup = renderToStaticMarkup(<JvProspectActionPanel prospect={{ id: 81, organizationName: "JV Partner ABC", status: "research", sourceUrl: "https://example.com/source", indicativeCapitalAmount: 2_500_000, nextAction: "Review site fit", nextActionDueAt: new Date("2026-09-01T00:00:00.000Z") }} onSave={vi.fn()} />);
    expect(markup).toContain("Prospect action interface");
    expect(markup).toContain("Indicative capital request");
    expect(markup).toContain("Next action date");
    expect(markup).toContain("Review site fit");
  });
});

// @vitest-environment jsdom
import React from "react";
import { describe, expect, it } from "vitest";
import { fireEvent, render } from "@testing-library/react";
import { FundraisingFunnelSimulator } from "../client/src/App";

describe("FundraisingFunnelSimulator", () => {
  it("shows transparent stage assumptions and recalculates projected capital when a conversion rate changes", () => {
    const { container, getAllByText, getByText } = render(<FundraisingFunnelSimulator />);
    expect(getByText("CAPITAL-PLANNING SIMULATOR")).toBeTruthy();
    expect(getByText("Projected commitments")).toBeTruthy();
    expect(getAllByText("$750,000").length).toBeGreaterThan(0);
    const responseRate = container.querySelectorAll<HTMLInputElement>(".simulator-rate-grid input")[2];
    fireEvent.change(responseRate, { target: { value: "20" } });
    expect(getAllByText("$500,000").length).toBeGreaterThan(0);
    expect(getByText("Remaining gap")).toBeTruthy();
  });
});

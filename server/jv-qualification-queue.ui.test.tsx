// @vitest-environment jsdom
import React from "react";
import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { JvProspectActionPanel, JvQueuePager } from "../client/src/App";

describe("JV Qualification Queue rendered controls", () => {
  it("updates the requested page from direct and next navigation while showing the current result range", () => {
    const onPageChange = vi.fn();
    render(<JvQueuePager page={1} totalPages={10} start={0} end={10} total={100} onPageChange={onPageChange} />);
    expect(screen.getByText("1–10 of 100")).toBeTruthy();
    expect((screen.getByRole("button", { name: "← Previous" }) as HTMLButtonElement).disabled).toBe(true);
    fireEvent.click(screen.getByRole("button", { name: "Next →" }));
    fireEvent.click(screen.getByRole("button", { name: "4" }));
    expect(onPageChange).toHaveBeenNthCalledWith(1, 2);
    expect(onPageChange).toHaveBeenNthCalledWith(2, 4);
  });

  it("saves selected-prospect qualification fields without any queue-navigation callback", () => {
    const onSave = vi.fn();
    render(<JvProspectActionPanel prospect={{ id: 5, organizationName: "Partner ABC", status: "research", sourceUrl: "https://example.com", indicativeCapitalAmount: 0 }} onSave={onSave} />);
    fireEvent.change(screen.getByLabelText("Indicative capital request"), { target: { value: "2500000" } });
    fireEvent.change(screen.getByLabelText("Next action"), { target: { value: "Prepare qualification brief" } });
    fireEvent.click(screen.getByRole("button", { name: "Save qualification action" }));
    expect(onSave).toHaveBeenCalledWith(expect.objectContaining({ indicativeCapitalAmount: 2_500_000, nextAction: "Prepare qualification brief", status: "research" }));
  });
});

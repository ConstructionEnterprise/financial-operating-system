// @vitest-environment jsdom
import React from "react";
import { describe, expect, it, vi } from "vitest";
import { fireEvent, render } from "@testing-library/react";
import { InvestorAttachmentApprovalPanel } from "../client/src/App";

describe("approval attachment recommendations", () => {
  it("recommends a current VC/Angel deck to a VC and adds it on request", () => {
    const linkInvestorDocument = { mutate: vi.fn() };
    const { getByRole, getByText } = render(<InvestorAttachmentApprovalPanel current={{ id: 42, firmName: "Example Fund", type: "VC" }} documents={[{ id: 9, name: "CEFF Investor Deck.pdf", category: "Pitch deck", version: "v4", audience: "VC / Angel", status: "current" }]} links={[]} linkInvestorDocument={linkInvestorDocument} unlinkInvestorDocument={{ mutate: vi.fn() }} />);
    expect(getByText(/Recommended current attachment/)).toBeTruthy();
    fireEvent.click(getByRole("button", { name: "Add recommended" }));
    expect(linkInvestorDocument.mutate).toHaveBeenCalledWith({ contactId: 42, documentId: 9 });
  });
});

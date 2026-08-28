// @vitest-environment jsdom
import React from "react";
import { describe, expect, it, vi } from "vitest";
import { fireEvent, render } from "@testing-library/react";
import { CampaignDocumentPicker } from "../client/src/App";

const campaign = { id: 1, name: "Priority 50" };
const document = { id: 9, name: "CEFF Deck.pdf", category: "Pitch deck", version: "v4", status: "current" };

describe("CampaignDocumentPicker interactions", () => {
  it("links an available library material and unlinks an existing campaign material", () => {
    const linkDocument = { mutate: vi.fn() };
    const unlinkDocument = { mutate: vi.fn() };
    const { getByRole, rerender } = render(<CampaignDocumentPicker campaign={campaign} documents={[document]} links={[]} linkDocument={linkDocument} unlinkDocument={unlinkDocument} />);
    fireEvent.change(getByRole("combobox"), { target: { value: "9" } });
    fireEvent.click(getByRole("button", { name: "Link" }));
    expect(linkDocument.mutate).toHaveBeenCalledWith({ campaignId: 1, documentId: 9 });
    rerender(<CampaignDocumentPicker campaign={campaign} documents={[document]} links={[{ campaignId: 1, documentId: 9 }]} linkDocument={linkDocument} unlinkDocument={unlinkDocument} />);
    fireEvent.click(getByRole("button", { name: "Unlink" }));
    expect(unlinkDocument.mutate).toHaveBeenCalledWith({ campaignId: 1, documentId: 9 });
  });
});

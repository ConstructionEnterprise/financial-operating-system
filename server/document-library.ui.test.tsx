import React from "react";
import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { DocumentLibrary, DocumentPreviewPanel, InvestorAttachmentApprovalPanel } from "../client/src/App";

const noop = () => undefined;

describe("document library workspace", () => {
  it("renders upload, open, and safe removal controls for fundraising material", () => {
    const html = renderToStaticMarkup(<DocumentLibrary documents={[{ id: 5, name: "CEFF Pitch Deck.pdf", category: "Pitch deck", version: "v4", status: "current", description: "Current investor deck", sizeBytes: 1048576, storageUrl: "/manus-storage/deck.pdf", createdAt: "2026-08-20T00:00:00.000Z" }]} contacts={[{ id: 42, firmName: "Example Fund" }]} investorDocumentLinks={[]} linkInvestorDocument={{ mutate: noop }} unlinkInvestorDocument={{ mutate: noop }} documentCategory="Pitch deck" setDocumentCategory={noop} documentVersion="v4" setDocumentVersion={noop} documentDescription="Current investor deck" setDocumentDescription={noop} uploadLibraryDocument={noop} uploadDocument={{ isPending: false }} updateDocument={{ mutate: noop }} deleteDocument={{ mutate: noop }} />);
    expect(html).toContain("Document library");
    expect(html).toContain("Upload material");
    expect(html).toContain("CEFF Pitch Deck.pdf");
    expect(html).toContain("Open");
    expect(html).toContain("Remove");
    expect(html).toContain("v4");
    expect(html).toContain("Archive");
    expect(html).toContain("EMAIL ATTACHMENTS");
  });

  it("renders the selected attachment summary directly in the investor approval workflow", () => {
    const html = renderToStaticMarkup(<InvestorAttachmentApprovalPanel current={{ id: 42, firmName: "Example Fund" }} documents={[{ id: 5, name: "CEFF Pitch Deck.pdf", category: "Pitch deck", version: "v4", status: "current" }]} links={[{ contactId: 42, documentId: 5 }]} linkInvestorDocument={{ mutate: noop }} unlinkInvestorDocument={{ mutate: noop }} />);
    expect(html).toContain("APPROVAL ATTACHMENTS");
    expect(html).toContain("Materials for Example Fund");
    expect(html).toContain("CEFF Pitch Deck.pdf");
    expect(html).toContain("Remove");
  });

  it("renders an in-app preview for a current PDF and a download fallback", () => {
    const html = renderToStaticMarkup(<DocumentPreviewPanel documents={[{ id: 5, name: "CEFF Pitch Deck.pdf", category: "Pitch deck", version: "v4", status: "current", mimeType: "application/pdf", storageUrl: "/manus-storage/deck.pdf" }]} />);
    expect(html).toContain("Document preview");
    expect(html).toContain("Preview of CEFF Pitch Deck.pdf");
    expect(html).toContain("Open / download CEFF Pitch Deck.pdf");
  });
});

import React from "react";
import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { AISummaryPanel } from "../client/src/components/AISummaryPanel";

describe("AISummaryPanel", () => {
  it("renders AI summary errors inline for investor-record review", () => {
    const html = renderToStaticMarkup(<AISummaryPanel error="The AI service is unavailable." />);
    expect(html).toContain("AI SUMMARY ERROR");
    expect(html).toContain("The AI service is unavailable.");
    expect(html).toContain("Retry after checking the investor events");
  });

  it("renders the persisted-summary action when a summary is available", () => {
    const html = renderToStaticMarkup(<AISummaryPanel summary="Reply received; next action is diligence." onSave={() => undefined} />);
    expect(html).toContain("AI HISTORY SUMMARY");
    expect(html).toContain("Save summary to notes");
  });
});

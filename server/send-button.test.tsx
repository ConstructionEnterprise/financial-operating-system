import React from "react";
import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { SendButton } from "../client/src/components/SendButton";

describe("SendButton", () => {
  it("renders disabled when Gmail is not connected", () => {
    const html = renderToStaticMarkup(<SendButton gmailConnected={false} status="approved" onSend={() => undefined} />);
    expect(html).toContain("disabled");
  });

  it("renders enabled only for a connected approved contact", () => {
    const html = renderToStaticMarkup(<SendButton gmailConnected={true} status="approved" onSend={() => undefined} />);
    expect(html).not.toContain("disabled");
  });
});

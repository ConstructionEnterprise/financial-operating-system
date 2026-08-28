import { describe, expect, it } from "vitest";
import { CALLBACK_PATH, redirectUri } from "./gmail";

describe("Gmail OAuth callback", () => {
  it("uses the stable callback path", () => {
    expect(CALLBACK_PATH).toBe("/api/gmail/oauth/callback");
  });

  it("builds the redirect URI from the hosted request", () => {
    const configured = process.env.PUBLIC_APP_URL;
    delete process.env.PUBLIC_APP_URL;
    const req = { protocol: "https", get: (header: string) => header.toLowerCase() === "host" ? "outreach.example.com" : undefined } as any;
    expect(redirectUri(req)).toBe("https://outreach.example.com/api/gmail/oauth/callback");
    if (configured) process.env.PUBLIC_APP_URL = configured;
  });
});

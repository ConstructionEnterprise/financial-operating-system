import { describe, expect, it } from "vitest";

describe("Gmail OAuth configuration", () => {
  it("accepts the configured OAuth client credentials at the token endpoint", async () => {
    expect(process.env.GMAIL_CLIENT_ID).toBeTruthy();
    expect(process.env.GMAIL_CLIENT_SECRET).toBeTruthy();
    expect(process.env.PUBLIC_APP_URL).toMatch(/^https:\/\//);
    const response = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: process.env.GMAIL_CLIENT_ID!,
        client_secret: process.env.GMAIL_CLIENT_SECRET!,
        code: "validation-only-invalid-code",
        redirect_uri: `${process.env.PUBLIC_APP_URL}/api/gmail/oauth/callback`,
        grant_type: "authorization_code",
      }),
    });
    expect(response.status).not.toBe(401);
    expect(response.status).not.toBe(403);
  }, 15000);
});

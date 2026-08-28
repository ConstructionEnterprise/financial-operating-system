import type { Express, Request } from "express";
import crypto from "node:crypto";
import { sdk } from "./_core/sdk";
import { ENV } from "./_core/env";
import { getGmailConnectionSecret, upsertGmailConnection } from "./db";

const CALLBACK_PATH = "/api/gmail/oauth/callback";

function baseUrl(req: Request) {
  const protocol = (req.get("x-forwarded-proto") || req.protocol || "https").split(",")[0].trim();
  const host = (req.get("x-forwarded-host") || req.get("host") || "").split(",")[0].trim();
  return `${protocol}://${host}`;
}
function redirectUri(req: Request) { return `${baseUrl(req)}${CALLBACK_PATH}`; }
function parseCookies(header?: string) { return Object.fromEntries((header || "").split(";").map(v => v.trim()).filter(Boolean).map(v => { const i = v.indexOf("="); return [v.slice(0, i), decodeURIComponent(v.slice(i + 1))]; })); }
function sign(value: string) { return crypto.createHmac("sha256", ENV.cookieSecret || "development-secret").update(value).digest("hex"); }
function makeState(ownerId: number) { const payload = `${ownerId}.${crypto.randomBytes(24).toString("hex")}`; return `${payload}.${sign(payload)}`; }
function verifyState(state: string) { const parts = state.split("."); if (parts.length !== 3) return null; const payload = `${parts[0]}.${parts[1]}`; if (!crypto.timingSafeEqual(Buffer.from(parts[2]), Buffer.from(sign(payload)))) return null; const ownerId = Number(parts[0]); return Number.isInteger(ownerId) ? ownerId : null; }
function encryptionKey() { return crypto.createHash("sha256").update(ENV.cookieSecret || "development-secret").digest(); }
function encrypt(value: string) {
  const iv = crypto.randomBytes(12); const cipher = crypto.createCipheriv("aes-256-gcm", encryptionKey(), iv); const encrypted = Buffer.concat([cipher.update(value, "utf8"), cipher.final()]);
  return `${iv.toString("base64url")}.${cipher.getAuthTag().toString("base64url")}.${encrypted.toString("base64url")}`;
}
function decrypt(value: string) {
  const [ivRaw, tagRaw, encryptedRaw] = value.split(".");
  const decipher = crypto.createDecipheriv("aes-256-gcm", encryptionKey(), Buffer.from(ivRaw, "base64url"));
  decipher.setAuthTag(Buffer.from(tagRaw, "base64url"));
  return Buffer.concat([decipher.update(Buffer.from(encryptedRaw, "base64url")), decipher.final()]).toString("utf8");
}
function encodeMessage(value: string) { return Buffer.from(value).toString("base64url"); }

export type GmailAttachment = { name: string; mimeType: string; content: Buffer };

function buildRawMessage(to: string, subject: string, body: string, attachments: GmailAttachment[]) {
  if (attachments.length === 0) return [`To: ${to}`, `Subject: ${subject}`, "Content-Type: text/plain; charset=UTF-8", "", body].join("\r\n");
  const boundary = `ceff_${crypto.randomBytes(12).toString("hex")}`;
  const attachmentParts = attachments.map((attachment) => [
    `--${boundary}`,
    `Content-Type: ${attachment.mimeType}; name="${attachment.name.replace(/"/g, "")}"`,
    "Content-Transfer-Encoding: base64",
    `Content-Disposition: attachment; filename="${attachment.name.replace(/"/g, "")}"`,
    "",
    attachment.content.toString("base64"),
  ].join("\r\n"));
  return [`To: ${to}`, `Subject: ${subject}`, "MIME-Version: 1.0", `Content-Type: multipart/mixed; boundary="${boundary}"`, "", `--${boundary}`, "Content-Type: text/plain; charset=UTF-8", "", body, ...attachmentParts, `--${boundary}--`, ""].join("\r\n");
}

export async function sendGmailMessage(ownerId: number, to: string, subject: string, body: string, attachments: GmailAttachment[] = []) {
  const connection = await getGmailConnectionSecret(ownerId);
  if (!connection?.refreshTokenEncrypted) throw new Error("Gmail is connected without a usable refresh token. Reconnect Gmail.");
  const refreshToken = decrypt(connection.refreshTokenEncrypted);
  const tokenResponse = await fetch("https://oauth2.googleapis.com/token", { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" }, body: new URLSearchParams({ client_id: process.env.GMAIL_CLIENT_ID || "", client_secret: process.env.GMAIL_CLIENT_SECRET || "", refresh_token: refreshToken, grant_type: "refresh_token" }) });
  if (!tokenResponse.ok) throw new Error("Gmail token refresh failed. Reconnect Gmail.");
  const token = await tokenResponse.json() as { access_token?: string };
  if (!token.access_token) throw new Error("Gmail token refresh returned no access token.");
  const raw = buildRawMessage(to, subject, body, attachments);
  const response = await fetch("https://gmail.googleapis.com/gmail/v1/users/me/messages/send", { method: "POST", headers: { Authorization: `Bearer ${token.access_token}`, "Content-Type": "application/json" }, body: JSON.stringify({ raw: encodeMessage(raw) }) });
  if (!response.ok) throw new Error("Gmail rejected the message.");
  return response.json();
}

export function registerGmailRoutes(app: Express) {
  app.get("/api/gmail/oauth/start", async (req, res) => {
    const user = await sdk.authenticateRequest(req as any).catch(() => null);
    if (!user) return res.status(401).send("Please sign in to connect Gmail.");
    const clientId = process.env.GMAIL_CLIENT_ID;
    if (!clientId) return res.status(503).send("Gmail OAuth is not configured yet. Add GMAIL_CLIENT_ID first.");
    const state = makeState(user.id);
    res.setHeader("Set-Cookie", `gmail_oauth_state=${state}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=600`);
    const params = new URLSearchParams({ client_id: clientId, redirect_uri: redirectUri(req), response_type: "code", access_type: "offline", prompt: "consent", scope: "https://www.googleapis.com/auth/gmail.send", state });
    res.redirect(`https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`);
  });

  app.get(CALLBACK_PATH, async (req, res) => {
    const state = typeof req.query.state === "string" ? req.query.state : "";
    const cookies = parseCookies(req.headers.cookie);
    const ownerId = state && state === cookies.gmail_oauth_state ? verifyState(state) : null;
    if (!ownerId) return res.status(400).send("Invalid Gmail OAuth state. Please restart the connection.");
    const code = typeof req.query.code === "string" ? req.query.code : "";
    if (!code) return res.status(400).send("Gmail authorization was not completed.");
    const clientId = process.env.GMAIL_CLIENT_ID; const clientSecret = process.env.GMAIL_CLIENT_SECRET;
    if (!clientId || !clientSecret) return res.status(503).send("Gmail OAuth is missing credentials.");
    const tokenResponse = await fetch("https://oauth2.googleapis.com/token", { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" }, body: new URLSearchParams({ code, client_id: clientId, client_secret: clientSecret, redirect_uri: redirectUri(req), grant_type: "authorization_code" }) });
    if (!tokenResponse.ok) return res.status(502).send("Gmail authorization succeeded, but token exchange failed. Check the redirect URI and OAuth client.");
    const tokens = await tokenResponse.json() as { access_token?: string; refresh_token?: string };
    if (!tokens.access_token) return res.status(502).send("Gmail authorization did not return an access token.");
    const profileResponse = await fetch("https://gmail.googleapis.com/gmail/v1/users/me/profile", { headers: { Authorization: `Bearer ${tokens.access_token}` } });
    const profile = profileResponse.ok ? await profileResponse.json() as { emailAddress?: string } : {};
    await upsertGmailConnection(ownerId, profile.emailAddress || "connected Gmail mailbox", tokens.refresh_token ? encrypt(tokens.refresh_token) : undefined);
    res.setHeader("Set-Cookie", "gmail_oauth_state=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0");
    res.send(`<!doctype html><html><body style="font-family: sans-serif; padding: 32px"><h2>Gmail connected</h2><p>${profile.emailAddress || "Mailbox connected"}</p><script>window.opener && window.opener.postMessage({ type: 'gmail-connected' }, '*'); setTimeout(() => window.close(), 700);</script></body></html>`);
  });
}

export { CALLBACK_PATH, redirectUri };

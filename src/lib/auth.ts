/**
 * Master password authentication for personal-use finance tracker.
 * Uses Web Crypto API (available in Cloudflare Workers runtime).
 * Dynamic password hash stored in D1 database `app_settings` table.
 * Session token is HMAC-SHA256 signed, stored in HttpOnly cookie.
 */

import { getRequestContext } from "@cloudflare/next-on-pages";

const SESSION_COOKIE_NAME = "ft_session";
const SESSION_EXPIRY_MS = 24 * 60 * 60 * 1000; // 24 hours
const encoder = new TextEncoder();

/** Get session secret from Cloudflare context, environment, or fallback */
export function getSessionSecret(): string {
  try {
    const { env } = getRequestContext();
    const secret = (env as Record<string, string>)?.SESSION_SECRET;
    if (secret) return secret;
  } catch {
    // getRequestContext may throw when called outside request context
  }

  if (process.env.SESSION_SECRET) {
    return process.env.SESSION_SECRET;
  }

  // Development/default fallback secret
  return "dev-secret-key-finance-tracker-cloudflare-pages-personal-use";
}

/** Hash a password with PBKDF2 (SHA-256, 100k iterations) → hex string */
export async function hashPassword(password: string): Promise<string> {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    encoder.encode(password),
    "PBKDF2",
    false,
    ["deriveBits"]
  );
  const derived = await crypto.subtle.deriveBits(
    { name: "PBKDF2", salt, iterations: 100000, hash: "SHA-256" },
    keyMaterial,
    256
  );
  const saltHex = Array.from(salt).map((b) => b.toString(16).padStart(2, "0")).join("");
  const hashHex = Array.from(new Uint8Array(derived)).map((b) => b.toString(16).padStart(2, "0")).join("");
  return `${saltHex}:${hashHex}`;
}

/** Verify a password against a stored hash (salt:hash format) */
export async function verifyPassword(password: string, storedHash: string): Promise<boolean> {
  const [saltHex, expectedHex] = storedHash.split(":");
  if (!saltHex || !expectedHex) return false;

  const salt = new Uint8Array(
    (saltHex.match(/.{2}/g) || []).map((b) => parseInt(b, 16))
  );
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    encoder.encode(password),
    "PBKDF2",
    false,
    ["deriveBits"]
  );
  const derived = await crypto.subtle.deriveBits(
    { name: "PBKDF2", salt, iterations: 100000, hash: "SHA-256" },
    keyMaterial,
    256
  );
  const actualHex = Array.from(new Uint8Array(derived)).map((b) => b.toString(16).padStart(2, "0")).join("");
  return actualHex === expectedHex;
}

/** Create a signed session token (HMAC-SHA256) */
export async function createSessionToken(secret: string): Promise<string> {
  const payload = JSON.stringify({
    exp: Date.now() + SESSION_EXPIRY_MS,
    iat: Date.now(),
  });
  const payloadB64 = btoa(payload);
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const signature = await crypto.subtle.sign("HMAC", key, encoder.encode(payloadB64));
  const sigHex = Array.from(new Uint8Array(signature)).map((b) => b.toString(16).padStart(2, "0")).join("");
  return `${payloadB64}.${sigHex}`;
}

/** Verify a session token. Returns true if valid and not expired. */
export async function verifySessionToken(token: string, secret: string): Promise<boolean> {
  try {
    const [payloadB64, sigHex] = token.split(".");
    if (!payloadB64 || !sigHex) return false;

    const key = await crypto.subtle.importKey(
      "raw",
      encoder.encode(secret),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["verify"]
    );
    const sigBytes = new Uint8Array(
      (sigHex.match(/.{2}/g) || []).map((b) => parseInt(b, 16))
    );
    const valid = await crypto.subtle.verify("HMAC", key, sigBytes, encoder.encode(payloadB64));
    if (!valid) return false;

    const payload = JSON.parse(atob(payloadB64));
    if (typeof payload.exp !== "number" || Date.now() > payload.exp) return false;

    return true;
  } catch {
    return false;
  }
}

export { SESSION_COOKIE_NAME, SESSION_EXPIRY_MS };

/**
 * Utility script to generate a PBKDF2 password hash for MASTER_PASSWORD_HASH env var.
 *
 * Usage:
 *   node scripts/hash-password.mjs <your-password>
 *
 * Output: a salt:hash string to set as MASTER_PASSWORD_HASH
 */

const password = process.argv[2];

if (!password) {
  console.error("Usage: node scripts/hash-password.mjs <your-password>");
  process.exit(1);
}

const encoder = new TextEncoder();
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

const saltHex = Array.from(salt)
  .map((b) => b.toString(16).padStart(2, "0"))
  .join("");
const hashHex = Array.from(new Uint8Array(derived))
  .map((b) => b.toString(16).padStart(2, "0"))
  .join("");

console.log(`\nMASTER_PASSWORD_HASH=${saltHex}:${hashHex}\n`);
console.log("Copy the value above and set it as an environment variable in Cloudflare Pages.");

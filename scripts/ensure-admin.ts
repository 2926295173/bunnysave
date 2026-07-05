#!/usr/bin/env -S node --experimental-strip-types --no-warnings
/**
 * Ensure an admin account exists in the database.
 *
 * Reads ADMIN_EMAIL and ADMIN_PASSWORD from the environment. If a user
 * with ADMIN_EMAIL doesn't exist, this script bcrypt-hashes the password
 * and inserts the row with role=admin. If the user exists, it promotes
 * the role to admin and (optionally) resets the password hash.
 *
 * Idempotent and safe to run on every build.
 *
 * Prints the credentials once on success so the operator can sign in
 * from the Vercel function logs. No secrets are written to git.
 */
import { createRequire } from "node:module";
import { randomUUID } from "node:crypto";
import { neon } from "@neondatabase/serverless";

const require = createRequire(import.meta.url);
const crypto = require("node:crypto");
const bcrypt = require("bcryptjs");

const url = process.env.DATABASE_URL ?? process.env.AUTH_DB_URL;
if (!url) {
  console.log("[ensure-admin] DATABASE_URL not set; skipping.");
  process.exit(0);
}

const email = (process.env.ADMIN_EMAIL ?? "").toLowerCase().trim();
const rawSecret = process.env.ADMIN_PASSWORD ?? "";

if (!email || !rawSecret) {
  console.log("[ensure-admin] ADMIN_EMAIL or ADMIN_PASSWORD not set; skipping.");
  process.exit(0);
}

// env value is the MD5 of the original password (32 hex chars). We hash
// the MD5 again with bcrypt before persisting, so the database never
// stores the original password nor its raw MD5. Login in src/auth.ts
// applies the same MD5 step before calling bcrypt.compare().
const md5 = /^[a-f0-9]{32}$/.test(rawSecret)
  ? rawSecret.toLowerCase()
  : crypto.createHash("md5").update(rawSecret, "utf8").digest("hex");
console.log(`[ensure-admin] Using MD5 fingerprint: ${md5}`);

const sql = neon(url).query.bind(neon(url));

try {
  const existing = (await sql(
    "SELECT id, password_hash, role FROM users WHERE email = $1",
    [email],
  )) as { id: string; password_hash: string | null; role: string }[];

  const hash = await bcrypt.hash(md5, 12);

  if (existing.length === 0) {
    const id = randomUUID();
    await sql(
      "INSERT INTO users (id, email, name, provider, password_hash, role) VALUES ($1, $2, $3, $4, $5, $6)",
      [id, email, "Admin", "credentials", hash, "admin"],
    );
    console.log(`[ensure-admin] Created admin user: ${email}`);
  } else {
    const row = existing[0];
    await sql(
      "UPDATE users SET password_hash = $2, role = 'admin', provider = 'credentials' WHERE id = $1",
      [row.id, hash],
    );
    console.log(`[ensure-admin] Promoted/reset admin: ${email}`);
  }
  console.log(`[ensure-admin] Sign in at /login with:`);
  console.log(`[ensure-admin]   email:    ${email}`);
  console.log(`[ensure-admin]   password: ${rawSecret}`);
  console.log(`[ensure-admin] You can safely remove ADMIN_PASSWORD from Vercel after first sign-in.`);
} catch (err) {
  console.error("[ensure-admin] failed:", (err as Error).message);
  process.exit(1);
}

#!/usr/bin/env -S node --experimental-strip-types --no-warnings
/**
 * Wraps `scripts/seed.ts` for use as a `prebuild` step on Vercel.
 *
 *  - Always exits 0 unless the user explicitly wants a hard failure
 *    (`STRICT_SEED=1`).
 *  - Skips entirely when `SKIP_SEED=1` (useful for preview deploys that
 *    don't want to touch production data).
 *  - Logs everything to stdout for Vercel's build log.
 */
import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";

if (process.env.SKIP_SEED === "1") {
  console.log("[prebuild] SKIP_SEED=1 — skipping seed.");
  process.exit(0);
}

if (!process.env.DATABASE_URL && !process.env.AUTH_DB_URL) {
  console.warn(
    "[prebuild] DATABASE_URL / AUTH_DB_URL not set — skipping seed. " +
      "Add the env var in Vercel project settings to seed on every build.",
  );
  process.exit(0);
}

const envFile = [
  existsSync(".env.local") ? "--env-file-if-exists=.env.local" : "",
  existsSync(".env.development.local") ? "--env-file-if-exists=.env.development.local" : "",
].filter(Boolean);

const result = spawnSync(
  process.execPath,
  [
    "--experimental-strip-types",
    "--no-warnings",
    ...envFile,
    "scripts/seed.ts",
  ],
  { stdio: "inherit" },
);

if (result.status !== 0) {
  const msg = `[prebuild] seed exited with status ${result.status}`;
  if (process.env.STRICT_SEED === "1") {
    console.error(msg + " — STRICT_SEED=1, aborting build.");
    process.exit(result.status ?? 1);
  }
  console.warn(
    msg +
      " — continuing. Set STRICT_SEED=1 to fail the build on seed errors.",
  );
  process.exit(0);
}

console.log("[prebuild] seed completed.");

// Always run ensure-admin after seed; it's idempotent and exits cleanly
// when ADMIN_EMAIL/ADMIN_PASSWORD aren't configured.
const admin = spawnSync(
  process.execPath,
  [
    "--experimental-strip-types",
    "--no-warnings",
    ...envFile,
    "scripts/ensure-admin.ts",
  ],
  { stdio: "inherit" },
);
if (admin.status !== 0) {
  console.warn(`[prebuild] ensure-admin exited with status ${admin.status}`);
} else {
  console.log("[prebuild] ensure-admin completed.");
}
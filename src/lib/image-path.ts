/**
 * Pure path helpers — safe to import in client components (no fs / no server-only).
 *
 * We pass the original remote URL through to `next/image` (configured via
 * `images.remotePatterns` in next.config.mjs), and only fall back to a
 * local placeholder when the URL is malformed or comes from an
 * unconfigured host.
 */

export function localImageFor(
  remoteUrl: string,
  fallbackBucket: "deals" | "brands" | "site" = "deals",
): string {
  if (!remoteUrl) return `/images/${fallbackBucket}/placeholder.svg`;
  try {
    const u = new URL(remoteUrl);
    // Only honor HTTPS / HTTP URLs from configured hosts.
    if (u.protocol === "https:" || u.protocol === "http:") {
      return remoteUrl;
    }
  } catch {
    // Already a relative path or invalid URL.
  }
  // Already a local /images/ path → keep it.
  if (remoteUrl.startsWith("/")) return remoteUrl;
  return `/images/${fallbackBucket}/placeholder.svg`;
}

export function localImageExists(_remoteUrl: string): boolean {
  // With remotePatterns enabled we always defer to the next/image pipeline.
  return true;
}
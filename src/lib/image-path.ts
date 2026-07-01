/**
 * Pure path helpers — safe to import in client components (no fs / no server-only).
 */

export function localImageFor(
  remoteUrl: string,
  fallbackBucket: "deals" | "brands" | "site" = "deals",
): string {
  try {
    const u = new URL(remoteUrl);
    const parts = u.pathname.split("/").filter(Boolean);
    if (parts.length >= 2) {
      const bucket = parts[parts.length - 2];
      const filename = parts[parts.length - 1];
      if (["deals", "brands", "site"].includes(bucket)) {
        return `/images/${bucket}/${filename}`;
      }
    }
  } catch {
    // ignore
  }
  return `/images/${fallbackBucket}/placeholder.svg`;
}

export function localImageExists(remoteUrl: string): boolean {
  try {
    const u = new URL(remoteUrl);
    const parts = u.pathname.split("/").filter(Boolean);
    if (parts.length >= 2) {
      const bucket = parts[parts.length - 2];
      const filename = parts[parts.length - 1];
      return ["deals", "brands", "site"].includes(bucket);
    }
  } catch {
    return false;
  }
  return false;
}

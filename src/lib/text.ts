/**
 * Coerce any value to a presentable string. Mirrors the [rules: null-handling]
 * expectation in AGENTS.md — we never want literal "null" or "undefined" to
 * leak into user-visible text such as <title>, metadata, or template strings.
 *
 * Examples:
 *   presentText(null)            -> ""
 *   presentText(undefined)       -> ""
 *   presentText("  hello  ")     -> "hello"
 *   presentText(0)               -> "0"
 *   presentText(42)              -> "42"
 *   presentText(null, "暂无")     -> "暂无"
 */
export function presentText(value: unknown, fallback = ""): string {
  if (value == null) return fallback;
  if (typeof value === "string") {
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : fallback;
  }
  return String(value);
}

/**
 * Build a ${label} | ${cat} style segment safely — returns an empty string when
 * the leading segment is missing instead of interpolating "null".
 */
export function orEmpty(value: string | null | undefined): string {
  return value ? value : "";
}

/**
 * Convenience for assembling "A - B - C" titles: filters out empty segments
 * and joins the rest with the separator, trimmed.
 */
export function joinNonEmpty(parts: Array<string | null | undefined>, sep = " - "): string {
  return parts.filter((p) => typeof p === "string" && p.trim().length > 0).join(sep);
}
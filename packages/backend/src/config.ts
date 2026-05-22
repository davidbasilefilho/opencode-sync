/**
 * Configuration for the Convex client used by the plugin.
 *
 * Loads settings from environment variables with sensible defaults for local development.
 */

/**
 * Returns the Convex deployment URL from the environment.
 *
 * Falls back to the default local dev URL if not set.
 */
export function getConvexUrl(): string {
  return process.env["CONVEX_URL"] ?? "http://localhost:8080";
}

/** Returns the sync API key from the environment. */
export function getApiKey(): string | undefined {
  return process.env["SYNC_API_KEY"];
}

/**
 * Returns the configured polling interval in milliseconds.
 *
 * Defaults to 5000ms (5 seconds).
 */
export function getPollIntervalMs(): number {
  const raw = process.env["SYNC_POLL_INTERVAL_MS"];
  if (raw === undefined) return 5_000;
  const parsed = Number.parseInt(raw, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 5_000;
}

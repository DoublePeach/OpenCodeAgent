/**
 * Analytics sink — OpenCodeAgent no-op implementation.
 *
 * All telemetry and data reporting has been intentionally removed.
 * These exports maintain the original interface so call-sites compile
 * without modification, but no data is ever sent anywhere.
 */

/** No-op: gates are never needed since all reporting is disabled. */
export function initializeAnalyticsGates(): void {}

/** No-op: no sink is attached; events queue up and are silently dropped. */
export function initializeAnalyticsSink(): void {}

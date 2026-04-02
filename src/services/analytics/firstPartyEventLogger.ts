/**
 * First-party event logging — OpenCodeAgent no-op implementation.
 * All 1P event logging and OpenTelemetry log shipping has been removed.
 * Exports maintain the original interface for call-site compatibility.
 */

export type EventSamplingConfig = {
  [eventName: string]: { sample_rate: number }
}

export function getEventSamplingConfig(): EventSamplingConfig {
  return {}
}

export function shouldSampleEvent(_eventName: string): number | null {
  return null
}

export function logEventTo1P(
  _eventName: string,
  _metadata: { [key: string]: boolean | number | undefined },
): void {}

export function is1PEventLoggingEnabled(): boolean {
  return false
}

export function logGrowthBookExperimentTo1P(
  _experimentKey: string,
  _variationId: number,
): void {}

export async function initialize1PEventLogging(): Promise<void> {}

export async function reinitialize1PEventLoggingIfConfigChanged(): Promise<void> {}

export async function shutdown1PEventLogging(): Promise<void> {}

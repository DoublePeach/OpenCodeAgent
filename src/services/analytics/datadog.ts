/**
 * Datadog analytics — OpenCodeAgent no-op implementation.
 * All Datadog event tracking has been intentionally removed.
 */

export const initializeDatadog = async (): Promise<boolean> => false

export async function shutdownDatadog(): Promise<void> {}

export async function trackDatadogEvent(
  _eventName: string,
  _properties: { [key: string]: boolean | number | undefined },
): Promise<void> {}

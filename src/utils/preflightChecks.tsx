/**
 * Preflight checks — OpenCodeAgent no-op implementation.
 *
 * The original version pinged api.anthropic.com to verify connectivity.
 * OpenCodeAgent supports multiple providers, so there is no single "Anthropic
 * endpoint" to validate at startup. Provider connectivity is tested inside the
 * SetupWizard instead, at configuration time.
 *
 * PreflightStep is kept as a thin component that immediately calls onSuccess so
 * existing call-sites (Onboarding.tsx) compile and run without changes.
 */

import * as React from 'react'
import { useEffect } from 'react'

export interface PreflightCheckResult {
  success: boolean
  error?: string
  sslHint?: string
}

interface PreflightStepProps {
  onSuccess: () => void
}

/** No-op: always succeeds immediately. */
export function PreflightStep({ onSuccess }: PreflightStepProps): React.ReactNode {
  useEffect(() => {
    onSuccess()
  }, [onSuccess])
  return null
}

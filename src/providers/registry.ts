/**
 * OpenCodeAgent — Provider registry
 *
 * Resolves which provider to use from environment variables.
 *
 * Priority:
 *   OCA_PROVIDER env var   → explicit provider selection
 *   CLAUDE_CODE_USE_BEDROCK / VERTEX / FOUNDRY → legacy Anthropic cloud providers
 *   (default)              → Anthropic direct ('anthropic')
 *
 * Environment variables:
 *   OCA_PROVIDER       = 'anthropic' | 'openai-compat' | 'ollama'
 *   OCA_MODEL          = model name to send to the provider
 *   OPENAI_BASE_URL    = base URL for openai-compat (e.g. https://api.deepseek.com)
 *   OPENAI_API_KEY     = API key for openai-compat provider
 *   OLLAMA_BASE_URL    = Ollama base URL (default: http://localhost:11434)
 *   ANTHROPIC_API_KEY  = API key for Anthropic direct
 *   ANTHROPIC_BASE_URL = override base URL for Anthropic direct
 */

import type { OCAProviderConfig, OCAProviderType } from './types.js'

/** Resolve the active provider type from environment */
export function getOCAProviderType(): OCAProviderType {
  const explicit = process.env.OCA_PROVIDER?.toLowerCase()
  if (explicit === 'ollama') return 'ollama'
  if (explicit === 'openai-compat' || explicit === 'openai') return 'openai-compat'
  if (explicit === 'anthropic') return 'anthropic'

  // If no explicit OCA_PROVIDER but OPENAI_API_KEY + OPENAI_BASE_URL are set, infer openai-compat
  if (process.env.OPENAI_API_KEY && process.env.OPENAI_BASE_URL) return 'openai-compat'

  return 'anthropic'
}

/** Returns true when OpenCodeAgent should use the new provider layer */
export function isOCAProviderEnabled(): boolean {
  return getOCAProviderType() !== 'anthropic'
}

/**
 * Resolve the full provider config for the current environment.
 * Returns null for the 'anthropic' provider (handled by existing client.ts logic).
 */
export function resolveOCAProviderConfig(): OCAProviderConfig | null {
  const type = getOCAProviderType()

  if (type === 'ollama') {
    const baseURL = (process.env.OLLAMA_BASE_URL ?? 'http://localhost:11434').replace(/\/$/, '')
    return {
      type: 'ollama',
      baseURL: `${baseURL}/v1`,
      apiKey: process.env.OPENAI_API_KEY ?? 'ollama', // Ollama accepts any key
      model: process.env.OCA_MODEL,
    }
  }

  if (type === 'openai-compat') {
    const baseURL = process.env.OPENAI_BASE_URL?.replace(/\/$/, '')
    if (!baseURL) {
      throw new Error(
        '[OpenCodeAgent] OCA_PROVIDER=openai-compat requires OPENAI_BASE_URL to be set.\n' +
        'Example: OPENAI_BASE_URL=https://api.deepseek.com',
      )
    }
    const apiKey = process.env.OPENAI_API_KEY ?? process.env.ANTHROPIC_API_KEY ?? ''
    if (!apiKey) {
      throw new Error(
        '[OpenCodeAgent] OCA_PROVIDER=openai-compat requires OPENAI_API_KEY to be set.',
      )
    }
    return {
      type: 'openai-compat',
      baseURL,
      apiKey,
      model: process.env.OCA_MODEL,
    }
  }

  return null // 'anthropic' — handled by existing code
}

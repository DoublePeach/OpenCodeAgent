/**
 * OpenCodeAgent — Provider type definitions
 *
 * Defines the abstraction layer for multiple LLM providers.
 * Controlled via environment variables; see registry.ts for resolution logic.
 */

/** Supported provider identifiers */
export type OCAProviderType =
  | 'anthropic'      // Anthropic direct (default, original behaviour)
  | 'openai-compat'  // Any OpenAI-compatible API (DeepSeek, Qwen, Doubao, etc.)
  | 'ollama'         // Local Ollama (OpenAI-compat at localhost:11434/v1)

/** Resolved provider configuration, ready for client construction */
export interface OCAProviderConfig {
  type: OCAProviderType
  /** API base URL (without trailing slash) */
  baseURL: string
  /** API key — may be empty string for Ollama */
  apiKey: string
  /**
   * Model name to send to the provider.
   * Falls back to the model name from the query params when not set.
   */
  model?: string
}

/** Minimal streaming response wrapper matching Anthropic SDK interface */
export interface WithResponseResult<T> {
  data: T
  response: Response
  request_id: string | null
}

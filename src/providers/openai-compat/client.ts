/**
 * OpenCodeAgent — OpenAI-compatible fake Anthropic client
 *
 * Creates an object that satisfies the Anthropic SDK's `beta.messages` interface
 * but internally calls any OpenAI-compatible API endpoint.
 *
 * This allows `claude.ts` to call `anthropic.beta.messages.create(...)` without
 * any modification, regardless of which provider is configured.
 */

import {
  APIConnectionTimeoutError,
  APIError,
} from '@anthropic-ai/sdk/error'
import type { BetaMessage } from '@anthropic-ai/sdk/resources/beta/messages/messages.mjs'
import type Anthropic from '@anthropic-ai/sdk'
import type { OCAProviderConfig } from '../types.js'
import {
  anthropicToOpenAIRequest,
  createStreamState,
  openAIChunkToAnthropicEvents,
  openAIResponseToAnthropicMessage,
} from './converter.js'

// ──────────────────────────────────────────────────────────────────────────────
// Helpers
// ──────────────────────────────────────────────────────────────────────────────

/** Map an HTTP error response to an Anthropic SDK-compatible error */
function mapHTTPError(status: number, body: string): Error {
  let message = body
  try {
    const parsed = JSON.parse(body) as Record<string, unknown>
    const errObj = (parsed.error ?? parsed) as Record<string, unknown>
    message = (errObj.message ?? body) as string
  } catch { /* keep raw body */ }
  return APIError.generate(status, { error: { message } }, message, new Headers())
}

/** Parse an SSE line (returns the JSON chunk or null) */
// biome-ignore lint/suspicious/noExplicitAny: dynamic chunk types
function parseSSELine(line: string): Record<string, any> | null {
  if (!line.startsWith('data: ')) return null
  const data = line.slice(6).trim()
  if (data === '[DONE]') return null
  try {
    return JSON.parse(data) as Record<string, unknown>
  } catch {
    return null
  }
}

// ──────────────────────────────────────────────────────────────────────────────
// Streaming request
// ──────────────────────────────────────────────────────────────────────────────

async function* streamOpenAIToAnthropic(
  config: OCAProviderConfig,
  // biome-ignore lint/suspicious/noExplicitAny: Anthropic SDK params
  params: Record<string, any>,
  signal?: AbortSignal,
) {
  const oaiRequest = anthropicToOpenAIRequest(params, config.model)
  const body = JSON.stringify({ ...oaiRequest, stream: true, stream_options: { include_usage: true } })

  let response: Response
  try {
    response = await fetch(`${config.baseURL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${config.apiKey}`,
        'User-Agent': 'OpenCodeAgent/0.1',
      },
      body,
      signal,
    })
  } catch (err) {
    if (err instanceof Error && err.name === 'AbortError') throw err
    throw new APIConnectionTimeoutError()
  }

  if (!response.ok) {
    const errBody = await response.text().catch(() => '')
    throw mapHTTPError(response.status, errBody)
  }

  if (!response.body) {
    throw new Error('[OpenCodeAgent] Empty response body from provider')
  }

  const state = createStreamState(config.model ?? params.model ?? 'unknown')
  const reader = response.body.getReader()
  const decoder = new TextDecoder()
  let buffer = ''

  try {
    while (true) {
      const { done, value } = await reader.read()
      if (done) break

      buffer += decoder.decode(value, { stream: true })
      const lines = buffer.split('\n')
      buffer = lines.pop() ?? ''

      for (const line of lines) {
        const trimmed = line.trim()
        if (!trimmed) continue
        const chunk = parseSSELine(trimmed)
        if (!chunk) continue
        const events = openAIChunkToAnthropicEvents(chunk, state)
        for (const event of events) {
          yield event
        }
      }
    }

    // Process any remaining buffer
    if (buffer.trim()) {
      const chunk = parseSSELine(buffer.trim())
      if (chunk) {
        const events = openAIChunkToAnthropicEvents(chunk, state)
        for (const event of events) yield event
      }
    }
  } finally {
    reader.releaseLock()
  }
}

/** Create a streaming API promise (with .withResponse()) */
function createStreamAPIPromise(
  config: OCAProviderConfig,
  // biome-ignore lint/suspicious/noExplicitAny: Anthropic SDK params
  params: Record<string, any>,
  options?: { signal?: AbortSignal; headers?: Record<string, string> },
) {
  // Lazy: only starts fetch when .withResponse() is called
  const withResponse = async () => {
    const oaiRequest = anthropicToOpenAIRequest(params, config.model)
    const body = JSON.stringify({ ...oaiRequest, stream: true, stream_options: { include_usage: true } })

    let response: Response
    try {
      response = await fetch(`${config.baseURL}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${config.apiKey}`,
          'User-Agent': 'OpenCodeAgent/0.1',
          ...(options?.headers ?? {}),
        },
        body,
        signal: options?.signal,
      })
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') throw err
      throw new APIConnectionTimeoutError()
    }

    if (!response.ok) {
      const errBody = await response.text().catch(() => '')
      throw mapHTTPError(response.status, errBody)
    }

    const requestId = response.headers.get('x-request-id')

    // Build the async generator stream
    const state = createStreamState(config.model ?? params.model ?? 'unknown')
    const reader = response.body!.getReader()
    const decoder = new TextDecoder()

    async function* generateEvents() {
      let buffer = ''
      try {
        while (true) {
          const { done, value } = await reader.read()
          if (done) break
          buffer += decoder.decode(value, { stream: true })
          const lines = buffer.split('\n')
          buffer = lines.pop() ?? ''
          for (const line of lines) {
            const chunk = parseSSELine(line.trim())
            if (!chunk) continue
            for (const event of openAIChunkToAnthropicEvents(chunk, state)) {
              yield event
            }
          }
        }
        if (buffer.trim()) {
          const chunk = parseSSELine(buffer.trim())
          if (chunk) {
            for (const event of openAIChunkToAnthropicEvents(chunk, state)) yield event
          }
        }
      } finally {
        reader.releaseLock()
      }
    }

    // Attach controller so claude.ts can identify this as a stream (not an error message)
    const streamIterable = generateEvents()
    const streamWithController = Object.assign(streamIterable, {
      controller: new AbortController(),
    })

    return {
      data: streamWithController,
      response,
      request_id: requestId,
    }
  }

  return { withResponse }
}

// ──────────────────────────────────────────────────────────────────────────────
// Non-streaming request
// ──────────────────────────────────────────────────────────────────────────────

async function callNonStreaming(
  config: OCAProviderConfig,
  // biome-ignore lint/suspicious/noExplicitAny: Anthropic SDK params
  params: Record<string, any>,
  options?: { signal?: AbortSignal; timeout?: number },
): Promise<BetaMessage> {
  const oaiRequest = anthropicToOpenAIRequest(params, config.model)
  const body = JSON.stringify({ ...oaiRequest, stream: false })

  let response: Response
  const controller = new AbortController()
  const signal = options?.signal ?? controller.signal

  const timeoutId = options?.timeout
    ? setTimeout(() => controller.abort(), options.timeout)
    : null

  try {
    response = await fetch(`${config.baseURL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${config.apiKey}`,
        'User-Agent': 'OpenCodeAgent/0.1',
      },
      body,
      signal,
    })
  } catch (err) {
    if (err instanceof Error && err.name === 'AbortError') {
      if (options?.timeout) throw new APIConnectionTimeoutError()
      throw err
    }
    throw new APIConnectionTimeoutError()
  } finally {
    if (timeoutId) clearTimeout(timeoutId)
  }

  if (!response.ok) {
    const errBody = await response.text().catch(() => '')
    throw mapHTTPError(response.status, errBody)
  }

  const json = await response.json() as Record<string, unknown>
  return openAIResponseToAnthropicMessage(json)
}

// ──────────────────────────────────────────────────────────────────────────────
// Public factory
// ──────────────────────────────────────────────────────────────────────────────

/**
 * Create a fake Anthropic SDK client that internally calls an OpenAI-compatible API.
 *
 * The returned object satisfies enough of the `Anthropic` interface for
 * `claude.ts` to use without modification:
 *   - `anthropic.beta.messages.create(params)` — non-streaming
 *   - `anthropic.beta.messages.create({ stream: true }).withResponse()` — streaming
 */
export function createOpenAICompatClient(config: OCAProviderConfig): Anthropic {
  const fakeClient = {
    beta: {
      messages: {
        create(
          // biome-ignore lint/suspicious/noExplicitAny: Anthropic SDK params
          params: Record<string, any>,
          options?: { signal?: AbortSignal; timeout?: number; headers?: Record<string, string> },
        ) {
          if (params.stream) {
            return createStreamAPIPromise(config, params, options)
          }
          // Non-streaming: return a thenable Promise-like
          return callNonStreaming(config, params, options)
        },
      },
    },
    // Stub other Anthropic client properties that may be referenced
    apiKey: config.apiKey,
    baseURL: config.baseURL,
  }

  return fakeClient as unknown as Anthropic
}

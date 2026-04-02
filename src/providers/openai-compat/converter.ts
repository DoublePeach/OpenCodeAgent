/**
 * OpenCodeAgent — Anthropic ↔ OpenAI format converter
 *
 * Converts request params from Anthropic SDK format to OpenAI chat completions format,
 * and converts OpenAI streaming chunks back to Anthropic BetaRawMessageStreamEvent format.
 */

import type {
  BetaMessage,
  BetaRawMessageStreamEvent,
} from '@anthropic-ai/sdk/resources/beta/messages/messages.mjs'

// ──────────────────────────────────────────────────────────────────────────────
// Request conversion: Anthropic → OpenAI
// ──────────────────────────────────────────────────────────────────────────────

/** OpenAI chat message role */
type OAIRole = 'system' | 'user' | 'assistant' | 'tool'

interface OAIMessage {
  role: OAIRole
  content: string | null
  tool_calls?: OAIToolCall[]
  tool_call_id?: string
  name?: string
}

interface OAIToolCall {
  id: string
  type: 'function'
  function: { name: string; arguments: string }
}

interface OAITool {
  type: 'function'
  function: {
    name: string
    description?: string
    parameters?: Record<string, unknown>
  }
}

interface OAIRequestParams {
  model: string
  messages: OAIMessage[]
  tools?: OAITool[]
  tool_choice?: 'auto' | 'none' | 'required'
  max_tokens?: number
  temperature?: number
  stream?: boolean
}

/**
 * Convert Anthropic SDK request params to OpenAI chat completions params.
 * `modelOverride` replaces the model name when the provider uses different model IDs.
 */
export function anthropicToOpenAIRequest(
  // biome-ignore lint/suspicious/noExplicitAny: dynamic SDK params
  params: Record<string, any>,
  modelOverride?: string,
): OAIRequestParams {
  const messages: OAIMessage[] = []

  // System prompt → first system message
  if (params.system) {
    const systemText = Array.isArray(params.system)
      ? params.system
          .filter((b: Record<string, unknown>) => b.type === 'text')
          .map((b: Record<string, unknown>) => b.text as string)
          .join('\n\n')
      : String(params.system)

    if (systemText.trim()) {
      messages.push({ role: 'system', content: systemText })
    }
  }

  // Convert messages
  for (const msg of params.messages ?? []) {
    const converted = convertAnthropicMessage(msg)
    messages.push(...converted)
  }

  // Convert tools
  const tools: OAITool[] | undefined =
    params.tools && params.tools.length > 0
      ? params.tools.map(convertAnthropicTool)
      : undefined

  return {
    model: modelOverride ?? params.model,
    messages,
    ...(tools && { tools, tool_choice: 'auto' }),
    max_tokens: params.max_tokens,
    temperature: params.temperature,
  }
}

// biome-ignore lint/suspicious/noExplicitAny: dynamic SDK message types
function convertAnthropicMessage(msg: Record<string, any>): OAIMessage[] {
  const { role, content } = msg

  // Simple string content
  if (typeof content === 'string') {
    return [{ role: role as OAIRole, content }]
  }

  if (!Array.isArray(content)) {
    return [{ role: role as OAIRole, content: String(content) }]
  }

  if (role === 'user') {
    return convertUserMessage(content)
  }

  if (role === 'assistant') {
    return convertAssistantMessage(content)
  }

  return [{ role: role as OAIRole, content: extractTextContent(content) }]
}

// biome-ignore lint/suspicious/noExplicitAny: dynamic content blocks
function convertUserMessage(content: any[]): OAIMessage[] {
  const toolResults: OAIMessage[] = []
  const textParts: string[] = []

  for (const block of content) {
    if (block.type === 'tool_result') {
      // Each tool_result becomes a separate 'tool' role message
      const resultContent = Array.isArray(block.content)
        ? block.content
            .filter((b: Record<string, unknown>) => b.type === 'text')
            .map((b: Record<string, unknown>) => b.text as string)
            .join('\n')
        : String(block.content ?? '')

      toolResults.push({
        role: 'tool',
        content: resultContent,
        tool_call_id: block.tool_use_id,
      })
    } else if (block.type === 'text') {
      textParts.push(block.text as string)
    }
    // image blocks: skip for now (most OpenAI-compat providers handle differently)
  }

  const messages: OAIMessage[] = []

  // If we have text AND tool results, put tool results first (they belong to prior turn)
  if (textParts.length > 0) {
    messages.push({ role: 'user', content: textParts.join('\n') })
  }

  messages.push(...toolResults)

  // Pure tool_result message with no text (common case)
  if (toolResults.length > 0 && textParts.length === 0) {
    return toolResults
  }

  return messages.length > 0 ? messages : [{ role: 'user', content: '' }]
}

// biome-ignore lint/suspicious/noExplicitAny: dynamic content blocks
function convertAssistantMessage(content: any[]): OAIMessage[] {
  const textParts: string[] = []
  const toolCalls: OAIToolCall[] = []

  for (const block of content) {
    if (block.type === 'text') {
      textParts.push(block.text as string)
    } else if (block.type === 'tool_use') {
      toolCalls.push({
        id: block.id as string,
        type: 'function',
        function: {
          name: block.name as string,
          arguments: JSON.stringify(block.input ?? {}),
        },
      })
    }
    // thinking blocks: skip (not supported in OpenAI-compat)
  }

  return [
    {
      role: 'assistant',
      content: textParts.join('\n') || null,
      ...(toolCalls.length > 0 && { tool_calls: toolCalls }),
    },
  ]
}

// biome-ignore lint/suspicious/noExplicitAny: dynamic tool definition
function convertAnthropicTool(tool: Record<string, any>): OAITool {
  return {
    type: 'function',
    function: {
      name: tool.name as string,
      description: tool.description as string | undefined,
      parameters: (tool.input_schema ?? tool.parameters) as Record<string, unknown> | undefined,
    },
  }
}

// biome-ignore lint/suspicious/noExplicitAny: dynamic content blocks
function extractTextContent(content: any[]): string {
  return content
    .filter(b => b.type === 'text')
    .map((b: Record<string, unknown>) => b.text as string)
    .join('\n')
}

// ──────────────────────────────────────────────────────────────────────────────
// Response conversion: OpenAI streaming → Anthropic BetaRawMessageStreamEvent
// ──────────────────────────────────────────────────────────────────────────────

/** Mutable state kept while converting a single streaming response */
export interface StreamConversionState {
  messageId: string
  model: string
  inputTokens: number
  outputTokens: number
  /** Index of the currently open text content block (-1 = none) */
  textBlockIndex: number
  /** Map: openai tool_call index → anthropic content block index */
  toolBlockIndexMap: Map<number, number>
  /** Next Anthropic content block index to assign */
  nextBlockIndex: number
  /** Whether message_start has been emitted */
  started: boolean
}

export function createStreamState(model: string): StreamConversionState {
  return {
    messageId: `msg_${Math.random().toString(36).slice(2, 12)}`,
    model,
    inputTokens: 0,
    outputTokens: 0,
    textBlockIndex: -1,
    toolBlockIndexMap: new Map(),
    nextBlockIndex: 0,
    started: false,
  }
}

/** Parse one OpenAI SSE data line into Anthropic events */
export function openAIChunkToAnthropicEvents(
  // biome-ignore lint/suspicious/noExplicitAny: dynamic chunk types
  chunk: Record<string, any>,
  state: StreamConversionState,
): BetaRawMessageStreamEvent[] {
  const events: BetaRawMessageStreamEvent[] = []

  // Extract usage if present (some providers include it in first or last chunk)
  if (chunk.usage) {
    state.inputTokens = chunk.usage.prompt_tokens ?? state.inputTokens
    state.outputTokens = chunk.usage.completion_tokens ?? state.outputTokens
  }

  const messageId = chunk.id ?? state.messageId
  if (!state.started) {
    state.messageId = messageId
    state.started = true
    events.push(makeMessageStart(state))
  }

  const choice = chunk.choices?.[0]
  if (!choice) return events

  const delta = choice.delta ?? {}
  const finishReason = choice.finish_reason

  // Text delta
  if (typeof delta.content === 'string' && delta.content !== '') {
    if (state.textBlockIndex === -1) {
      state.textBlockIndex = state.nextBlockIndex++
      events.push({
        type: 'content_block_start',
        index: state.textBlockIndex,
        content_block: { type: 'text', text: '' },
      } as unknown as BetaRawMessageStreamEvent)
    }
    events.push({
      type: 'content_block_delta',
      index: state.textBlockIndex,
      delta: { type: 'text_delta', text: delta.content },
    } as unknown as BetaRawMessageStreamEvent)
  }

  // Tool call deltas
  if (Array.isArray(delta.tool_calls)) {
    for (const tc of delta.tool_calls) {
      const oaiIdx: number = tc.index ?? 0

      if (tc.id && !state.toolBlockIndexMap.has(oaiIdx)) {
        // Close any open text block
        if (state.textBlockIndex !== -1) {
          events.push({ type: 'content_block_stop', index: state.textBlockIndex } as BetaRawMessageStreamEvent)
          state.textBlockIndex = -1
        }
        const blockIdx = state.nextBlockIndex++
        state.toolBlockIndexMap.set(oaiIdx, blockIdx)
        events.push({
          type: 'content_block_start',
          index: blockIdx,
          content_block: {
            type: 'tool_use',
            id: tc.id as string,
            name: (tc.function?.name ?? '') as string,
            input: {},
          },
        } as unknown as BetaRawMessageStreamEvent)
      }

      const blockIdx = state.toolBlockIndexMap.get(oaiIdx)
      if (blockIdx !== undefined && tc.function?.arguments) {
        events.push({
          type: 'content_block_delta',
          index: blockIdx,
          delta: { type: 'input_json_delta', partial_json: tc.function.arguments as string },
        } as unknown as BetaRawMessageStreamEvent)
      }
    }
  }

  // Finish
  if (finishReason !== null && finishReason !== undefined) {
    // Close text block
    if (state.textBlockIndex !== -1) {
      events.push({ type: 'content_block_stop', index: state.textBlockIndex } as BetaRawMessageStreamEvent)
    }
    // Close all tool blocks
    for (const blockIdx of state.toolBlockIndexMap.values()) {
      events.push({ type: 'content_block_stop', index: blockIdx } as BetaRawMessageStreamEvent)
    }

    const stopReason = mapFinishReason(finishReason as string)
    events.push({
      type: 'message_delta',
      delta: { stop_reason: stopReason, stop_sequence: null },
      usage: { output_tokens: state.outputTokens },
    } as unknown as BetaRawMessageStreamEvent)
    events.push({ type: 'message_stop' } as BetaRawMessageStreamEvent)
  }

  return events
}

function makeMessageStart(state: StreamConversionState): BetaRawMessageStreamEvent {
  const message: BetaMessage = {
    id: state.messageId,
    type: 'message',
    role: 'assistant',
    content: [],
    model: state.model,
    stop_reason: null,
    stop_sequence: null,
    usage: { input_tokens: state.inputTokens, output_tokens: 0 },
  } as unknown as BetaMessage
  return { type: 'message_start', message } as BetaRawMessageStreamEvent
}

function mapFinishReason(reason: string): string {
  switch (reason) {
    case 'tool_calls':
    case 'function_call':
      return 'tool_use'
    case 'length':
      return 'max_tokens'
    case 'content_filter':
      return 'stop_sequence'
    default:
      return 'end_turn'
  }
}

// ──────────────────────────────────────────────────────────────────────────────
// Non-streaming response conversion: OpenAI → Anthropic BetaMessage
// ──────────────────────────────────────────────────────────────────────────────

/** Convert an OpenAI non-streaming response to Anthropic BetaMessage */
// biome-ignore lint/suspicious/noExplicitAny: dynamic response types
export function openAIResponseToAnthropicMessage(oai: Record<string, any>): BetaMessage {
  // biome-ignore lint/suspicious/noExplicitAny: dynamic content block types
  const content: any[] = []
  const choice = oai.choices?.[0]
  const msg = choice?.message ?? {}

  if (msg.content) {
    content.push({ type: 'text', text: msg.content as string })
  }

  if (Array.isArray(msg.tool_calls)) {
    for (const tc of msg.tool_calls) {
      let parsedInput: unknown = {}
      try {
        parsedInput = JSON.parse(tc.function?.arguments ?? '{}')
      } catch {
        parsedInput = {}
      }
      content.push({
        type: 'tool_use',
        id: tc.id as string,
        name: tc.function?.name as string,
        input: parsedInput,
      })
    }
  }

  const stopReason = mapFinishReason(choice?.finish_reason ?? 'stop')
  const usage = oai.usage ?? {}

  return {
    id: oai.id ?? `msg_${Math.random().toString(36).slice(2, 12)}`,
    type: 'message',
    role: 'assistant',
    content,
    model: oai.model ?? '',
    stop_reason: stopReason,
    stop_sequence: null,
    usage: {
      input_tokens: usage.prompt_tokens ?? 0,
      output_tokens: usage.completion_tokens ?? 0,
    },
  } as unknown as BetaMessage
}

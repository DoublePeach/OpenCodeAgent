/**
 * OpenCodeAgent — Model capability matrix
 *
 * Declares known capabilities for popular models.
 * Used to decide which tools / features are safe to enable per model.
 * Unknown models are assumed to support tools but no vision or extended context.
 */

export interface ModelCapabilities {
  /** Supports function/tool calling */
  tools: boolean
  /** Supports vision (image input) */
  vision: boolean
  /** Maximum context window in tokens */
  contextWindow: number
  /** Supports JSON mode / structured output */
  jsonMode: boolean
}

const DEFAULT_CAPS: ModelCapabilities = {
  tools: true,
  vision: false,
  contextWindow: 32_000,
  jsonMode: false,
}

/** Known model capabilities keyed by model name prefix or exact name */
const CAPABILITY_MAP: Record<string, ModelCapabilities> = {
  // ── Anthropic ────────────────────────────────────────────────────────────
  'claude-3-5-haiku':    { tools: true, vision: true,  contextWindow: 200_000, jsonMode: true },
  'claude-3-5-sonnet':   { tools: true, vision: true,  contextWindow: 200_000, jsonMode: true },
  'claude-3-7-sonnet':   { tools: true, vision: true,  contextWindow: 200_000, jsonMode: true },
  'claude-3-opus':       { tools: true, vision: true,  contextWindow: 200_000, jsonMode: true },
  'claude-haiku-4':      { tools: true, vision: true,  contextWindow: 200_000, jsonMode: true },
  'claude-sonnet-4':     { tools: true, vision: true,  contextWindow: 200_000, jsonMode: true },
  'claude-opus-4':       { tools: true, vision: true,  contextWindow: 200_000, jsonMode: true },

  // ── DeepSeek ─────────────────────────────────────────────────────────────
  'deepseek-chat':       { tools: true, vision: false, contextWindow: 64_000,  jsonMode: true },
  'deepseek-coder':      { tools: true, vision: false, contextWindow: 128_000, jsonMode: true },
  'deepseek-reasoner':   { tools: false, vision: false, contextWindow: 64_000, jsonMode: false },

  // ── Alibaba Qwen / 百炼 ───────────────────────────────────────────────────
  'qwen-max':            { tools: true, vision: false, contextWindow: 32_000,  jsonMode: true },
  'qwen-plus':           { tools: true, vision: false, contextWindow: 131_072, jsonMode: true },
  'qwen-turbo':          { tools: true, vision: false, contextWindow: 131_072, jsonMode: true },
  'qwen-long':           { tools: true, vision: false, contextWindow: 1_000_000, jsonMode: true },
  'qwen-vl-max':         { tools: true, vision: true,  contextWindow: 32_000,  jsonMode: true },
  'qwen2.5-coder':       { tools: true, vision: false, contextWindow: 128_000, jsonMode: true },
  'qwen2.5-72b':         { tools: true, vision: false, contextWindow: 128_000, jsonMode: true },

  // ── Volcengine Doubao / 火山引擎 ──────────────────────────────────────────
  'doubao-pro-32k':      { tools: true, vision: false, contextWindow: 32_000,  jsonMode: true },
  'doubao-pro-128k':     { tools: true, vision: false, contextWindow: 128_000, jsonMode: true },
  'doubao-lite-32k':     { tools: true, vision: false, contextWindow: 32_000,  jsonMode: true },

  // ── OpenAI ───────────────────────────────────────────────────────────────
  'gpt-4o':              { tools: true, vision: true,  contextWindow: 128_000, jsonMode: true },
  'gpt-4o-mini':         { tools: true, vision: true,  contextWindow: 128_000, jsonMode: true },
  'gpt-4-turbo':         { tools: true, vision: true,  contextWindow: 128_000, jsonMode: true },
  'o1':                  { tools: false, vision: true,  contextWindow: 200_000, jsonMode: false },
  'o3':                  { tools: true, vision: true,  contextWindow: 200_000, jsonMode: true },

  // ── Common Ollama models ──────────────────────────────────────────────────
  'llama3':              { tools: true, vision: false, contextWindow: 8_000,   jsonMode: false },
  'llama3.1':            { tools: true, vision: false, contextWindow: 128_000, jsonMode: false },
  'llama3.2':            { tools: true, vision: false, contextWindow: 128_000, jsonMode: false },
  'mistral':             { tools: true, vision: false, contextWindow: 32_000,  jsonMode: true },
  'codellama':           { tools: false, vision: false, contextWindow: 16_000, jsonMode: false },
  'phi3':                { tools: false, vision: false, contextWindow: 128_000, jsonMode: false },
  'gemma2':              { tools: false, vision: false, contextWindow: 8_000,  jsonMode: false },
}

/**
 * Get capabilities for a model, matching by prefix if no exact match.
 * Falls back to DEFAULT_CAPS for unknown models.
 */
export function getModelCapabilities(model: string): ModelCapabilities {
  // Exact match first
  if (CAPABILITY_MAP[model]) return CAPABILITY_MAP[model]

  // Prefix match (e.g. 'qwen2.5-coder-7b' → 'qwen2.5-coder')
  for (const [key, caps] of Object.entries(CAPABILITY_MAP)) {
    if (model.startsWith(key)) return caps
  }

  return DEFAULT_CAPS
}

/** Returns true if the model is known to support tool/function calling */
export function modelSupportsTools(model: string): boolean {
  return getModelCapabilities(model).tools
}

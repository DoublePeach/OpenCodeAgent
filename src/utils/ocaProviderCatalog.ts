/**
 * Shared catalog of OpenCodeAgent AI providers (SetupWizard + /provider command).
 */

import { readOcaSettings, writeOcaSettings, type OcaSettings } from './ocaSettings.js'

export interface OcaProviderCatalogEntry {
  id: string
  label: string
  type: NonNullable<OcaSettings['provider']>
  defaultBaseUrl?: string
  defaultModel?: string
  needsApiKey: boolean
  needsBaseUrl: boolean
}

export const OCA_PROVIDER_CATALOG: OcaProviderCatalogEntry[] = [
  {
    id: 'anthropic',
    label: 'Anthropic Claude (Official)',
    type: 'anthropic',
    needsApiKey: true,
    needsBaseUrl: false,
  },
  {
    id: 'deepseek',
    label: 'DeepSeek',
    type: 'openai-compat',
    defaultBaseUrl: 'https://api.deepseek.com',
    defaultModel: 'deepseek-chat',
    needsApiKey: true,
    needsBaseUrl: false,
  },
  {
    id: 'qwen',
    label: '阿里百炼 / Qwen',
    type: 'openai-compat',
    defaultBaseUrl: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
    defaultModel: 'qwen-max',
    needsApiKey: true,
    needsBaseUrl: false,
  },
  {
    id: 'doubao',
    label: '火山引擎 / Doubao',
    type: 'openai-compat',
    defaultBaseUrl: 'https://ark.cn-beijing.volces.com/api/v3',
    defaultModel: 'doubao-1-5-pro-32k',
    needsApiKey: true,
    needsBaseUrl: false,
  },
  {
    id: 'openai',
    label: 'OpenAI',
    type: 'openai-compat',
    defaultBaseUrl: 'https://api.openai.com/v1',
    defaultModel: 'gpt-4o',
    needsApiKey: true,
    needsBaseUrl: false,
  },
  {
    id: 'ollama',
    label: 'Ollama (Local / 本地)',
    type: 'ollama',
    defaultBaseUrl: 'http://localhost:11434',
    defaultModel: 'qwen2.5-coder:7b',
    needsApiKey: false,
    needsBaseUrl: true,
  },
  {
    id: 'custom',
    label: 'Custom OpenAI-compatible / 自定义',
    type: 'openai-compat',
    needsApiKey: true,
    needsBaseUrl: true,
  },
]

/**
 * Persist full settings and mirror them into the current process environment
 * so the next API call uses the new provider without restarting.
 */
export function persistAndApplyOcaSettings(settings: OcaSettings): void {
  writeOcaSettings(settings)

  if (settings.language) {
    process.env['OCA_LANG'] = settings.language
  }
  if (settings.provider) {
    process.env['OCA_PROVIDER'] = settings.provider
  }
  if (settings.openaiBaseUrl) {
    process.env['OPENAI_BASE_URL'] = settings.openaiBaseUrl
    if (settings.provider === 'ollama') {
      const u = settings.openaiBaseUrl.replace(/\/$/, '')
      process.env['OLLAMA_BASE_URL'] = u.replace(/\/v1\/?$/, '') || u
    }
  }
  if (settings.apiKey) {
    if (settings.provider === 'anthropic') {
      process.env['ANTHROPIC_API_KEY'] = settings.apiKey
    } else {
      process.env['OPENAI_API_KEY'] = settings.apiKey
    }
  }
  if (settings.model) {
    process.env['OCA_MODEL'] = settings.model
  }
}

/** Best-effort match of current env + saved settings to a catalog index. */
export function guessProviderCatalogIndex(): number {
  const saved = readOcaSettings()
  const p = (process.env['OCA_PROVIDER'] ?? saved.provider)?.toLowerCase()
  const base =
    process.env['OPENAI_BASE_URL'] ??
    process.env['OLLAMA_BASE_URL'] ??
    saved.openaiBaseUrl ??
    ''

  if (p === 'anthropic') {
    return OCA_PROVIDER_CATALOG.findIndex(e => e.id === 'anthropic')
  }
  if (p === 'ollama') {
    return OCA_PROVIDER_CATALOG.findIndex(e => e.id === 'ollama')
  }
  if (p === 'openai-compat' || p === 'openai') {
    const normalized = base.replace(/\/$/, '')
    for (let i = 0; i < OCA_PROVIDER_CATALOG.length; i++) {
      const e = OCA_PROVIDER_CATALOG[i]!
      if (e.type !== 'openai-compat' || !e.defaultBaseUrl) continue
      if (normalized && e.defaultBaseUrl.replace(/\/$/, '') === normalized) {
        return i
      }
    }
    const customIdx = OCA_PROVIDER_CATALOG.findIndex(e => e.id === 'custom')
    return customIdx >= 0 ? customIdx : 0
  }

  if (saved.provider === 'anthropic') {
    return OCA_PROVIDER_CATALOG.findIndex(e => e.id === 'anthropic')
  }
  if (saved.provider === 'ollama') {
    return OCA_PROVIDER_CATALOG.findIndex(e => e.id === 'ollama')
  }

  return 0
}

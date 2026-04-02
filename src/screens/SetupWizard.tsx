/**
 * OpenCodeAgent first-run setup wizard.
 *
 * Step order:
 *  1. Language selection  ← first, so remaining wizard text uses the chosen language
 *  2. Provider selection
 *  3. API key & base URL
 *  4. Connectivity test
 *
 * On completion, settings are persisted to ~/.oca/settings.json and applied
 * as environment variables for the remainder of this process.
 */

import * as React from 'react'
import { useCallback, useEffect, useState } from 'react'
import { Box, Text, useInput } from '../ink.js'
import { t, initI18n } from '../i18n/index.js'
import {
  type OcaSettings,
  patchOcaSettings,
  writeOcaSettings,
} from '../utils/ocaSettings.js'

// ── Types ─────────────────────────────────────────────────────────────────────

type WizardStep = 'language' | 'provider' | 'apikey' | 'connectivity' | 'done'

interface ProviderOption {
  id: string
  label: string
  type: OcaSettings['provider']
  defaultBaseUrl?: string
  defaultModel?: string
  needsApiKey: boolean
  needsBaseUrl: boolean
}

type ConnectivityStatus = 'idle' | 'testing' | 'success' | 'failed'

type Props = {
  /** Called when the wizard completes successfully */
  onComplete: (settings: OcaSettings) => void
  /** Called when the user presses Escape to skip */
  onSkip: () => void
}

// ── Language options ──────────────────────────────────────────────────────────

const LANGUAGES = [
  { code: 'en', label: 'English' },
  { code: 'zh-CN', label: '简体中文' },
]

// ── Provider definitions ──────────────────────────────────────────────────────

const PROVIDERS: ProviderOption[] = [
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

// ── Connectivity test ─────────────────────────────────────────────────────────

async function testConnectivity(
  provider: ProviderOption,
  baseUrl: string,
  apiKey: string,
  model: string,
): Promise<{ ok: boolean; error?: string }> {
  try {
    if (provider.id === 'ollama') {
      // For Ollama, just check if the server is running
      const ollamaBase = baseUrl || 'http://localhost:11434'
      const resp = await fetch(`${ollamaBase}/api/tags`, {
        signal: AbortSignal.timeout(5_000),
      }).catch(() => null)
      if (resp?.ok) return { ok: true }
      return { ok: false, error: 'Ollama not reachable. Is it running? (ollama serve)' }
    }

    if (provider.type === 'anthropic') {
      const resp = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          model: model || 'claude-3-haiku-20240307',
          max_tokens: 1,
          messages: [{ role: 'user', content: 'hi' }],
        }),
        signal: AbortSignal.timeout(10_000),
      })
      if (resp.status === 200 || resp.status === 400) return { ok: true }
      if (resp.status === 401) return { ok: false, error: 'Invalid API key (401)' }
      return { ok: false, error: `HTTP ${resp.status}` }
    }

    // OpenAI-compatible
    const url = `${baseUrl}/chat/completions`
    const resp = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: model,
        max_tokens: 1,
        messages: [{ role: 'user', content: 'hi' }],
      }),
      signal: AbortSignal.timeout(10_000),
    })
    if (resp.status === 200 || resp.status === 400) return { ok: true }
    if (resp.status === 401 || resp.status === 403)
      return { ok: false, error: `Invalid API key (${resp.status})` }
    return { ok: false, error: `HTTP ${resp.status}` }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err)
    return { ok: false, error: msg }
  }
}

// ── Reusable SelectList ───────────────────────────────────────────────────────

function SelectList<T extends { id: string; label: string }>({
  items,
  selectedIndex,
  onSelect,
}: {
  items: T[]
  selectedIndex: number
  onSelect: (index: number) => void
}) {
  useInput((_, key) => {
    if (key.upArrow) onSelect(Math.max(0, selectedIndex - 1))
    if (key.downArrow) onSelect(Math.min(items.length - 1, selectedIndex + 1))
  })

  return (
    <Box flexDirection="column">
      {items.map((item, i) => (
        <Box key={item.id}>
          <Text color={i === selectedIndex ? 'cyan' : undefined}>
            {i === selectedIndex ? '▶ ' : '  '}
            {item.label}
          </Text>
        </Box>
      ))}
    </Box>
  )
}

// ── Inline TextInput (single-field) ──────────────────────────────────────────

function InlineInput({
  label,
  value,
  onChange,
  mask,
  placeholder,
  active,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  mask?: boolean
  placeholder?: string
  active: boolean
}) {
  useInput((input, key) => {
    if (!active) return
    if (key.backspace || key.delete) {
      onChange(value.slice(0, -1))
    } else if (input && !key.ctrl && !key.meta && !key.tab && !key.return) {
      onChange(value + input)
    }
  })

  const display = mask ? '•'.repeat(value.length) : value
  const shown = display || placeholder || ''
  const isPlaceholder = !display

  return (
    <Box>
      <Text bold color={active ? 'cyan' : 'white'}>
        {active ? '▶ ' : '  '}
        {label}:{' '}
      </Text>
      <Text color={isPlaceholder ? 'gray' : 'white'}>{shown}</Text>
      {active && <Text color="cyan">█</Text>}
    </Box>
  )
}

// ── Main Wizard ───────────────────────────────────────────────────────────────

export function SetupWizard({ onComplete, onSkip }: Props) {
  const [step, setStep] = useState<WizardStep>('language')
  const [langIndex, setLangIndex] = useState(0)
  const [providerIndex, setProviderIndex] = useState(0)
  const [apiKey, setApiKey] = useState('')
  const [baseUrl, setBaseUrl] = useState('')
  const [model, setModel] = useState('')
  const [connectivity, setConnectivity] = useState<ConnectivityStatus>('idle')
  const [connectivityError, setConnectivityError] = useState('')
  const [activeField, setActiveField] = useState<'apikey' | 'baseurl' | 'model'>('apikey')

  const selectedProvider = PROVIDERS[providerIndex]!
  const selectedLang = LANGUAGES[langIndex]!

  // Prefill defaults when provider changes
  useEffect(() => {
    setBaseUrl(selectedProvider.defaultBaseUrl ?? '')
    setModel(selectedProvider.defaultModel ?? '')
    setApiKey('')
    setActiveField(selectedProvider.needsBaseUrl && !selectedProvider.needsApiKey ? 'baseurl' : 'apikey')
  }, [providerIndex, selectedProvider.defaultBaseUrl, selectedProvider.defaultModel, selectedProvider.needsBaseUrl, selectedProvider.needsApiKey])

  const runConnectivityTest = useCallback(async () => {
    setConnectivity('testing')
    setConnectivityError('')
    const result = await testConnectivity(
      selectedProvider,
      baseUrl || selectedProvider.defaultBaseUrl || '',
      apiKey,
      model || selectedProvider.defaultModel || '',
    )
    if (result.ok) {
      setConnectivity('success')
    } else {
      setConnectivity('failed')
      setConnectivityError(result.error ?? 'Unknown error')
    }
  }, [selectedProvider, baseUrl, apiKey, model])

  const buildSettings = useCallback((): OcaSettings => {
    const lang = selectedLang.code
    const base: OcaSettings = {
      provider: selectedProvider.type,
      model: model || selectedProvider.defaultModel,
      language: lang,
      setupCompleted: true,
    }
    if (selectedProvider.type === 'anthropic') {
      base.apiKey = apiKey
    } else {
      base.openaiBaseUrl = baseUrl || selectedProvider.defaultBaseUrl
      base.apiKey = apiKey
    }
    return base
  }, [selectedProvider, selectedLang, apiKey, baseUrl, model])

  const applyAndFinish = useCallback(() => {
    const settings = buildSettings()
    writeOcaSettings(settings)
    // Apply settings to current process env so the main loop picks them up
    if (settings.language) process.env['OCA_LANG'] = settings.language
    if (settings.provider) process.env['OCA_PROVIDER'] = settings.provider
    if (settings.openaiBaseUrl) process.env['OPENAI_BASE_URL'] = settings.openaiBaseUrl
    if (settings.apiKey) {
      if (settings.provider === 'anthropic') {
        process.env['ANTHROPIC_API_KEY'] = settings.apiKey
      } else {
        process.env['OPENAI_API_KEY'] = settings.apiKey
      }
    }
    if (settings.model) process.env['OCA_MODEL'] = settings.model
    onComplete(settings)
  }, [buildSettings, onComplete])

  useInput((input, key) => {
    if (key.escape) {
      onSkip()
      return
    }

    if (step === 'language') {
      if (key.return) {
        // Re-init i18n immediately with chosen language
        initI18n(selectedLang.code)
        setStep('provider')
      }
    } else if (step === 'provider') {
      if (key.return) {
        setStep('apikey')
      }
    } else if (step === 'apikey') {
      if (key.tab) {
        // Cycle through fields: baseurl → apikey → model → (back to start)
        const hasBaseUrl = selectedProvider.needsBaseUrl
        const fields: Array<'apikey' | 'baseurl' | 'model'> = [
          ...(hasBaseUrl ? ['baseurl' as const] : []),
          'apikey' as const,
          'model' as const,
        ]
        const idx = fields.indexOf(activeField)
        setActiveField(fields[(idx + 1) % fields.length]!)
      } else if (key.return) {
        setStep('connectivity')
        void runConnectivityTest()
      }
    } else if (step === 'connectivity') {
      if (connectivity === 'failed') {
        if (input === 'r' || input === 'R') void runConnectivityTest()
        if (key.return) applyAndFinish()
      } else if (connectivity === 'success') {
        if (key.return) applyAndFinish()
      }
    }
  })

  const totalSteps = 4
  const stepNums: Record<WizardStep, number> = {
    language: 1,
    provider: 2,
    apikey: 3,
    connectivity: 4,
    done: 4,
  }

  return (
    <Box flexDirection="column" padding={1}>
      {/* Header */}
      <Box flexDirection="column" marginBottom={1}>
        <Text bold color="cyan">
          ◆ OpenCodeAgent {t('setup.welcome')}
        </Text>
        <Text dimColor>{t('setup.subtitle')}</Text>
        {step !== 'done' && (
          <Text dimColor>
            {t('setup.step', { current: stepNums[step], total: totalSteps })}
            {'  '}
            <Text color="gray">Esc {t('setup.skip')}</Text>
          </Text>
        )}
      </Box>

      {/* ── Step 1: Language ────────────────────────────────────────────── */}
      {step === 'language' && (
        <Box flexDirection="column" gap={1}>
          <Text bold>Choose your UI language / 选择界面语言</Text>
          <SelectList
            items={LANGUAGES.map(l => ({ id: l.code, label: l.label }))}
            selectedIndex={langIndex}
            onSelect={setLangIndex}
          />
          <Text dimColor>↑↓ navigate · Enter confirm · Esc skip setup</Text>
          <Text dimColor color="gray">
            (UI only — system prompts stay in English / 仅影响界面，提示词保持英文)
          </Text>
        </Box>
      )}

      {/* ── Step 2: Provider ────────────────────────────────────────────── */}
      {step === 'provider' && (
        <Box flexDirection="column" gap={1}>
          <Text bold>{t('setup.providerSelect.title')}</Text>
          <SelectList
            items={PROVIDERS}
            selectedIndex={providerIndex}
            onSelect={setProviderIndex}
          />
          <Text dimColor>{t('setup.providerSelect.hint')}</Text>
        </Box>
      )}

      {/* ── Step 3: API Key / URL ────────────────────────────────────────── */}
      {step === 'apikey' && (
        <Box flexDirection="column" gap={1}>
          <Text bold>{t('setup.apiKey.title')}</Text>
          <Text>
            Provider:{' '}
            <Text color="cyan" bold>
              {selectedProvider.label}
            </Text>
          </Text>

          {(selectedProvider.needsBaseUrl || selectedProvider.id === 'ollama') && (
            <InlineInput
              label={t('setup.apiKey.urlLabel')}
              value={baseUrl}
              onChange={setBaseUrl}
              placeholder={selectedProvider.defaultBaseUrl}
              active={activeField === 'baseurl'}
            />
          )}

          {selectedProvider.needsApiKey && (
            <InlineInput
              label={t('setup.apiKey.label')}
              value={apiKey}
              onChange={setApiKey}
              mask
              placeholder="sk-..."
              active={activeField === 'apikey'}
            />
          )}

          <InlineInput
            label="Model"
            value={model}
            onChange={setModel}
            placeholder={selectedProvider.defaultModel ?? 'model-name'}
            active={activeField === 'model'}
          />

          <Text dimColor>
            Tab {t('general.pressAgainExit', { key: '' }).slice(0, 0)}to switch fields · Enter to
            test · {t('setup.apiKey.hint')}
          </Text>
          <Text dimColor>Tab 切换字段 · Enter 下一步 · Esc 跳过配置向导</Text>
        </Box>
      )}

      {/* ── Step 4: Connectivity ─────────────────────────────────────────── */}
      {step === 'connectivity' && (
        <Box flexDirection="column" gap={1}>
          <Text bold>{t('setup.connectivity.title')}</Text>
          <Text>
            Provider:{' '}
            <Text color="cyan">{selectedProvider.label}</Text>
          </Text>

          {connectivity === 'testing' && (
            <Text color="yellow">⟳ Testing connection…</Text>
          )}
          {connectivity === 'success' && (
            <Box flexDirection="column">
              <Text color="green">{t('setup.connectivity.success')}</Text>
              <Text dimColor>Enter to finish setup</Text>
            </Box>
          )}
          {connectivity === 'failed' && (
            <Box flexDirection="column" gap={1}>
              <Text color="red">
                {t('setup.connectivity.failure', { error: connectivityError })}
              </Text>
              <Text dimColor>
                r retry · Enter to save anyway · Esc to cancel
              </Text>
            </Box>
          )}
        </Box>
      )}
    </Box>
  )
}

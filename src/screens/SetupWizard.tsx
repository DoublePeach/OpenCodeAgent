/**
 * OpenCodeAgent first-run setup wizard.
 *
 * Multi-step interactive wizard that guides users through:
 *  1. Provider selection (Anthropic / DeepSeek / Alibaba / Volcengine / Ollama / Custom)
 *  2. API key & base URL configuration
 *  3. Connectivity test
 *  4. Language selection
 *
 * On completion, settings are persisted to ~/.oca/settings.json.
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

type WizardStep = 'provider' | 'apikey' | 'connectivity' | 'language' | 'done'

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
    label: 'Ollama (Local)',
    type: 'ollama',
    defaultBaseUrl: 'http://localhost:11434',
    defaultModel: 'qwen2.5-coder:7b',
    needsApiKey: false,
    needsBaseUrl: true,
  },
  {
    id: 'custom',
    label: 'Custom OpenAI-compatible',
    type: 'openai-compat',
    needsApiKey: true,
    needsBaseUrl: true,
  },
]

const LANGUAGES = [
  { code: 'en', label: 'English' },
  { code: 'zh-CN', label: '简体中文' },
]

// ── Connectivity test ─────────────────────────────────────────────────────────

async function testConnectivity(
  provider: ProviderOption,
  baseUrl: string,
  apiKey: string,
  model: string,
): Promise<{ ok: boolean; error?: string }> {
  try {
    const url =
      provider.type === 'anthropic'
        ? 'https://api.anthropic.com/v1/messages'
        : `${baseUrl}/chat/completions`

    if (provider.type === 'anthropic') {
      const resp = await fetch(url, {
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
      // 200 = ok, 400 = bad request but API is reachable (treat as ok for key check)
      if (resp.status === 200 || resp.status === 400) return { ok: true }
      if (resp.status === 401) return { ok: false, error: 'Invalid API key' }
      return { ok: false, error: `HTTP ${resp.status}` }
    }

    // OpenAI-compatible
    if (provider.id === 'ollama') {
      // For Ollama, just check if the server is running
      const resp = await fetch(`${baseUrl}/api/tags`, {
        signal: AbortSignal.timeout(5_000),
      }).catch(() => null)
      if (resp?.ok) return { ok: true }
      return { ok: false, error: 'Ollama not reachable. Is it running?' }
    }

    const resp = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: model || 'gpt-4o-mini',
        max_tokens: 1,
        messages: [{ role: 'user', content: 'hi' }],
      }),
      signal: AbortSignal.timeout(10_000),
    })
    if (resp.status === 200 || resp.status === 400) return { ok: true }
    if (resp.status === 401 || resp.status === 403)
      return { ok: false, error: 'Invalid API key' }
    return { ok: false, error: `HTTP ${resp.status}` }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err)
    return { ok: false, error: msg }
  }
}

// ── Components ────────────────────────────────────────────────────────────────

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

function TextInput({
  label,
  value,
  onChange,
  mask,
  placeholder,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  mask?: boolean
  placeholder?: string
}) {
  const [focused, setFocused] = useState(true)

  useInput((input, key) => {
    if (!focused) return
    if (key.backspace || key.delete) {
      onChange(value.slice(0, -1))
    } else if (input && !key.ctrl && !key.meta) {
      onChange(value + input)
    }
  })

  const display = mask ? '•'.repeat(value.length) : value
  const shown = display || placeholder || ''
  const isPlaceholder = !display

  return (
    <Box>
      <Text bold>{label}: </Text>
      <Text color={isPlaceholder ? 'gray' : 'white'}>{shown}</Text>
      {focused && <Text color="cyan">█</Text>}
    </Box>
  )
}

// ── Main Wizard ───────────────────────────────────────────────────────────────

export function SetupWizard({ onComplete, onSkip }: Props) {
  const [step, setStep] = useState<WizardStep>('provider')
  const [providerIndex, setProviderIndex] = useState(0)
  const [apiKey, setApiKey] = useState('')
  const [baseUrl, setBaseUrl] = useState('')
  const [model, setModel] = useState('')
  const [langIndex, setLangIndex] = useState(0)
  const [connectivity, setConnectivity] = useState<ConnectivityStatus>('idle')
  const [connectivityError, setConnectivityError] = useState('')
  const [activeField, setActiveField] = useState<'apikey' | 'baseurl' | 'model'>('apikey')

  const selectedProvider = PROVIDERS[providerIndex]!

  // Prefill defaults when provider changes
  useEffect(() => {
    setBaseUrl(selectedProvider.defaultBaseUrl ?? '')
    setModel(selectedProvider.defaultModel ?? '')
    setApiKey('')
  }, [providerIndex, selectedProvider.defaultBaseUrl, selectedProvider.defaultModel])

  const runConnectivityTest = useCallback(async () => {
    setConnectivity('testing')
    setConnectivityError('')
    const result = await testConnectivity(
      selectedProvider,
      baseUrl,
      apiKey,
      model,
    )
    if (result.ok) {
      setConnectivity('success')
    } else {
      setConnectivity('failed')
      setConnectivityError(result.error ?? 'Unknown error')
    }
  }, [selectedProvider, baseUrl, apiKey, model])

  const buildSettings = useCallback((): OcaSettings => {
    const lang = LANGUAGES[langIndex]?.code ?? 'en'
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
  }, [selectedProvider, apiKey, baseUrl, model, langIndex])

  useInput((input, key) => {
    if (key.escape) {
      onSkip()
      return
    }

    if (step === 'provider') {
      if (key.return) {
        setStep('apikey')
        setActiveField(selectedProvider.needsBaseUrl ? 'baseurl' : 'apikey')
      }
    } else if (step === 'apikey') {
      if (key.tab) {
        // Cycle through fields
        if (activeField === 'baseurl') setActiveField('apikey')
        else if (activeField === 'apikey') setActiveField('model')
        else setActiveField(selectedProvider.needsBaseUrl ? 'baseurl' : 'apikey')
      } else if (key.return) {
        setStep('connectivity')
        void runConnectivityTest()
      }
    } else if (step === 'connectivity') {
      if (connectivity === 'failed') {
        if (input === 'r' || input === 'R') void runConnectivityTest()
        if (key.return) setStep('language')
      } else if (connectivity === 'success') {
        if (key.return) setStep('language')
      }
    } else if (step === 'language') {
      if (key.return) {
        const settings = buildSettings()
        // Re-init i18n with chosen language
        initI18n(settings.language)
        writeOcaSettings(settings)
        setStep('done')
      }
    } else if (step === 'done') {
      if (key.return) {
        onComplete(buildSettings())
      }
    }
  })

  const totalSteps = 4
  const stepNums: Record<WizardStep, number> = {
    provider: 1,
    apikey: 2,
    connectivity: 3,
    language: 4,
    done: 4,
  }

  return (
    <Box flexDirection="column" padding={1}>
      {/* Header */}
      <Box flexDirection="column" marginBottom={1}>
        <Text bold color="cyan">
          {t('setup.welcome')}
        </Text>
        <Text dimColor>{t('setup.subtitle')}</Text>
        {step !== 'done' && (
          <Text dimColor>
            {t('setup.step', {
              current: stepNums[step],
              total: totalSteps,
            })}
            {'  '}
            <Text color="gray">Esc to skip</Text>
          </Text>
        )}
      </Box>

      {/* Step: Provider selection */}
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

      {/* Step: API key / URL */}
      {step === 'apikey' && (
        <Box flexDirection="column" gap={1}>
          <Text bold>{t('setup.apiKey.title')}</Text>
          <Text>
            Provider: <Text color="cyan">{selectedProvider.label}</Text>
          </Text>

          {(selectedProvider.needsBaseUrl || selectedProvider.id === 'ollama') && (
            <Box
              borderStyle={activeField === 'baseurl' ? 'round' : undefined}
              borderColor="cyan"
              paddingX={1}
            >
              <TextInput
                label={t('setup.apiKey.urlLabel')}
                value={baseUrl}
                onChange={setBaseUrl}
                placeholder={selectedProvider.defaultBaseUrl}
              />
            </Box>
          )}

          {selectedProvider.needsApiKey && (
            <Box
              borderStyle={activeField === 'apikey' ? 'round' : undefined}
              borderColor="cyan"
              paddingX={1}
            >
              <TextInput
                label={t('setup.apiKey.label')}
                value={apiKey}
                onChange={setApiKey}
                mask
                placeholder="sk-..."
              />
            </Box>
          )}

          <Box
            borderStyle={activeField === 'model' ? 'round' : undefined}
            borderColor="cyan"
            paddingX={1}
          >
            <TextInput
              label="Model"
              value={model}
              onChange={setModel}
              placeholder={selectedProvider.defaultModel ?? 'model-name'}
            />
          </Box>

          <Text dimColor>
            Tab to switch fields · Enter to continue · {t('setup.apiKey.hint')}
          </Text>
        </Box>
      )}

      {/* Step: Connectivity */}
      {step === 'connectivity' && (
        <Box flexDirection="column" gap={1}>
          <Text bold>{t('setup.connectivity.title')}</Text>
          {connectivity === 'testing' && (
            <Text color="yellow">⟳ Testing connection to {selectedProvider.label}…</Text>
          )}
          {connectivity === 'success' && (
            <Text color="green">{t('setup.connectivity.success')}</Text>
          )}
          {connectivity === 'failed' && (
            <Box flexDirection="column">
              <Text color="red">
                {t('setup.connectivity.failure', { error: connectivityError })}
              </Text>
              <Text dimColor>{t('setup.connectivity.retry')}</Text>
            </Box>
          )}
          {(connectivity === 'success' || connectivity === 'failed') && (
            <Text dimColor>Enter to continue</Text>
          )}
        </Box>
      )}

      {/* Step: Language */}
      {step === 'language' && (
        <Box flexDirection="column" gap={1}>
          <Text bold>{t('setup.language.title')}</Text>
          <SelectList
            items={LANGUAGES.map(l => ({ id: l.code, label: l.label }))}
            selectedIndex={langIndex}
            onSelect={setLangIndex}
          />
          <Text dimColor>{t('setup.language.hint')}</Text>
          <Text dimColor>Enter to confirm</Text>
        </Box>
      )}

      {/* Step: Done */}
      {step === 'done' && (
        <Box flexDirection="column" gap={1}>
          <Text bold color="green">
            {t('setup.done.title')}
          </Text>
          <Text>{t('setup.done.message', { cmd: 'bun run dev' })}</Text>
          <Text dimColor>
            {t('setup.done.skipMessage', { cmd: 'oca --setup' })}
          </Text>
          <Text dimColor>Press Enter to start</Text>
        </Box>
      )}
    </Box>
  )
}

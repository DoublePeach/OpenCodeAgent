/**
 * /provider — switch AI vendor (Anthropic / OpenAI-compat / Ollama) and model at any time.
 * Persists to ~/.oca/settings.json and updates process env for the current session.
 */
import * as React from 'react'
import { useCallback, useEffect, useState } from 'react'
import type { CommandResultDisplay } from '../../commands.js'
import { Pane } from '../../components/design-system/Pane.js'
import { Box, Text, useInput } from '../../ink.js'
import { t } from '../../i18n/index.js'
import type { LocalJSXCommandCall } from '../../types/command.js'
import {
  guessProviderCatalogIndex,
  OCA_PROVIDER_CATALOG,
  persistAndApplyOcaSettings,
  type OcaProviderCatalogEntry,
} from '../../utils/ocaProviderCatalog.js'
import { readOcaSettings, type OcaSettings } from '../../utils/ocaSettings.js'

type Step = 'pick' | 'configure'

type Props = {
  onDone: (result?: string, options?: { display?: CommandResultDisplay }) => void
}

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

function ProviderCommandInner({ onDone }: Props) {
  const [step, setStep] = useState<Step>('pick')
  const [providerIndex, setProviderIndex] = useState(() => guessProviderCatalogIndex())
  const selectedProvider = OCA_PROVIDER_CATALOG[providerIndex]!

  const [baseUrl, setBaseUrl] = useState('')
  const [apiKey, setApiKey] = useState('')
  const [model, setModel] = useState('')
  const [activeField, setActiveField] = useState<'apikey' | 'baseurl' | 'model'>('apikey')

  // Prefill configure step from env + saved settings when entering configure or switching provider
  useEffect(() => {
    const saved = readOcaSettings()
    const p = selectedProvider
    setBaseUrl(
      (p.type === 'openai-compat' || p.type === 'ollama'
        ? process.env['OPENAI_BASE_URL'] ??
          process.env['OLLAMA_BASE_URL'] ??
          saved.openaiBaseUrl
        : '') ||
        p.defaultBaseUrl ||
        '',
    )
    setModel(
      process.env['OCA_MODEL'] ?? saved.model ?? p.defaultModel ?? '',
    )
    setApiKey('')
    setActiveField(p.needsBaseUrl && !p.needsApiKey ? 'baseurl' : 'apikey')
  }, [providerIndex, selectedProvider])

  const apply = useCallback(() => {
    const saved = readOcaSettings()
    const p = selectedProvider
    const keyFromInput = apiKey.trim()
    const resolvedKey =
      keyFromInput ||
      saved.apiKey ||
      (p.type === 'anthropic'
        ? process.env['ANTHROPIC_API_KEY'] ?? ''
        : process.env['OPENAI_API_KEY'] ?? '')

    const next: OcaSettings = {
      ...saved,
      provider: p.type,
      model: model.trim() || p.defaultModel,
      language: saved.language,
      setupCompleted: true,
    }

    if (p.type === 'anthropic') {
      delete next.openaiBaseUrl
      next.apiKey = resolvedKey || saved.apiKey
    } else {
      next.openaiBaseUrl = baseUrl.trim() || p.defaultBaseUrl
      next.apiKey = resolvedKey || saved.apiKey
    }

    persistAndApplyOcaSettings(next)

    const label = p.label
    const m = next.model ?? ''
    onDone(t('providerCmd.applied', { vendor: label, model: m }), { display: 'system' })
  }, [apiKey, baseUrl, model, onDone, selectedProvider])

  const cancel = useCallback(() => {
    onDone(undefined, { display: 'system' })
  }, [onDone])

  useInput((_input, key) => {
    if (key.escape) {
      if (step === 'configure') {
        setStep('pick')
        return
      }
      cancel()
      return
    }

    if (step === 'pick') {
      if (key.upArrow) setProviderIndex(i => Math.max(0, i - 1))
      if (key.downArrow) setProviderIndex(i => Math.min(OCA_PROVIDER_CATALOG.length - 1, i + 1))
      if (key.return) setStep('configure')
      return
    }

    // configure
    if (key.tab) {
      const hasBaseUrl = selectedProvider.needsBaseUrl || selectedProvider.id === 'ollama'
      const fields: Array<'apikey' | 'baseurl' | 'model'> = [
        ...(hasBaseUrl ? ['baseurl' as const] : []),
        ...(selectedProvider.needsApiKey ? ['apikey' as const] : []),
        'model',
      ]
      const idx = fields.indexOf(activeField)
      setActiveField(fields[(idx + 1) % fields.length]!)
    } else if (key.return) {
      apply()
    }
  })

  if (step === 'pick') {
    return (
      <Pane color="permission">
        <Box flexDirection="column" padding={1} gap={1}>
          <Text bold>{t('providerCmd.titlePick')}</Text>
          <Text dimColor>{t('providerCmd.hintPick')}</Text>
          <Box flexDirection="column" marginTop={1}>
            {OCA_PROVIDER_CATALOG.map((e: OcaProviderCatalogEntry, i: number) => (
              <Box key={e.id}>
                <Text color={i === providerIndex ? 'cyan' : undefined}>
                  {i === providerIndex ? '▶ ' : '  '}
                  {e.label}
                </Text>
              </Box>
            ))}
          </Box>
          <Box marginTop={1}>
            <Text dimColor>{t('providerCmd.navPick')}</Text>
          </Box>
        </Box>
      </Pane>
    )
  }

  return (
    <Pane color="permission">
      <Box flexDirection="column" padding={1} gap={1}>
        <Text bold>{t('providerCmd.titleConfigure')}</Text>
        <Text dimColor>{t('providerCmd.hintConfigure')}</Text>
        <Text>
          {t('providerCmd.vendor')}{' '}
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
            placeholder={t('providerCmd.keyPlaceholder')}
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

        <Box marginTop={1}>
          <Text dimColor>{t('providerCmd.navConfigure')}</Text>
        </Box>
      </Box>
    </Pane>
  )
}

export const call: LocalJSXCommandCall = async (onDone, _context) => {
  return <ProviderCommandInner onDone={onDone} />
}

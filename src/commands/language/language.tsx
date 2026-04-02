/**
 * /language command — lets the user switch the UI language at any time.
 * Works like /theme: renders an inline picker and calls onDone when done.
 */
import * as React from 'react'
import { useCallback, useState } from 'react'
import type { CommandResultDisplay } from '../../commands.js'
import { Box, Text, useInput } from '../../ink.js'
import { t, initI18n, getLocale, type SupportedLocale } from '../../i18n/index.js'
import { Pane } from '../../components/design-system/Pane.js'
import { patchOcaSettings } from '../../utils/ocaSettings.js'
import type { LocalJSXCommandCall } from '../../types/command.js'

// ── Available languages ───────────────────────────────────────────────────────

const LANGUAGES: Array<{ code: SupportedLocale; label: string; nativeLabel: string }> = [
  { code: 'en', label: 'English', nativeLabel: 'English' },
  { code: 'zh-CN', label: 'Chinese (Simplified)', nativeLabel: '简体中文' },
]

// ── Component ─────────────────────────────────────────────────────────────────

type Props = {
  onDone: (result?: string, options?: { display?: CommandResultDisplay }) => void
}

function LanguagePickerCommand({ onDone }: Props) {
  const currentLocale = getLocale()
  const currentIdx = LANGUAGES.findIndex(l => l.code === currentLocale)
  const [selectedIdx, setSelectedIdx] = useState(Math.max(0, currentIdx))

  const confirm = useCallback(() => {
    const lang = LANGUAGES[selectedIdx]!
    initI18n(lang.code)
    patchOcaSettings({ language: lang.code })
    onDone(t('language.changed', { lang: lang.nativeLabel }), { display: 'system' })
  }, [selectedIdx, onDone])

  const cancel = useCallback(() => {
    onDone(undefined, { display: 'system' })
  }, [onDone])

  useInput((_input, key) => {
    if (key.upArrow) setSelectedIdx(i => Math.max(0, i - 1))
    if (key.downArrow) setSelectedIdx(i => Math.min(LANGUAGES.length - 1, i + 1))
    if (key.return) confirm()
    if (key.escape) cancel()
  })

  return (
    <Pane color="permission">
      <Box flexDirection="column" padding={1} gap={1}>
        <Text bold>{t('language.title')}</Text>
        <Text dimColor>{t('language.hint')}</Text>

        <Box flexDirection="column" marginTop={1}>
          {LANGUAGES.map((lang, i) => (
            <Box key={lang.code}>
              <Text color={i === selectedIdx ? 'cyan' : undefined}>
                {i === selectedIdx ? '▶ ' : '  '}
                {lang.nativeLabel}
                {lang.code !== lang.nativeLabel ? `  (${lang.label})` : ''}
                {lang.code === currentLocale ? '  ✓' : ''}
              </Text>
            </Box>
          ))}
        </Box>

        <Box marginTop={1}>
          <Text dimColor>↑↓ navigate · Enter confirm · {t('language.cancel')}</Text>
        </Box>
      </Box>
    </Pane>
  )
}

export const call: LocalJSXCommandCall = async (onDone, _context) => {
  return <LanguagePickerCommand onDone={onDone} />
}

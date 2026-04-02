/**
 * OpenCodeAgent i18n module.
 *
 * Usage:
 *   import { t } from 'src/i18n/index.js'
 *   t('repl.idle.newTask')              // → 'new task?' | '新任务？'
 *   t('setup.step', { current: 1, total: 4 }) // → 'Step 1 of 4'
 *
 * Language resolution order:
 *   1. CLI arg --lang
 *   2. Environment variable OCA_LANG
 *   3. Environment variable LANG / LC_ALL (system locale)
 *   4. Default: 'en'
 */

import { en } from './locales/en.js'
import { zhCN } from './locales/zh-CN.js'

// ── Supported locales ─────────────────────────────────────────────────────────

export type SupportedLocale = 'en' | 'zh-CN'

const LOCALES: Record<SupportedLocale, typeof en> = {
  'en': en,
  'zh-CN': zhCN,
}

const LOCALE_ALIASES: Record<string, SupportedLocale> = {
  'zh': 'zh-CN',
  'zh_CN': 'zh-CN',
  'zh_TW': 'zh-CN',
  'zh-TW': 'zh-CN',
  'zh-Hans': 'zh-CN',
  'zh-Hant': 'zh-CN',
}

// ── State ─────────────────────────────────────────────────────────────────────

let _currentLocale: SupportedLocale = 'en'
let _currentMessages: typeof en = en

// ── Locale detection ──────────────────────────────────────────────────────────

function resolveLocale(raw: string): SupportedLocale {
  const normalized = raw.trim()
  if (normalized in LOCALES) return normalized as SupportedLocale
  if (normalized in LOCALE_ALIASES) return LOCALE_ALIASES[normalized]!

  // Match by prefix: e.g. "zh-CN.UTF-8" → "zh-CN"
  const prefix = normalized.split(/[._-]/)[0]?.toLowerCase()
  if (prefix === 'zh') return 'zh-CN'
  return 'en'
}

function detectSystemLocale(): SupportedLocale {
  const envLang =
    process.env['OCA_LANG'] ||
    process.env['LANG'] ||
    process.env['LC_ALL'] ||
    process.env['LC_MESSAGES'] ||
    ''
  return resolveLocale(envLang)
}

// ── Initialization ────────────────────────────────────────────────────────────

/**
 * Initialize i18n with an optional explicit locale (e.g. from --lang CLI arg).
 * Call this once early in startup (after arg parsing).
 * If not called, the system locale auto-detection is used.
 */
export function initI18n(explicitLocale?: string): void {
  const locale = explicitLocale
    ? resolveLocale(explicitLocale)
    : detectSystemLocale()

  _currentLocale = locale
  _currentMessages = LOCALES[locale] ?? en
}

// Run auto-detection immediately so callers that don't call initI18n still get
// the correct locale (e.g. during module-level usage in tests or scripts).
initI18n()

// ── Core translation function ─────────────────────────────────────────────────

type Params = Record<string, string | number>

/**
 * Translate a dot-notation key and interpolate {placeholders}.
 *
 * @example
 * t('repl.idle.newTask')
 * t('setup.step', { current: 2, total: 4 })
 */
export function t(key: string, params?: Params): string {
  const message = getNestedValue(_currentMessages, key)
    ?? getNestedValue(en, key)    // fallback to English
    ?? key                         // last resort: return the key itself

  if (!params) return message
  return interpolate(message, params)
}

/**
 * Return the currently active locale identifier (e.g. 'zh-CN').
 */
export function getLocale(): SupportedLocale {
  return _currentLocale
}

/**
 * Return true if the current UI language is Chinese (any variant).
 * Useful for layout adjustments specific to CJK characters.
 */
export function isChinese(): boolean {
  return _currentLocale === 'zh-CN'
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function getNestedValue(obj: unknown, key: string): string | undefined {
  const parts = key.split('.')
  let current: unknown = obj
  for (const part of parts) {
    if (current == null || typeof current !== 'object') return undefined
    current = (current as Record<string, unknown>)[part]
  }
  return typeof current === 'string' ? current : undefined
}

function interpolate(template: string, params: Params): string {
  return template.replace(/\{(\w+)\}/g, (_, key) => {
    const val = params[key]
    return val !== undefined ? String(val) : `{${key}}`
  })
}

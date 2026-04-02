/**
 * OCA-specific settings stored in ~/.oca/settings.json.
 *
 * These settings are separate from the underlying ~/.claude/ config so OCA can
 * manage its own provider / language preferences without conflicting with the
 * original Claude Code install.
 *
 * At startup, applyOcaSettings() is called to inject saved values as
 * environment variables, which the rest of the stack already reads from.
 */

import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs'
import { homedir } from 'os'
import { join } from 'path'

export interface OcaSettings {
  /** AI provider type */
  provider?: 'anthropic' | 'openai-compat' | 'ollama'
  /** OpenAI-compatible base URL */
  openaiBaseUrl?: string
  /** API key for the selected provider */
  apiKey?: string
  /** Model identifier */
  model?: string
  /** UI language code, e.g. "zh-CN" */
  language?: string
  /** Whether the user has completed the setup wizard */
  setupCompleted?: boolean
}

const OCA_DIR = join(homedir(), '.oca')
const OCA_SETTINGS_FILE = join(OCA_DIR, 'settings.json')

export function getOcaSettingsDir(): string {
  return OCA_DIR
}

export function getOcaSettingsPath(): string {
  return OCA_SETTINGS_FILE
}

export function readOcaSettings(): OcaSettings {
  try {
    if (!existsSync(OCA_SETTINGS_FILE)) return {}
    const raw = readFileSync(OCA_SETTINGS_FILE, 'utf-8')
    return JSON.parse(raw) as OcaSettings
  } catch {
    return {}
  }
}

export function writeOcaSettings(settings: OcaSettings): void {
  if (!existsSync(OCA_DIR)) {
    mkdirSync(OCA_DIR, { recursive: true })
  }
  writeFileSync(OCA_SETTINGS_FILE, JSON.stringify(settings, null, 2), 'utf-8')
}

export function patchOcaSettings(patch: Partial<OcaSettings>): void {
  const existing = readOcaSettings()
  writeOcaSettings({ ...existing, ...patch })
}

/**
 * Apply saved OCA settings as environment variables.
 * Called once at startup before any other initialization.
 * Explicit env vars already set in the shell take precedence (skip if set).
 */
export function applyOcaSettings(): void {
  const s = readOcaSettings()

  if (s.language && !process.env['OCA_LANG']) {
    process.env['OCA_LANG'] = s.language
  }

  if (s.provider && !process.env['OCA_PROVIDER']) {
    process.env['OCA_PROVIDER'] = s.provider
  }

  if (s.provider === 'openai-compat' || s.provider === 'ollama') {
    if (s.openaiBaseUrl && !process.env['OPENAI_BASE_URL']) {
      process.env['OPENAI_BASE_URL'] = s.openaiBaseUrl
    }
    if (s.apiKey && !process.env['OPENAI_API_KEY']) {
      process.env['OPENAI_API_KEY'] = s.apiKey
    }
  } else if (s.provider === 'anthropic') {
    if (s.apiKey && !process.env['ANTHROPIC_API_KEY']) {
      process.env['ANTHROPIC_API_KEY'] = s.apiKey
    }
  }

  if (s.model && !process.env['OCA_MODEL']) {
    process.env['OCA_MODEL'] = s.model
  }
}

/**
 * Returns true if setup wizard has been completed OR if the user has already
 * configured a provider via environment variables (no wizard needed).
 */
export function isSetupComplete(): boolean {
  const s = readOcaSettings()
  if (s.setupCompleted) return true

  // Provider already configured via env → skip wizard
  if (process.env['OCA_PROVIDER'] || process.env['ANTHROPIC_API_KEY']) {
    return true
  }

  return false
}

/**
 * OpenCodeAgent — Ollama auto-detection
 *
 * Checks whether a local Ollama instance is reachable.
 * Used at startup when OCA_PROVIDER=ollama is configured.
 */

const DEFAULT_OLLAMA_URL = 'http://localhost:11434'

/** Returns true when the Ollama HTTP service is reachable */
export async function isOllamaReachable(
  baseURL = process.env.OLLAMA_BASE_URL ?? DEFAULT_OLLAMA_URL,
): Promise<boolean> {
  try {
    const url = baseURL.replace(/\/$/, '')
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 2000)
    const response = await fetch(`${url}/api/tags`, {
      method: 'GET',
      signal: controller.signal,
    })
    clearTimeout(timeoutId)
    return response.ok
  } catch {
    return false
  }
}

/**
 * List available Ollama models.
 * Returns empty array if Ollama is not reachable.
 */
export async function listOllamaModels(
  baseURL = process.env.OLLAMA_BASE_URL ?? DEFAULT_OLLAMA_URL,
): Promise<string[]> {
  try {
    const url = baseURL.replace(/\/$/, '')
    const response = await fetch(`${url}/api/tags`)
    if (!response.ok) return []
    const data = await response.json() as { models?: { name: string }[] }
    return data.models?.map(m => m.name) ?? []
  } catch {
    return []
  }
}

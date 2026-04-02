# CLAUDE.md — OpenCodeAgent

This file provides guidance to AI coding assistants (Claude Code, Cursor, etc.) when working with code in this repository.

## Project Overview

**OpenCodeAgent** is an open-source, local-first, multi-model AI coding assistant CLI.

- **Base**: Built upon a community-restored version of Anthropic's Claude Code CLI (v1.0.3)
- **Goal**: Remove cloud lock-in (telemetry, forced OAuth), add multi-model support (OpenAI-compat, Ollama), add Chinese UI
- **Status**: Active development — see `mydocs/todo-list.md` for current sprint tasks

### Key Docs (read these first in a new session)
- `mydocs/product-overview.md` — Architecture, module list, tech decisions
- `mydocs/todo-list.md` — Four-quadrant task list, current sprint
- `mydocs/architecture-overview.md` — Detailed architecture reference

## Commands

```bash
# Install dependencies
bun install

# Dev mode (direct execution via Bun)
bun run dev
# equivalent to: bun run src/entrypoints/cli.tsx

# Pipe mode (non-interactive)
echo "say hello" | bun run src/entrypoints/cli.tsx -p

# Build (outputs dist/cli.js)
bun run build

# Lint
bun run lint
```

## Architecture

### Runtime & Build

- **Runtime**: Bun (not Node.js). All imports, builds, and execution use Bun APIs.
- **Build**: `bun build src/entrypoints/cli.tsx --outdir dist --target bun`
- **Module system**: ESM (`"type": "module"`), TSX with `react-jsx` transform.
- **Entry**: `src/entrypoints/cli.tsx` → `src/main.tsx` → REPL or pipe mode

### Key Files

| File | Role |
|------|------|
| `src/entrypoints/cli.tsx` | True entry, polyfill injection |
| `src/main.tsx` | Commander CLI, service init (~4684 lines) |
| `src/query.ts` | Agentic loop — API call + tool orchestration |
| `src/QueryEngine.ts` | Turn-level orchestration, session management |
| `src/services/api/claude.ts` | Anthropic API client (~3400 lines) |
| `src/services/api/client.ts` | ★ Provider factory — key file for multi-model |
| `src/utils/model/providers.ts` | ★ Provider type definitions |
| `src/tools.ts` | Tool registry |
| `src/screens/REPL.tsx` | Interactive terminal UI (~5000 lines) |
| `src/bootstrap/state.ts` | Session-scoped global singletons |

### What Has Been Changed (vs original)

- `src/services/analytics/` — **Telemetry removed**: sink replaced with no-op, Datadog/1P logging disabled
- `src/entrypoints/init.ts` — **Auth simplified**: removed forced OAuth populate, removed 1P event logging init
- `src/utils/config.ts` — **Trust dialog bypassed**: `checkHasTrustDialogAccepted()` always returns true
- `src/services/api/client.ts` — **Auth simplified**: removed OAuth token forcing, API key only

### Planned New Modules

- `src/providers/` — Multi-model provider adapter layer (OpenAI-compat, Ollama)
- `src/i18n/` — Internationalization (Chinese UI support)
- `src/screens/SetupWizard.tsx` — First-launch setup wizard

## Working with This Codebase

### Critical Rules

1. **DO NOT fix all TypeScript errors** — ~1341 errors come from decompilation, don't affect runtime
2. **`feature()` is always `false`** — code behind feature flags is dead code
3. **`bun:bundle` import** — polyfilled in `cli.tsx`; works at dev-time
4. **Nested mirror dirs** (`src/src/`, `src/utils/src/` etc.) — decompilation artifacts, **ignore them**
5. **Read before editing** — always read the full file context first
6. **Preserve function signatures** — when stubbing/removing logic, keep the exported function shape

### Dependency Injection Pattern

Analytics uses a sink pattern — events are queued until a sink is attached. The no-op replacement means events queue up and are silently dropped. This is intentional.

### Provider Identification

Current provider is determined by env vars checked in `src/utils/model/providers.ts`:
- `CLAUDE_CODE_USE_BEDROCK` → `'bedrock'`
- `CLAUDE_CODE_USE_VERTEX` → `'vertex'`
- `CLAUDE_CODE_USE_FOUNDRY` → `'foundry'`
- `OCA_PROVIDER=openai-compat` → NEW (to be implemented)
- Default → `'firstParty'` (Anthropic direct)

### Commit Convention

```
feat: add openai-compat provider adapter
fix: remove datadog flush on exit
chore: update package.json metadata
docs: update todo-list sprint status
```

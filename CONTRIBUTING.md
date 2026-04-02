# Contributing to OpenCodeAgent

感谢你对 OpenCodeAgent 的贡献兴趣！以下是参与指南。

_Thank you for your interest in contributing! Guidelines are in both Chinese and English._

---

## 目录 / Table of Contents

- [开发环境 / Setup](#开发环境--setup)
- [项目结构 / Project Structure](#项目结构--project-structure)
- [贡献类型 / Contribution Types](#贡献类型--contribution-types)
- [提 PR 流程 / PR Process](#提-pr-流程--pr-process)
- [添加新 Provider / Adding a Provider](#添加新-provider--adding-a-provider)
- [添加翻译 / Adding Translations](#添加翻译--adding-translations)
- [代码风格 / Code Style](#代码风格--code-style)

---

## 开发环境 / Setup

### 要求 / Requirements

- [Bun](https://bun.sh) >= 1.2.0
- Node.js >= 18 (optional, for tooling compatibility)
- Git

### 启动 / Getting Started

```bash
# Clone the repo
git clone https://github.com/DoublePeach/OpenCodeAgent.git
cd OpenCodeAgent

# Install dependencies
bun install

# Run in dev mode
bun run dev

# Run with a specific provider (example: DeepSeek)
OCA_PROVIDER=openai-compat \
OPENAI_BASE_URL=https://api.deepseek.com \
OPENAI_API_KEY=your_key \
OCA_MODEL=deepseek-chat \
bun run dev

# Build single-file bundle
bun run build
```

---

## 项目结构 / Project Structure

```
src/
├── entrypoints/       # CLI entry point (cli.tsx)
├── screens/           # Full-screen components (REPL, SetupWizard)
├── components/        # UI components (Ink/React)
├── services/api/      # Anthropic SDK + provider routing
├── providers/         # OCA provider abstraction layer
│   ├── types.ts       # OCAProviderConfig interface
│   ├── registry.ts    # Provider selection from env vars
│   ├── capabilities.ts# Model capability matrix
│   ├── openai-compat/ # OpenAI-compatible adapter
│   └── ollama/        # Ollama detection helpers
├── i18n/              # Internationalization
│   ├── index.ts       # t() function + language detection
│   └── locales/       # en.ts, zh-CN.ts dictionaries
├── utils/
│   └── ocaSettings.ts # ~/.oca/settings.json management
└── tools/             # Built-in tools (Bash, File, Grep, etc.)
```

---

## 贡献类型 / Contribution Types

### 🔌 新 Provider 适配 / New Provider Adapter

欢迎为新的 AI 提供商添加支持（详见 [添加新 Provider](#添加新-provider--adding-a-provider)）。

We welcome support for new AI providers. See [Adding a Provider](#添加新-provider--adding-a-provider).

### 🌐 翻译 / Translations

在 `src/i18n/locales/` 中添加新语言文件（详见 [添加翻译](#添加翻译--adding-translations)）。

### 🐛 Bug 修复 / Bug Fixes

请先通过 [GitHub Issues](https://github.com/DoublePeach/OpenCodeAgent/issues) 报告 bug，然后提 PR。

Please report bugs via [GitHub Issues](https://github.com/DoublePeach/OpenCodeAgent/issues) first.

### 📖 文档 / Documentation

改进 README、注释、使用示例等均欢迎。

Improvements to README, comments, and usage examples are welcome.

---

## 提 PR 流程 / PR Process

1. Fork 仓库，创建特性分支：`feature/my-feature` 或 `fix/my-fix`
2. 修改代码并本地测试
3. 确保 `bun run --bun src/entrypoints/cli.tsx --version` 正常输出
4. 提交 PR，描述变更内容和测试方法

---

## 添加新 Provider / Adding a Provider

大多数国内和国际 AI 服务商都提供 OpenAI 兼容接口，只需配置环境变量即可使用，**无需修改代码**：

Most providers support the OpenAI-compatible API and can be used with environment variables **without code changes**:

```bash
OCA_PROVIDER=openai-compat
OPENAI_BASE_URL=https://your-provider.com/v1
OPENAI_API_KEY=your_key
OCA_MODEL=your-model
```

如果需要在 `capabilities.ts` 中添加模型能力矩阵，或在 SetupWizard 中添加预设，请按以下步骤操作：

To add a provider to the capabilities matrix or SetupWizard presets:

### 1. 添加能力矩阵 / Add to Capabilities Matrix

编辑 `src/providers/capabilities.ts`，在 `CAPABILITY_MAP` 中添加模型条目：

```typescript
// src/providers/capabilities.ts
'your-model-name': {
  toolUse: true,
  vision: true,
  contextWindow: 128000,
  jsonMode: true,
},
```

### 2. 添加 SetupWizard 预设 / Add SetupWizard Preset

编辑 `src/screens/SetupWizard.tsx`，在 `PROVIDERS` 数组中添加：

```typescript
{
  id: 'your-provider',
  label: 'Your Provider Name',
  type: 'openai-compat',
  defaultBaseUrl: 'https://api.your-provider.com/v1',
  defaultModel: 'your-default-model',
  needsApiKey: true,
  needsBaseUrl: false,
},
```

### 3. 测试 / Test

```bash
OCA_PROVIDER=openai-compat \
OPENAI_BASE_URL=https://api.your-provider.com/v1 \
OPENAI_API_KEY=your_key \
OCA_MODEL=your-model \
bun run dev
```

---

## 添加翻译 / Adding Translations

1. 复制 `src/i18n/locales/en.ts` 为新文件，例如 `src/i18n/locales/ja.ts`
2. 翻译所有字符串值（保持键名不变）
3. 在 `src/i18n/index.ts` 中注册新语言：

```typescript
// src/i18n/index.ts
import { ja } from './locales/ja.js'

export type SupportedLocale = 'en' | 'zh-CN' | 'ja'

const LOCALES: Record<SupportedLocale, typeof en> = {
  'en': en,
  'zh-CN': zhCN,
  'ja': ja,
}
```

4. 测试：`OCA_LANG=ja bun run dev`

---

## 代码风格 / Code Style

- 本项目使用 **Biome** 进行 lint（`bun run lint`）
- TypeScript 类型错误（~1341 个）来自反编译，运行时不影响，**不需要修复**
- 用户可见字符串应通过 `t('key')` 从 `src/i18n/` 获取，不要硬编码
- LLM 提示词（system prompt）**必须保持英文**
- 新的 Provider 适配代码放在 `src/providers/` 目录

---

## 免责声明 / Disclaimer

本项目基于 Claude Code CLI 社区还原版进行二次开发，与 Anthropic 官方无关。请在使用和贡献前确认符合相关服务条款。

This project is a community-developed derivative of Claude Code CLI. It is not affiliated with Anthropic. Please ensure compliance with applicable terms of service.

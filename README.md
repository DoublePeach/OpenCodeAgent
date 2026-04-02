<div align="center">

# OpenCodeAgent

**一个开源、本地优先、支持多模型的 AI 编程助手 CLI**

*An Open Source, Local-First, Multi-Model AI Coding Assistant CLI*

[![License](https://img.shields.io/badge/license-TBD-blue.svg)](#license)
[![Bun](https://img.shields.io/badge/runtime-Bun%20%E2%89%A51.2.0-black?logo=bun)](https://bun.sh)
[![TypeScript](https://img.shields.io/badge/language-TypeScript-3178c6?logo=typescript)](https://www.typescriptlang.org)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](CONTRIBUTING.md)

[English](#english) · [中文](#中文)

</div>

---

## 中文

### 简介

OpenCodeAgent 是一个运行在终端的 AI 编程助手，基于 Claude Code CLI 二次开发，专为**中国开发者及需要本地化部署**的场景设计。

**核心特性：**

- 🌐 **多模型支持** — Anthropic Claude、DeepSeek、阿里百炼（Qwen）、火山引擎（Doubao）、OpenAI 及任意 OpenAI 兼容接口
- 🏠 **本地优先** — 完整支持 [Ollama](https://ollama.com) 本地模型，数据不出境
- 🔒 **无强制认证** — 去除 Anthropic OAuth 强制登录，API Key 即可使用
- 🚫 **无遥测上报** — 彻底移除所有数据上报和云端分析
- 🌏 **中文界面** — 用户交互层完整中文支持（系统提示词保持英文以保证效果）
- 🛠️ **完整 Agent 架构** — 保留原版全部 50+ 内置工具、MCP 协议、Agent Swarms 等核心能力
- 🔌 **MCP 生态扩展** — 支持通过 MCP 协议接入任意外部工具（飞书、钉钉、JIRA 等）

### 与官方 Claude Code 的关系

OpenCodeAgent 基于 Claude Code CLI 的社区还原版本进行二次开发，**与 Anthropic 官方无关**。我们在保留完整 Agent 能力的基础上，专注于：
- 去除云端依赖，支持完全本地化运行
- 开放模型接入，不绑定单一 AI 提供商
- 提供中文友好的使用体验

> ⚠️ **声明**：本项目为个人开源项目，基于社区反编译还原的 Claude Code 代码进行二次开发。请在使用前确认符合当地法律法规及相关服务条款。

### 快速开始

#### 环境要求

- [Bun](https://bun.sh/) >= 1.2.0

  ```bash
  # 安装 Bun
  curl -fsSL https://bun.sh/install | bash
  ```

#### 安装

```bash
# 克隆仓库
git clone https://github.com/DoublePeach/OpenCodeAgent.git
cd OpenCodeAgent

# 安装依赖
bun install
```

#### 配置（选择你的 AI 提供商）

**方式一：Anthropic（原生支持）**
```bash
export ANTHROPIC_API_KEY=your_api_key_here
bun run dev
```

**方式二：DeepSeek**
```bash
export OCA_PROVIDER=openai-compat
export OPENAI_BASE_URL=https://api.deepseek.com
export OPENAI_API_KEY=your_deepseek_api_key
export OCA_MODEL=deepseek-chat
bun run dev
```

**方式三：阿里百炼（Qwen）**
```bash
export OCA_PROVIDER=openai-compat
export OPENAI_BASE_URL=https://dashscope.aliyuncs.com/compatible-mode/v1
export OPENAI_API_KEY=your_dashscope_api_key
export OCA_MODEL=qwen-max
bun run dev
```

**方式四：Ollama 本地模型（数据完全不出境）**
```bash
# 先启动 Ollama 并拉取模型
ollama pull qwen2.5-coder:7b

# 启动 OpenCodeAgent
export OCA_PROVIDER=ollama
export OCA_MODEL=qwen2.5-coder:7b
bun run dev
```

**方式五：任意 OpenAI 兼容接口**
```bash
export OCA_PROVIDER=openai-compat
export OPENAI_BASE_URL=https://your-provider.com/v1
export OPENAI_API_KEY=your_api_key
export OCA_MODEL=your-model-name
bun run dev
```

#### 运行

```bash
# 开发模式（直接运行）
bun run dev

# 管道模式（非交互）
echo "帮我写一个快速排序" | bun run dev -p

# 构建单文件产物
bun run build
# 产物位于 dist/cli.js
```

### 主要功能

| 功能 | 说明 |
|------|------|
| 交互式 REPL | 终端中的全功能 AI 对话界面 |
| 文件操作 | 读取、写入、编辑文件（FileRead/FileWrite/FileEdit） |
| 代码搜索 | 基于 ripgrep 的高速代码搜索（Grep/Glob） |
| Shell 执行 | 安全执行 Shell 命令（BashTool）|
| 网络工具 | 网页抓取（WebFetch）、联网搜索（WebSearch）|
| Agent 模式 | 启动子 Agent 并行处理复杂任务（AgentTool）|
| MCP 扩展 | 通过 MCP 协议接入任意外部工具 |
| 权限管理 | 三级权限模式：default / auto / plan（只读）|
| 任务管理 | 内置 Todo 任务追踪（TodoWrite）|
| 技能系统 | 可复用的 Skills 预定义工作流 |
| 上下文记忆 | CLAUDE.md 自动注入项目/全局记忆 |

### 支持的模型提供商

| 提供商 | 接入方式 | 工具调用 | 备注 |
|--------|---------|---------|------|
| Anthropic | 原生 | ✅ 完整 | Claude 3.5/4 系列 |
| DeepSeek | OpenAI 兼容 | ✅ | deepseek-chat / deepseek-coder |
| 阿里百炼 | OpenAI 兼容 | ✅ | qwen-max / qwen-plus 等 |
| 火山引擎 | OpenAI 兼容 | ✅ | Doubao 系列 |
| Ollama | OpenAI 兼容 | ✅ | 本地运行任意开源模型 |
| OpenAI | OpenAI 兼容 | ✅ | GPT-4o 等 |
| 任意 OpenAI 兼容接口 | OpenAI 兼容 | 视模型而定 | |

### 配置文件

OpenCodeAgent 从以下路径加载配置（优先级从高到低）：

```
CLI 参数 > 环境变量 > ~/.oca/settings.json（全局）> .claude/settings.json（项目）> 默认值
```

全局配置示例（`~/.oca/settings.json`）：
```json
{
  "provider": "openai-compat",
  "openaiBaseUrl": "https://api.deepseek.com",
  "model": "deepseek-chat",
  "language": "zh-CN",
  "permissions": "default"
}
```

### MCP 扩展

在 `.claude/settings.json` 中配置 MCP 服务器：

```json
{
  "mcpServers": {
    "my-tool": {
      "command": "node",
      "args": ["./mcp-servers/my-tool/index.js"]
    }
  }
}
```

### 路线图

- [x] 项目初始化，架构梳理
- [x] **M1**：去遥测、去强制认证，基础版本可运行
- [x] **M2**：OpenAI 兼容适配层（DeepSeek / 百炼 / Doubao / Ollama）
- [ ] **M3**：中文 UI + 首次启动配置向导 + Profile 系统
- [ ] **M4**：公开发布，完善文档和贡献指南
- [ ] **M5**：Node.js 兼容 / 离线优先模式 / 费用追踪

### 贡献

欢迎贡献！特别是以下方向：

- 🔌 **Provider 适配**：为新的 AI 提供商实现 adapter
- 🌐 **多语言**：翻译 UI 字符串（仅需编辑 JSON 文件）
- 🛠️ **MCP Server**：为国内工具链（飞书、钉钉、禅道等）开发 MCP 服务器
- 📝 **文档**：改善文档和使用示例

贡献指南请参阅 [CONTRIBUTING.md](CONTRIBUTING.md)（即将发布）。

### License

开源协议待法律确认后发布。项目基于 Claude Code CLI 社区还原版二次开发，使用前请确认符合相关服务条款。

---

## English

### Introduction

OpenCodeAgent is a terminal-based AI coding assistant, built upon the Claude Code CLI with a focus on **local-first deployment and multi-model support**.

**Key Features:**

- 🌐 **Multi-Model** — Anthropic Claude, DeepSeek, Alibaba Qwen, Volcengine Doubao, OpenAI, and any OpenAI-compatible API
- 🏠 **Local-First** — Full [Ollama](https://ollama.com) support, keep your code on-premises
- 🔒 **No Forced Auth** — Removed mandatory Anthropic OAuth; just use an API Key
- 🚫 **No Telemetry** — All data reporting and cloud analytics removed
- 🌏 **i18n Support** — Chinese UI (system prompts remain in English for best results)
- 🛠️ **Full Agent Architecture** — All 50+ built-in tools, MCP protocol, and Agent Swarms preserved
- 🔌 **MCP Ecosystem** — Extend with any external tool via Model Context Protocol

### Quick Start

#### Prerequisites

- [Bun](https://bun.sh/) >= 1.2.0

#### Install

```bash
git clone https://github.com/DoublePeach/OpenCodeAgent.git
cd OpenCodeAgent
bun install
```

#### Configure & Run

```bash
# Anthropic (native)
export ANTHROPIC_API_KEY=your_key
bun run dev

# DeepSeek
export OCA_PROVIDER=openai-compat
export OPENAI_BASE_URL=https://api.deepseek.com
export OPENAI_API_KEY=your_key
export OCA_MODEL=deepseek-chat
bun run dev

# Local Ollama
export OCA_PROVIDER=ollama
export OCA_MODEL=qwen2.5-coder:7b
bun run dev
```

### Roadmap

- [x] Project initialization & architecture review
- [x] **M1**: Remove telemetry & forced auth
- [x] **M2**: OpenAI-compatible provider adapter (DeepSeek, Qwen, Doubao, Ollama)
- [ ] **M3**: Chinese UI + Setup Wizard + Profile system
- [ ] **M4**: Public release with full documentation
- [ ] **M5**: Node.js compatibility / Offline-first / Cost tracking

### Relationship to Claude Code

This project is a community-developed derivative based on a reverse-engineered restoration of Anthropic's Claude Code CLI. **It is not affiliated with or endorsed by Anthropic.** We focus on removing cloud dependencies, opening up model selection, and providing a Chinese-friendly experience.

> ⚠️ **Disclaimer**: This is an independent open-source project. Please ensure compliance with applicable laws and terms of service before use.

### Contributing

Contributions are welcome, especially:
- Provider adapters for new AI services
- UI translations
- MCP servers for popular tools
- Documentation improvements

### License

License to be determined after legal review. See [LICENSE](LICENSE) for details.

---

<div align="center">

**如果这个项目对你有帮助，请给个 Star ⭐**  
**If this project helps you, please give it a Star ⭐**

Made with ❤️ by the community

</div>

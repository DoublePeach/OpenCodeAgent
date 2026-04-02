# 产品说明文档 · OpenCodeAgent

> 版本：v0.1.0-planning  
> 最后更新：2026-04-02  
> 维护说明：本文档作为 Cursor AI 会话上下文快速衔接文档，每次重要决策或阶段完成后更新。

---

## 一、项目基本信息

| 字段 | 内容 |
|------|------|
| 项目名（暂定） | **OpenCodeAgent** |
| 代码库来源 | Anthropic Claude Code CLI v1.0.3 逆向反编译还原版 |
| 发布方式 | 个人开源，GitHub 公开仓库 |
| 目标用户 | 中国及全球开发者，尤其是需要本地模型/国内模型支持的用户 |
| 核心定位 | **离线可用、数据不出境、多模型支持的开源 AI 编程助手 CLI** |
| 开发语言 | TypeScript（使用 Bun 运行时，兼容目标含 Node.js） |
| 当前状态 | 规划阶段，基础源码已导入，开始二次开发 |

### 1.1 产品定位与差异化

相比官方 Claude Code CLI：

| 维度 | 官方 Claude Code | OpenCodeAgent |
|------|-----------------|---------------|
| 模型支持 | 仅 Anthropic 系列 | 多模型：Anthropic / OpenAI-compat（DeepSeek、百炼、Doubao、Qwen 等）/ Ollama 本地 |
| 认证方式 | Anthropic OAuth + API Key | 纯 API Key，无强制 OAuth |
| 遥测/上报 | 有（Datadog、1P 事件日志） | 完全移除 |
| UI 语言 | 仅英文 | 多语言（中文优先，系统提示词保持英文） |
| 运行环境 | 仅 Bun | Bun（主要）+ Node.js（兼容目标） |
| 数据出境 | 依赖云端 | 支持纯本地（Ollama 模式） |

---

## 二、项目整体架构

### 2.1 技术栈

| 层次 | 技术 | 说明 |
|------|------|------|
| 运行时 | Bun ≥1.2.0 | 主运行时；Node.js 兼容为二期目标 |
| 语言 | TypeScript (strict: false) | 反编译产物含 ~1341 个类型错误，不影响运行，暂不修复 |
| UI 框架 | React 19 + Ink（自定义终端渲染器） | 在终端中渲染 React 组件 |
| CLI 框架 | Commander.js | 命令行参数解析 |
| 状态管理 | 自实现轻量 Store（Zustand-like） + React Context | |
| 构建 | Bun Build | 单文件打包 → `dist/cli.js` |
| 代码规范 | Biome | Linter + Formatter |
| 模块系统 | ESM (`"type": "module"`) | |

### 2.2 顶层目录结构

```
project-root/
├── src/                      # 主程序源码（2800+ 文件）
│   ├── entrypoints/          # 入口（cli.tsx 为真正入口）
│   ├── main.tsx              # Commander CLI 主体（4684 行）
│   ├── query.ts              # API 调用与工具编排核心循环
│   ├── QueryEngine.ts        # 高层对话轮次编排器
│   ├── Tool.ts               # 工具接口类型定义
│   ├── tools.ts              # 工具注册表
│   ├── context.ts            # 系统提示词上下文构建
│   ├── services/
│   │   ├── api/
│   │   │   ├── claude.ts     # Anthropic API 客户端（3400 行）★ 重点改造
│   │   │   └── client.ts     # SDK 客户端工厂（多 Provider）★ 重点改造
│   │   ├── analytics/        # 遥测（★ 全部移除/空实现）
│   │   └── mcp/              # MCP 协议支持
│   ├── tools/                # 内置工具实现（50+ 工具目录）
│   ├── components/           # Ink React 终端 UI 组件
│   ├── screens/REPL.tsx      # 交互式 REPL 主界面（5000+ 行）
│   ├── state/                # 应用状态管理
│   ├── bootstrap/state.ts    # 会话级全局单例状态
│   ├── utils/                # 工具函数（200+ 文件）
│   │   ├── model/            # ★ 重点改造：模型选择与路由
│   │   ├── auth.ts           # ★ 重点改造：认证逻辑
│   │   ├── config.ts         # 配置读写
│   │   └── settings/         # 多来源配置管理
│   ├── types/                # 类型声明
│   ├── migrations/           # 配置迁移脚本
│   └── src/                  # ⚠️ 反编译镜像目录（忽略）
├── packages/                 # Bun Workspace 子包（多为 Stub）
├── mydocs/                   # ★ 项目文档（本文件所在）
├── docs/                     # 原始文档（测试规划等）
├── package.json
├── tsconfig.json
├── build.ts
└── CLAUDE.md                 # AI 工作指引
```

### 2.3 层次架构图（Java 类比）

```
┌──────────────────────────────────────────────────────┐
│  表现层 (Presentation)                                │
│  REPL.tsx + Ink Components  ← 类比 Controller/View   │
└────────────────────┬─────────────────────────────────┘
                     │ 用户输入
┌────────────────────▼─────────────────────────────────┐
│  编排层 (Orchestration)                               │
│  QueryEngine.ts             ← 类比 Service 业务层    │
└────────────────────┬─────────────────────────────────┘
                     │ API 调用
┌────────────────────▼─────────────────────────────────┐
│  API 适配层 (Provider Adapter)          ← ★ 新增层   │
│  AnthropicAdapter / OpenAICompatAdapter / OllamaAdapter│
└────────────────────┬─────────────────────────────────┘
                     │
┌────────────────────▼─────────────────────────────────┐
│  工具执行层 (Tool Execution)                          │
│  tools.ts + tools/* + toolOrchestration.ts           │
└────────────────────┬─────────────────────────────────┘
                     │
┌────────────────────▼─────────────────────────────────┐
│  权限层 (Permission Guard)                            │
│  permissions/* + PermissionRequest.tsx               │
└────────────────────┬─────────────────────────────────┘
                     │
┌────────────────────▼─────────────────────────────────┐
│  支撑层 (Infrastructure)                              │
│  config / settings / mcp / telemetry(noop) / auth    │
└──────────────────────────────────────────────────────┘
```

---

## 三、核心模块清单

### 3.1 需要重点改造的模块（优先级排序）

| 优先级 | 模块 | 文件 | 改造内容 |
|--------|------|------|---------|
| P0 | **遥测移除** | `src/services/analytics/` | 替换 sink 为 no-op，不初始化 Datadog/1P |
| P0 | **认证简化** | `src/services/api/client.ts`、`src/utils/auth.ts`、`src/entrypoints/init.ts` | 移除 Anthropic OAuth 强制流程，保留 API Key 模式 |
| P0 | **Trust Dialog 移除** | `src/utils/config.ts`中 `checkHasTrustDialogAccepted` | 直接返回 true，跳过强制确认 |
| P1 | **Provider 适配层** | `src/services/api/client.ts`、`src/utils/model/providers.ts` | 新增 `openai-compat` Provider 类型，实现 OpenAI 格式适配 |
| P1 | **工具格式转换** | `src/services/api/claude.ts` | Anthropic tool_use ↔ OpenAI function_calling 双向转换 |
| P1 | **模型能力矩阵** | `src/utils/model/` 新建文件 | 记录各模型的工具支持/上下文长度/视觉能力 |
| P2 | **多语言 i18n** | 新建 `src/i18n/` | 轻量 t() 函数 + zh-CN.ts / en.ts 字典 |
| P2 | **启动配置向导** | 新建 `src/screens/SetupWizard.tsx` | 首次启动时引导用户配置 Provider 和 API Key |
| P2 | **Profile 系统** | `src/utils/config.ts` 扩展 | 支持多配置文件切换 |
| P3 | **Ollama 本地支持** | 包含在 Provider 适配层 | Ollama 已兼容 OpenAI API，适配层完成即覆盖 |
| P3 | **Node.js 兼容** | `src/entrypoints/cli.tsx`、`build.ts` | 移除 Bun 专有 API，改为标准 Node.js API |

### 3.2 保持不变的核心模块

| 模块 | 文件 | 说明 |
|------|------|------|
| Agentic Loop | `src/query.ts` | 核心循环逻辑不动 |
| 工具执行 | `src/services/tools/toolOrchestration.ts` | 并行工具编排不动 |
| 内置工具 | `src/tools/*/` | 50+ 工具全部保留 |
| MCP 支持 | `src/services/mcp/` | 扩展点，保留 |
| REPL UI | `src/screens/REPL.tsx` | 保留结构，仅添加 i18n |
| Agent Swarms | `src/utils/swarm/`、`AgentTool/` | 保留完整 Agent 架构 |
| 权限系统 | `src/utils/permissions/` | 保留三种权限模式 |
| 上下文压缩 | `src/services/compact/` | 保留 |
| Skills 系统 | `src/skills/`、`SkillTool/` | 保留 |
| 插件系统 | `src/plugins/` | 保留 |

### 3.3 新增模块规划

| 模块 | 路径（规划） | 功能 |
|------|------------|------|
| Provider 注册表 | `src/providers/registry.ts` | 统一管理所有 Provider 配置 |
| OpenAI 兼容适配器 | `src/providers/openai-compat/adapter.ts` | Anthropic ↔ OpenAI 格式互转 |
| Ollama 适配器 | `src/providers/ollama/adapter.ts` | 继承 openai-compat，添加 Ollama 特化配置 |
| 模型能力矩阵 | `src/providers/capabilities.ts` | 各模型的工具/视觉/上下文能力声明 |
| i18n 核心 | `src/i18n/index.ts` | 轻量 t() 函数，语言检测逻辑 |
| 中文语言包 | `src/i18n/zh-CN.ts` | 中文 UI 字符串字典 |
| 英文语言包 | `src/i18n/en.ts` | 英文 UI 字符串字典（兜底） |
| 配置向导 | `src/screens/SetupWizard.tsx` | 首次启动配置 UI |
| Profile 管理 | `src/utils/profile.ts` | 多配置文件切换 |
| 费用追踪扩展 | `src/cost-tracker.ts` 扩展 | 多 Provider 费用分别统计 |

---

## 四、核心数据流转逻辑

### 4.1 请求完整链路

```
[用户终端输入]
      │
      ▼
REPL.tsx (PromptInput)          → 捕获键盘输入、斜杠命令处理
      │ userMessage
      ▼
QueryEngine.ts                  → 轮次编排、系统提示词构建、上下文压缩
      │ query(messages, tools, systemPrompt)
      ▼
query.ts                        → 单次 API 调用循环（Agentic Loop）
      │ streamingRequest
      ▼
[★ Provider 适配层]             → 格式转换（Anthropic / OpenAI-compat / Ollama）
      │ 标准化后的 API 请求
      ▼
[外部 LLM API]                  → Anthropic / DeepSeek / 百炼 / Ollama 等
      │ 流式响应
      ▼
[★ Provider 适配层]             → 响应格式标准化 → Anthropic 内部格式
      │ BetaRawMessageStreamEvent（内部统一格式）
      ▼
query.ts                        → 解析 text / tool_use
      │
      ├─── text → 流式渲染到终端 (REPL.tsx MessageRow)
      │
      └─── tool_use →
            │
            ▼
      checkPermissions()        → 权限检查
            │
            ├── 需审批 → PermissionRequest.tsx → 等待用户确认
            └── 已批准 → tool.call(args, context)
                              │
                              ▼
                        [工具执行]（BashTool / FileEditTool / GrepTool 等）
                              │ tool_result
                              ▼
                        追加历史 → 下一轮 API 调用
                              │
                              ▼
                        stop_reason === "end_turn" → 输出最终回复
```

### 4.2 Provider 适配层格式转换（新增核心逻辑）

```
Anthropic 格式（内部统一）              OpenAI 兼容格式（对外发送）

工具定义：                              工具定义：
{                                       {
  name: "bash",                           type: "function",
  description: "...",                     function: {
  input_schema: {                           name: "bash",
    type: "object",                         description: "...",
    properties: {...}                       parameters: {
  }                                           type: "object",
}                                             properties: {...}
                                            }
                                          }
                                        }

工具调用响应：                           工具调用响应：
{                                       {
  type: "tool_use",                       index: 0,
  id: "toolu_xxx",                        id: "call_xxx",
  name: "bash",                           type: "function",
  input: { command: "ls" }               function: {
}                                           name: "bash",
                                            arguments: '{"command":"ls"}'
                                          }
                                        }

工具结果（发回）：                        工具结果（发回）：
{                                       {
  type: "tool_result",                    role: "tool",
  tool_use_id: "toolu_xxx",              tool_call_id: "call_xxx",
  content: "file1.txt\nfile2.txt"        content: "file1.txt\nfile2.txt"
}                                       }
```

### 4.3 配置加载优先级

```
高优先级
    │
    ├─ 1. CLI 参数（--model、--permission、--lang 等）
    ├─ 2. 环境变量（ANTHROPIC_API_KEY、OPENAI_API_KEY 等）
    ├─ 3. Profile 配置（~/.localcode/profiles/current.yaml）
    ├─ 4. 项目配置（./.claude/settings.json）
    ├─ 5. 全局用户配置（~/.claude/settings.json）
    └─ 6. 默认值
低优先级
```

---

## 五、关键技术决策记录

| 决策 | 选项 | 结论 | 理由 |
|------|------|------|------|
| TypeScript 类型错误 | 修复 vs 保持现状 | **保持现状** | ~1341 个错误源于反编译，不影响运行，修复成本高 |
| 运行时 | 仅 Bun vs 兼容 Node.js | **Bun 优先，兼容 Node.js 为 P3** | 先跑通核心功能，Node.js 兼容作为后期目标 |
| 发布方式 | 完整版 vs MVP | **完整版**（含 OpenAI 适配层） | 多模型支持是核心差异化，缺失则无竞争力 |
| 项目形式 | 组织 vs 个人 | **个人名义发布** | 初期保持灵活，后续视社区规模决定 |
| 认证改造 | 完全移除 vs 保留可选 | **移除强制 OAuth，API Key 即可** | 降低使用门槛，支持纯离线场景 |
| 遥测 | 保留可选 vs 完全移除 | **完全移除** | 开源定位，数据透明度更高 |
| 系统提示词语言 | 随 UI 语言 vs 始终英文 | **系统提示词始终英文** | 模型对英文提示词效果最好 |

---

## 六、关键配置与环境变量（目标状态）

### 6.1 环境变量（改造后）

| 变量名 | 必填 | 说明 |
|--------|------|------|
| `ANTHROPIC_API_KEY` | 否 | 使用 Anthropic 模型时填写 |
| `ANTHROPIC_BASE_URL` | 否 | 自定义 Anthropic 兼容端点（代理或其他兼容提供商） |
| `OPENAI_API_KEY` | 否 | 使用 OpenAI 兼容提供商时填写 |
| `OPENAI_BASE_URL` | 否 | OpenAI 兼容提供商的端点（如 DeepSeek、百炼等） |
| `OLLAMA_BASE_URL` | 否 | Ollama 本地服务地址（默认 `http://localhost:11434`） |
| `OCA_PROVIDER` | 否 | 指定当前使用的 Provider（`anthropic`/`openai-compat`/`ollama`） |
| `OCA_MODEL` | 否 | 指定当前使用的模型名 |
| `OCA_LANG` | 否 | UI 语言（`zh-CN`/`en`，默认 `zh-CN`） |
| `OCA_PROFILE` | 否 | 指定使用的 Profile 名称 |
| `ANTHROPIC_MODEL` | 否 | 兼容原始配置方式，覆盖默认主模型 |
| `ANTHROPIC_SMALL_FAST_MODEL` | 否 | 兼容原始配置，覆盖快速分类模型 |

### 6.2 配置文件（改造后）

| 文件 | 说明 |
|------|------|
| `~/.oca/settings.json` | 全局配置（Provider、API Key、语言、权限等） |
| `~/.oca/CLAUDE.md` | 全局 Memory，注入所有会话系统提示词 |
| `~/.oca/sessions/` | 会话历史存储 |
| `~/.oca/profiles/*.yaml` | Profile 配置文件（多环境切换） |
| `./.claude/settings.json` | 项目级配置（兼容原格式） |
| `./.claude/CLAUDE.md` | 项目级 Memory（兼容原格式） |

> 注：配置目录名称与 CLI 命令名称，待产品命名确定后统一调整。

---

## 七、待确认事项

| 编号 | 事项 | 状态 |
|------|------|------|
| L-01 | 法律咨询：逆向工程发布的合规性 | ⏳ 待处理（高优先级） |
| L-02 | 开源协议选择（MIT/Apache/AGPL） | ⏳ 待处理（依赖 L-01） |
| N-01 | 最终产品命名确认 | ⏳ 待确认 |
| N-02 | GitHub 仓库地址确认 | ⏳ 待确认 |
| T-01 | Node.js 兼容计划排期 | 📝 规划为 P3 |
| T-02 | `bun:bundle` 的 Node.js 替代方案 | 📝 需调研（影响 Node.js 兼容） |

---

*本文档由 Cursor AI 辅助生成，人工审阅确认后生效。*

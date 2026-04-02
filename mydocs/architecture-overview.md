# Claude Code CLI — 完整项目架构总览

> 文档版本：基于仓库 `claude-js v1.0.3`（Anthropic Claude Code CLI 反编译还原版）  
> 撰写日期：2026-04-02

---

## 目录

1. [项目背景与性质说明](#1-项目背景与性质说明)
2. [入口文件与启动流程](#2-入口文件与启动流程)
3. [核心目录结构](#3-核心目录结构)
4. [核心技术栈与关键依赖](#4-核心技术栈与关键依赖)
5. [核心功能模块详解](#5-核心功能模块详解)
6. [完整数据流与调用链路](#6-完整数据流与调用链路)
7. [关键配置文件与环境变量](#7-关键配置文件与环境变量)
8. [Java 后端架构类比](#8-java-后端架构类比)
9. [模块关系图](#9-模块关系图)

---

## 1. 项目背景与性质说明

### 1.1 项目性质

本项目是 **Anthropic 官方 Claude Code CLI** 的**逆向反编译还原版**，而非官方开源代码。特点如下：

| 属性 | 说明 |
|------|------|
| 来源 | 对官方 `npm` 包进行反编译/反混淆的还原结果 |
| 完整性 | 核心功能基本完整，但约有 **1341 个 TypeScript 类型错误**（均源于反编译产生的 `unknown`/`never`/`{}` 类型，**不影响 Bun 运行时执行**） |
| 特性门控 | 所有 Anthropic 内部功能均通过 `feature('FLAG_NAME')` 控制，在此版本中 `feature()` **永远返回 false**，大量分支为死代码 |
| 目录镜像 | 存在 `src/src/`、`src/components/src/` 等**嵌套镜像目录**，为反编译产物，非规范 monorepo 布局 |
| Bun 专属 | 运行时和构建均依赖 **Bun**，不兼容 Node.js，使用了 `bun:bundle` 等 Bun 专有 API |

### 1.2 项目定位

Claude Code 是一个**运行在终端的 AI 编程助手 CLI**，核心能力：
- 在终端中与 Claude 模型进行自然语言对话
- AI 可以直接调用工具（读写文件、执行命令、搜索代码等）自主完成编程任务
- 支持 REPL 交互模式和管道（pipe）非交互模式
- 支持 MCP（Model Context Protocol）协议扩展外部工具

---

## 2. 入口文件与启动流程

### 2.1 入口文件

| 层级 | 文件 | 职责 |
|------|------|------|
| 真正入口 | `src/entrypoints/cli.tsx` | 运行时 polyfill 注入、快路径分支、懒加载 main |
| CLI 主体 | `src/main.tsx` | Commander.js 命令定义、服务初始化（约 4684 行） |
| 一次性初始化 | `src/entrypoints/init.ts` | 遥测、配置、信任对话框 |
| 构建产物 | `dist/cli.js` | 单文件打包产物（~25MB），生产环境执行的实际文件 |

### 2.2 从执行 `claude` 到 CLI 启动的完整步骤

```
执行 claude / bun run dev
         │
         ▼
┌─────────────────────────────────────────────────────────────┐
│ [Step 1] src/entrypoints/cli.tsx                            │
│  - 注入 feature() 始终返回 false 的 polyfill                │
│  - 注入 globalThis.MACRO（VERSION、BUILD_TIME 等）           │
│  - 设置 BUILD_TARGET / BUILD_ENV / INTERFACE_TYPE 全局变量   │
│  - --version 快路径：直接打印版本号，跳过所有后续加载        │
│  - 启动 COREPACK_ENABLE_AUTO_PIN 环境配置                   │
│  - 可选：CLAUDE_CODE_REMOTE 子进程堆栈配置                  │
│  - 懒加载：import("../main.jsx")                            │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────┐
│ [Step 2] src/main.tsx（模块求值副作用）                      │
│  - profileCheckpoint('main_tsx_entry')：启动性能分析点       │
│  - startMdmRawRead()：并行启动 MDM 配置读取                  │
│  - startKeychainPrefetch()：并行预取 keychain OAuth/API Key  │
│  - 导入所有 Commander、服务、工具、权限等模块                │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────┐
│ [Step 3] init()：src/entrypoints/init.ts                    │
│  - 遥测初始化                                               │
│  - 读取全局配置（~/.claude/）                               │
│  - 检查是否接受信任对话框（未接受则展示并等待确认）          │
│  - 设置环境变量代理与安全配置                               │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────┐
│ [Step 4] Commander 解析 CLI 参数                             │
│  - 解析 --model / --permission / --mcp-config 等参数        │
│  - 检测是否为管道（pipe）模式：stdin 是否有数据             │
│  - 应用权限模式（auto/default/plan）                        │
│  - 初始化 MCP 服务器连接                                    │
│  - 初始化 GrowthBook（A/B 测试 / 特性开关）                 │
│  - 执行各类 migrations（配置迁移）                          │
│  - 预取：MCP URL、Bootstrap 数据、AWS/GCP 凭证等            │
└─────────────────────┬───────────────────────────────────────┘
                      │
              ┌───────┴────────┐
              │                │
              ▼                ▼
   ┌──────────────────┐  ┌──────────────────────────┐
   │ 管道模式（-p）   │  │ 交互 REPL 模式            │
   │                  │  │                          │
   │ 读取 stdin 输入  │  │ launchRepl()             │
   │ 直接调用         │  │   → replLauncher.tsx     │
   │ QueryEngine.run()│  │   → Ink render           │
   │ 输出结果到 stdout│  │   → REPL.tsx（React组件） │
   └──────────────────┘  └──────────────────────────┘
```

---

## 3. 核心目录结构

```
claude-code/
├── src/                          # 主程序源码
│   ├── entrypoints/              # 入口文件
│   │   ├── cli.tsx               # ★ 真正入口，polyfill 注入
│   │   ├── init.ts               # 一次性初始化
│   │   └── agentSdkTypes.ts      # Agent SDK 类型定义
│   │
│   ├── main.tsx                  # ★ Commander CLI 主体（4684行）
│   ├── query.ts                  # ★ API 调用与工具编排核心循环
│   ├── QueryEngine.ts            # ★ 高层对话轮次编排器
│   ├── replLauncher.tsx          # REPL 启动器
│   ├── Tool.ts                   # ★ 工具接口类型定义
│   ├── tools.ts                  # ★ 工具注册表（assembleToolPool）
│   ├── context.ts                # 系统提示词上下文构建
│   ├── history.ts                # 对话历史管理
│   ├── cost-tracker.ts           # API 调用费用追踪
│   ├── build.ts                  # 构建脚本入口
│   │
│   ├── screens/                  # 终端 UI 屏幕
│   │   └── REPL.tsx              # ★ 交互式 REPL 主界面（5000+行）
│   │
│   ├── services/                 # 外部服务与基础设施
│   │   ├── api/
│   │   │   ├── claude.ts         # ★ Anthropic API 客户端（3400+行）
│   │   │   ├── bootstrap.ts      # Bootstrap 数据预取
│   │   │   ├── errors.ts         # API 错误处理
│   │   │   ├── logging.ts        # API 日志记录
│   │   │   └── withRetry.ts      # 重试逻辑
│   │   ├── mcp/
│   │   │   ├── client.ts         # ★ MCP 客户端（工具/命令/资源获取）
│   │   │   ├── config.ts         # MCP 配置解析
│   │   │   └── types.ts          # MCP 类型定义
│   │   ├── analytics/            # 遥测/分析（空实现）
│   │   ├── compact/              # 上下文压缩服务
│   │   ├── policyLimits/         # 策略限制服务
│   │   ├── tools/
│   │   │   ├── StreamingToolExecutor.ts  # 流式工具执行器
│   │   │   └── toolOrchestration.ts     # 工具并行编排（runTools）
│   │   └── lsp/                  # LSP 语言服务器管理
│   │
│   ├── tools/                    # 内置工具实现（每个工具一目录）
│   │   ├── AgentTool/            # ★ 子 Agent 调度工具
│   │   ├── BashTool/             # ★ Shell 命令执行
│   │   ├── FileReadTool/         # 文件读取
│   │   ├── FileEditTool/         # 文件编辑
│   │   ├── FileWriteTool/        # 文件写入
│   │   ├── GlobTool/             # Glob 文件查找
│   │   ├── GrepTool/             # 代码搜索（ripgrep）
│   │   ├── WebFetchTool/         # 网页抓取
│   │   ├── WebSearchTool/        # 网络搜索
│   │   ├── TodoWriteTool/        # TODO 任务管理
│   │   ├── NotebookEditTool/     # Jupyter Notebook 编辑
│   │   ├── EnterPlanModeTool/    # 进入计划模式
│   │   ├── ExitPlanModeTool/     # 退出计划模式
│   │   ├── EnterWorktreeTool/    # 进入 Worktree 模式
│   │   ├── ExitWorktreeTool/     # 退出 Worktree 模式
│   │   ├── ConfigTool/           # 配置管理工具
│   │   ├── TaskCreateTool/       # 任务创建
│   │   ├── TaskStopTool/         # 任务停止
│   │   ├── TaskOutputTool/       # 任务输出
│   │   ├── SkillTool/            # 技能调用
│   │   ├── ListMcpResourcesTool/ # 列出 MCP 资源
│   │   ├── ReadMcpResourceTool/  # 读取 MCP 资源
│   │   ├── LSPTool/              # LSP 语言服务工具
│   │   ├── AskUserQuestionTool/  # 向用户提问工具
│   │   ├── TungstenTool/         # 内部工具
│   │   ├── ToolSearchTool/       # 工具搜索
│   │   ├── ScheduleCronTool/     # 定时任务（Cron）
│   │   ├── TeamCreateTool/       # 团队创建（Agent 集群）
│   │   ├── TeamDeleteTool/       # 团队删除
│   │   ├── SendMessageTool/      # 发送消息（Agent 间通信）
│   │   ├── BriefTool/            # 简报工具
│   │   ├── SyntheticOutputTool/  # 合成输出工具
│   │   └── testing/              # 测试权限工具
│   │
│   ├── components/               # Ink React 终端 UI 组件
│   │   ├── App.tsx               # 根组件（AppState Provider）
│   │   ├── Messages.tsx          # 消息列表渲染
│   │   ├── MessageRow.tsx        # 单条消息渲染
│   │   ├── PromptInput/          # 用户输入框组件
│   │   ├── permissions/          # 工具权限审批 UI
│   │   ├── mcp/                  # MCP 相关 UI
│   │   ├── memory/               # Memory 管理 UI
│   │   ├── tasks/                # 任务管理 UI
│   │   ├── teams/                # Agent 团队 UI
│   │   ├── Settings/             # 设置界面
│   │   ├── diff/                 # Diff 展示组件
│   │   ├── design-system/        # UI 设计系统基础组件
│   │   └── ...                   # 其他 UI 组件
│   │
│   ├── state/                    # 应用状态管理
│   │   ├── AppState.tsx          # React Context Provider
│   │   ├── AppStateStore.ts      # 状态类型定义与默认值
│   │   ├── store.ts              # 轻量 Zustand-like store 实现
│   │   └── onChangeAppState.ts   # 状态变更副作用处理
│   │
│   ├── bootstrap/
│   │   └── state.ts              # ★ 会话级全局单例状态（1758行）
│   │
│   ├── commands/                 # 斜杠命令实现
│   │   └── mcp/                  # MCP 相关命令
│   │
│   ├── utils/                    # 工具函数（体量最大，200+文件）
│   │   ├── config.ts             # 配置读写
│   │   ├── auth.ts               # 认证（OAuth、API Key）
│   │   ├── model/                # 模型选择与能力查询
│   │   ├── permissions/          # 权限控制逻辑
│   │   ├── git.ts                # Git 操作
│   │   ├── claudemd.ts           # CLAUDE.md 文件发现与加载
│   │   ├── settings/             # 设置管理（MDM/本地/远程）
│   │   ├── skills/               # Skills 技能管理
│   │   ├── swarm/                # Agent 集群管理
│   │   ├── hooks/                # 生命周期钩子
│   │   ├── telemetry/            # 遥测
│   │   └── ...                   # 大量其他工具函数
│   │
│   ├── types/                    # TypeScript 类型声明
│   │   ├── message.ts            # 消息类型（UserMessage/AssistantMessage等）
│   │   ├── permissions.ts        # 权限类型
│   │   ├── global.d.ts           # 全局类型（MACRO、BUILD_TARGET等）
│   │   └── internal-modules.d.ts # bun:bundle、bun:ffi 等类型
│   │
│   ├── ink/                      # 自定义 Ink 框架（React 终端渲染器）
│   │   ├── hooks/                # 自定义 Hooks
│   │   └── termio/               # 终端 I/O 操作
│   │
│   ├── migrations/               # 配置迁移脚本（版本升级用）
│   ├── coordinator/              # Agent 协调模式（feature门控，死代码）
│   ├── assistant/                # KAIROS 助手模式（feature门控，死代码）
│   ├── bridge/                   # REPL 远程桥接
│   ├── daemon/                   # 后台守护进程
│   ├── remote/                   # 远程会话管理
│   ├── server/                   # 直连服务器
│   ├── plugins/                  # 插件系统（bundled）
│   ├── skills/                   # 内置技能（bundled）
│   ├── tasks/                    # 任务系统（InProcess/LocalAgent）
│   ├── context/                  # React Context（mailbox/voice/stats等）
│   ├── hooks/                    # React Hooks
│   ├── constants/                # 常量定义
│   └── src/                      # ⚠️ 反编译产物镜像目录（同名冗余，见注意）
│
├── packages/                     # Bun Workspace 子包
│   ├── audio-capture-napi/       # 音频捕获（Stub）
│   ├── color-diff-napi/          # 颜色差异（完整实现）
│   ├── image-processor-napi/     # 图像处理（Stub）
│   ├── modifiers-napi/           # 键盘修饰键（Stub）
│   ├── url-handler-napi/         # URL 处理（Stub）
│   └── @ant/                     # Anthropic 内部私有包
│       ├── claude-for-chrome-mcp/ # Chrome 扩展 MCP
│       ├── computer-use-input/    # Computer Use 输入（Stub）
│       ├── computer-use-mcp/     # Computer Use MCP（Stub）
│       └── computer-use-swift/   # Computer Use Swift（Stub）
│
├── docs/                         # 文档
│   ├── testing-spec.md
│   ├── REVISION-PLAN.md
│   └── test-plans/
│
├── scripts/                      # 辅助脚本
│   └── health-check.ts           # 健康检查
│
├── package.json                  # 项目配置（实际依赖在 devDependencies）
├── tsconfig.json                 # TypeScript 配置
├── build.ts                      # Bun 构建脚本
├── CLAUDE.md                     # AI 助手工作指引
├── TODO.md                       # 开发待办
└── SECURITY.md                   # 安全政策
```

> ⚠️ **注意**：`src/src/`、`src/components/src/` 等嵌套目录是反编译产生的**镜像副本**，内容与上层目录重复。二次开发时应以顶层 `src/` 为准，忽略嵌套镜像。

---

## 4. 核心技术栈与关键依赖

### 4.1 核心技术栈

| 类别 | 技术 | 说明 |
|------|------|------|
| 运行时 | **Bun** ≥1.2.0 | Node.js 替代品，更快的启动和执行 |
| 语言 | **TypeScript** (strict: false) | 使用 TSX，通过 Bun 直接运行无需编译 |
| UI 框架 | **React 19** + **Ink**（自定义） | 在终端中渲染 React 组件 |
| CLI 框架 | **Commander.js** | 命令行参数解析 |
| 模块系统 | **ESM** | `"type": "module"`，所有文件使用 `.js`/`.mjs` 扩展名引用 |
| 构建工具 | **Bun Build** | 单文件打包，输出 `dist/cli.js` |
| 代码风格 | **Biome** | Linter + Formatter（替代 ESLint/Prettier） |

### 4.2 关键依赖分类

#### AI / API 核心
| 包 | 版本 | 用途 |
|----|------|------|
| `@anthropic-ai/sdk` | ^0.80.0 | Anthropic API 官方 SDK（流式响应） |
| `@anthropic-ai/claude-agent-sdk` | ^0.2.87 | Agent 模式 SDK |
| `@anthropic-ai/bedrock-sdk` | ^0.26.4 | AWS Bedrock 提供商 |
| `@anthropic-ai/vertex-sdk` | ^0.14.4 | Google Vertex AI 提供商 |
| `@anthropic-ai/mcpb` | ^2.1.2 | MCP Beta 协议 |
| `@modelcontextprotocol/sdk` | ^1.29.0 | MCP 协议标准 SDK |

#### 云厂商 SDK
| 包 | 用途 |
|----|------|
| `@aws-sdk/*` | AWS Bedrock 认证与调用 |
| `@azure/identity` | Azure 认证 |
| `google-auth-library` | Google Cloud 认证 |

#### 终端 UI
| 包 | 用途 |
|----|------|
| `react` + `react-reconciler` | 终端 React 渲染（Ink 基础） |
| `chalk` | 终端颜色输出 |
| `figures` | 终端特殊字符图标 |
| `strip-ansi` | 清除 ANSI 转义码 |
| `wrap-ansi` | 终端文本自动换行 |
| `highlight.js` / `cli-highlight` | 代码语法高亮 |

#### 工具与验证
| 包 | 用途 |
|----|------|
| `zod` ^4.3.6 | Schema 验证（工具输入 JSON Schema） |
| `yaml` | YAML 配置文件解析 |
| `execa` | 子进程执行（BashTool 等） |
| `fuse.js` | 模糊搜索 |
| `lodash-es` | 工具函数库 |
| `lru-cache` | LRU 缓存 |

#### 可观测性
| 包 | 用途 |
|----|------|
| `@opentelemetry/*` | 分布式追踪、指标、日志（全套 OTel） |
| `@growthbook/growthbook` | A/B 测试与特性开关 |

#### 其他
| 包 | 用途 |
|----|------|
| `@commander-js/extra-typings` | Commander.js 类型增强 |
| `ws` | WebSocket 支持（远程会话） |
| `diff` | 文件差异计算 |
| `sharp` | 图像处理 |
| `marked` / `turndown` | Markdown 解析与转换 |
| `proper-lockfile` | 文件锁（并发会话防冲突） |
| `semver` | 版本号处理 |

---

## 5. 核心功能模块详解

### 5.1 CLI 交互模块

**文件**：`src/entrypoints/cli.tsx` → `src/main.tsx` → `src/screens/REPL.tsx`

**职责**：
- 解析命令行参数（`--model`、`--permission`、`--mcp-config`、`-p` 等）
- 提供交互式 REPL（基于 Ink/React 渲染到终端）
- 提供管道模式（`-p`）：从 stdin 读取，输出到 stdout
- 处理键盘输入、Vim 模式、搜索、历史记录
- 渲染消息列表、工具执行结果、权限审批 UI
- 管理 `/slash` 命令（如 `/help`、`/clear`、`/model`）

**REPL 核心组件树**：
```
App.tsx (AppStateProvider)
  └── REPL.tsx
        ├── PromptInput/         用户输入框
        ├── Messages.tsx         消息列表
        │     └── MessageRow.tsx 单条消息（含工具调用展示）
        ├── PermissionRequest.tsx  工具权限审批
        ├── Spinner.tsx          加载状态
        └── 各类 Dialog          设置/帮助/费用等弹出层
```

### 5.2 Agent 调度模块

**文件**：`src/QueryEngine.ts`、`src/tools/AgentTool/`、`src/utils/swarm/`

**职责**：
- `QueryEngine`：高层对话轮次编排，管理会话状态、文件历史快照、token 计数、费用追踪
- `AgentTool`：启动子 Agent 处理并行任务（Agent Swarms）
- `swarm/`：Agent 集群协调，Leader/Worker 架构，Permission 跨 Agent 同步
- 支持 `InProcessTeammateTask`（同进程 Agent）和 `LocalAgentTask`（独立进程 Agent）

### 5.3 LLM 调用模块

**文件**：`src/services/api/claude.ts`、`src/query.ts`

**职责**：
- `claude.ts`：Anthropic API 客户端，构建请求参数（system prompt、messages、tools、betas），调用 SDK 流式接口，处理 `BetaRawMessageStreamEvent` 事件
- `query.ts`：核心查询函数，管理单次 API 调用的完整生命周期：发送请求 → 接收流式响应 → 提取 tool_use → 执行工具 → 构造 tool_result → 再次发送（多轮 agentic loop）
- 支持多 Provider：Anthropic 直连、AWS Bedrock、Google Vertex、Azure
- 上下文压缩（`services/compact/`）：自动压缩过长的上下文窗口

**Agentic Loop（核心循环）**：
```
发送消息到 Claude API
    │
    ▼
接收流式响应（SSE）
    │
    ├─── 普通文本 → 流式渲染到终端
    │
    └─── tool_use → 调用 runTools()
              │
              ▼
         执行工具（可并行）
              │
              ▼
         返回 tool_result
              │
              ▼
         追加到对话历史，继续下一轮
              │
              ▼
         直到 stop_reason === "end_turn"
```

### 5.4 工具执行模块

**文件**：`src/Tool.ts`、`src/tools.ts`、`src/tools/*/`、`src/services/tools/`

**职责**：
- `Tool.ts`：定义 `Tool<Input, Output>` 泛型接口，包含 `call()`、`description`、`inputSchema`、`checkPermissions()`、`renderResultForAssistant()` 等
- `tools.ts`：工具注册表，`getTools()` / `assembleToolPool()` 动态组装工具列表（含 MCP 工具、条件门控工具）
- `services/tools/toolOrchestration.ts`：`runTools()` 并行执行多个工具调用
- `services/tools/StreamingToolExecutor.ts`：流式工具结果处理

**内置工具清单**（部分）：

| 工具名 | 功能 | 类别 |
|--------|------|------|
| `BashTool` | 执行 Shell 命令 | 系统 |
| `FileReadTool` | 读取文件内容 | 文件 |
| `FileEditTool` | 编辑文件（字符串替换） | 文件 |
| `FileWriteTool` | 写入/创建文件 | 文件 |
| `GlobTool` | Glob 模式文件查找 | 文件 |
| `GrepTool` | 代码内容搜索（ripgrep） | 搜索 |
| `WebFetchTool` | 抓取网页内容 | 网络 |
| `WebSearchTool` | 联网搜索 | 网络 |
| `AgentTool` | 启动子 Agent | Agent |
| `TodoWriteTool` | 管理任务列表 | 任务 |
| `NotebookEditTool` | 编辑 Jupyter Notebook | 文件 |
| `EnterPlanModeTool` | 进入只读计划模式 | 模式 |
| `ConfigTool` | 读写 CLI 配置 | 配置 |
| `LSPTool` | 调用 LSP 语言服务 | 开发 |
| `ListMcpResourcesTool` | 列出 MCP 资源 | MCP |
| `ReadMcpResourceTool` | 读取 MCP 资源 | MCP |
| `SkillTool` | 调用预定义技能 | 扩展 |
| `AskUserQuestionTool` | 向用户提问（暂停等待） | 交互 |
| `TaskCreateTool` | 创建任务 | 任务 |

### 5.5 安全权限模块

**文件**：`src/utils/permissions/`、`src/components/permissions/`、`src/types/permissions.ts`

**职责**：
- 定义三种权限模式：
  - `default`：每次工具调用弹出审批提示
  - `auto`：自动批准低风险操作（基于分类器判断）
  - `plan`：只读模式，禁止所有写操作
- `checkPermissions()`：工具执行前的权限检查
- `PermissionRequest.tsx`：终端权限审批 UI（显示工具名、参数，等待用户批准/拒绝）
- `WorkerPendingPermission.tsx`：跨 Agent 权限同步
- `bypass` 模式：企业/受信任环境下跳过所有权限检查
- 支持策略限制（`policyLimits`）：企业 MDM 管理的工具黑白名单

### 5.6 配置管理模块

**文件**：`src/utils/config.ts`、`src/utils/settings/`、`src/bootstrap/state.ts`

**职责**：
- 全局配置（`~/.claude/settings.json`）：API Key、模型偏好、权限设置等
- 项目配置（`.claude/settings.json`）：项目级工具权限
- MDM 配置（企业管理）：通过 `plutil`（macOS）或注册表（Windows）读取
- 远程托管配置（`remoteManagedSettings`）：从 Anthropic 服务端下拉的策略配置
- `bootstrap/state.ts`：会话级内存状态（会话 ID、cwd、模型、费用等），不写磁盘
- `migrations/`：版本升级时的配置自动迁移

### 5.7 MCP（Model Context Protocol）模块

**文件**：`src/services/mcp/`

**职责**：
- 加载和管理 MCP 服务器配置（`stdio` 和 `sse` 两种传输）
- `client.ts`：连接 MCP 服务器，获取工具/命令/资源，动态注入到工具注册表
- `config.ts`：解析 `.claude/mcp.json` 或命令行传入的 MCP 配置
- 支持企业 MCP 配置、官方 MCP 注册表
- MCP 资源可通过 `ListMcpResourcesTool` / `ReadMcpResourceTool` 让 AI 使用

### 5.8 系统提示词构建模块

**文件**：`src/context.ts`、`src/utils/claudemd.ts`、`src/constants/prompts.ts`

**职责**：
- 构建发给 Claude 的系统提示词（system prompt）
- 注入：当前日期、平台信息、Git 状态、最近 5 条 Git Log
- 发现并注入项目 `CLAUDE.md`（从项目根目录向上查找）
- 注入 Memory 文件（`~/.claude/CLAUDE.md`、项目 `.claude/CLAUDE.md`）
- `getUserContext()`：构建用户上下文（工具说明、权限模式等）
- `getSystemContext()`：构建系统上下文（均已 memoize 缓存）

---

## 6. 完整数据流与调用链路

### 6.1 用户输入 → AI 处理 → 工具调用 → 结果输出

```
[用户在终端输入需求，按 Enter]
         │
         ▼
┌─────────────────────────────────────────────────────────────┐
│ REPL.tsx：接收用户输入                                       │
│  - PromptInput 组件捕获键盘事件                             │
│  - 处理斜杠命令（/help、/clear 等）                         │
│  - 普通输入 → 调用 QueryEngine.run(userMessage)             │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────┐
│ QueryEngine.ts：轮次编排                                     │
│  - processUserInput()：预处理（引用展开、附件处理）          │
│  - fetchSystemPromptParts()：构建系统提示词（含CLAUDE.md）   │
│  - 检查上下文窗口是否需要压缩（autoCompact）                │
│  - 调用 query()                                             │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────┐
│ query.ts：单次 API 调用循环                                  │
│  - normalizeMessagesForAPI()：格式化历史消息                 │
│  - 调用 claude.ts 的 streamingRequest()                     │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────┐
│ services/api/claude.ts：API 客户端                           │
│  - 构建请求参数：system / messages / tools / betas          │
│  - 选择 Provider（Anthropic / Bedrock / Vertex / Azure）    │
│  - 调用 @anthropic-ai/sdk 流式接口                          │
│  - 逐个处理 BetaRawMessageStreamEvent 事件                  │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      ▼
         ┌────────────┴────────────┐
         │                         │
         ▼                         ▼
  [文本内容流]              [tool_use 块]
         │                         │
         ▼                         ▼
  流式渲染到终端          services/tools/toolOrchestration.ts
  (MessageRow.tsx)               │
                                  ▼
                     ┌────────────────────────────┐
                     │ 权限检查                   │
                     │ tool.checkPermissions()    │
                     │   ├── 已有权限 → 直接执行  │
                     │   └── 需要审批 → 展示      │
                     │       PermissionRequest.tsx│
                     │       等待用户 y/n 确认    │
                     └──────────┬─────────────────┘
                                │ 批准
                                ▼
                     tool.call(args, context)
                     （具体工具实现执行）
                                │
                                ▼
                     返回 ToolResult
                                │
                                ▼
                     构造 tool_result 消息
                     追加到对话历史
                                │
                                ▼
                     回到 query.ts 继续下一轮
                     直到 stop_reason === "end_turn"
                                │
                                ▼
                     最终文本回复渲染到终端
                     更新费用/token 计数
                     保存会话到 ~/.claude/sessions/
```

### 6.2 消息类型流转

```typescript
// 消息类型层级（src/types/message.ts）

UserMessage          // 用户输入
AssistantMessage     // Claude 回复（含 text + tool_use）
ToolUseSummaryMessage // 工具调用摘要（压缩后）
AttachmentMessage    // 附件消息（图片、文件等）
TombstoneMessage     // 已删除消息的墓碑（保留上下文但清空内容）
SystemCompactBoundaryMessage  // 上下文压缩边界标记
RequestStartEvent    // 请求开始事件
StreamEvent          // 流式事件（渲染用）
```

---

## 7. 关键配置文件与环境变量

### 7.1 配置文件

| 文件路径 | 作用 |
|----------|------|
| `~/.claude/settings.json` | 全局用户配置（API Key、模型、权限、自动更新等） |
| `~/.claude/CLAUDE.md` | 全局 Memory 文件，注入所有会话的系统提示词 |
| `~/.claude/sessions/` | 会话历史存储目录（JSON 格式转录） |
| `.claude/settings.json` | 项目级配置（覆盖全局，工具权限白名单等） |
| `.claude/CLAUDE.md` | 项目级 Memory，注入当前项目的系统提示词 |
| `.claude/mcp.json` 或 `mcpServers` 字段 | MCP 服务器配置 |
| `CLAUDE.md`（项目根目录）| 项目工作指引，自动发现并注入系统提示词 |
| `tsconfig.json` | TypeScript 配置（`strict: false`，`moduleResolution: bundler`） |
| `package.json` | 项目配置，**所有依赖在 devDependencies**（生产依赖为空） |

### 7.2 关键环境变量

| 变量名 | 作用 |
|--------|------|
| `ANTHROPIC_API_KEY` | Anthropic API 密钥（最常用） |
| `ANTHROPIC_BASE_URL` | 自定义 API 端点（代理、私有部署） |
| `ANTHROPIC_MODEL` | 覆盖默认使用的模型 |
| `CLAUDE_CODE_REMOTE` | 启用远程会话模式 |
| `USER_TYPE` | 设为 `ant` 则启用 Anthropic 内部专用工具（`REPLTool` 等） |
| `AWS_REGION` / `AWS_PROFILE` | AWS Bedrock 配置 |
| `VERTEX_PROJECT` / `VERTEX_LOCATION` | Google Vertex AI 配置 |
| `AZURE_*` | Azure OpenAI 配置 |
| `CLAUDE_CODE_*` | 各类 Claude Code 专属配置开关 |
| `NODE_ENV` | 设为 `test` 时跳过 Git 操作 |
| `DISABLE_TELEMETRY` | 禁用遥测数据上报 |
| `OTEL_*` | OpenTelemetry 配置 |
| `NO_COLOR` | 禁用终端颜色输出 |

> ⚠️ **注意**：项目中**没有 `.env.example` 文件**，环境变量分散在代码中定义，需要从 `src/utils/config.ts`、`src/main.tsx`、`src/entrypoints/cli.tsx` 等文件中逐一梳理。

---

## 8. Java 后端架构类比

如果你熟悉 Spring Boot + Java 后端架构，可以用以下对应关系快速理解：

| Java/Spring 概念 | Claude Code 对应 | 说明 |
|-----------------|-----------------|------|
| `main()` / `SpringApplication.run()` | `cli.tsx` → `main.tsx` | 应用入口与启动 |
| `@SpringBootApplication` 初始化 | `init.ts` + Commander 解析 | 服务初始化、配置加载 |
| `Controller` / `RestController` | `REPL.tsx` + PromptInput | 接收用户"请求" |
| `Service` 业务层 | `QueryEngine.ts` | 业务逻辑编排 |
| `Repository` 数据访问层 | `services/api/claude.ts` | 外部 API 调用（类比 HTTP Client） |
| `@Entity` / DTO | `types/message.ts` | 数据模型/传输对象 |
| `ApplicationContext` / Spring 容器 | `AppStateProvider` + `store.ts` | 全局状态容器 |
| 单例 Bean（`@Component`） | `bootstrap/state.ts` 模块单例 | 会话级全局状态 |
| `@Configuration` 配置类 | `utils/config.ts` + `settings/` | 配置加载与管理 |
| 插件/SPI 机制 | `tools.ts` 工具注册表 | 工具动态注册 |
| `Filter` / `Interceptor` | `checkPermissions()` | 请求（工具调用）前置拦截 |
| AOP（切面） | `utils/hooks/` | 生命周期 Hook（pre/post-sampling） |
| `@Scheduled` 定时任务 | `ScheduleCronTool` | 定时任务管理 |
| 消息队列 | `utils/swarm/` + Mailbox | Agent 间消息传递 |
| 微服务通信 | MCP Protocol | 跨服务工具调用协议 |
| MDM/企业配置 | `utils/settings/mdm/` | 企业配置管理 |
| OTel 可观测性 | `@opentelemetry/*` | 分布式追踪（架构一致） |
| 日志框架（Logback/Log4j） | `utils/log.ts` | 日志记录 |
| Maven/Gradle | `package.json` + Bun | 依赖管理与构建 |
| JAR 包 | `dist/cli.js` | 最终可执行产物 |

### 重要差异说明

| 维度 | Java Spring | Claude Code |
|------|-------------|-------------|
| 并发模型 | 多线程 + 线程池 | 单线程 + 异步（Bun Event Loop） |
| 渲染层 | REST API → 前端 | React 组件 → 终端（Ink） |
| 状态管理 | 无状态（Session/Redis） | 会话内内存状态（bootstrap/state.ts） |
| 依赖注入 | Spring IoC 容器 | 模块导入 + React Context |
| 热重载 | Spring DevTools | `bun run dev`（Bun 原生支持） |

---

## 9. 模块关系图

```
┌─────────────────────────────────────────────────────────────────┐
│                        用户层（终端）                            │
│                                                                 │
│  keyboard input ──► PromptInput ──► REPL.tsx ──► Messages.tsx  │
└──────────────────────────┬──────────────────────────────────────┘
                           │ userMessage
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│                     编排层（Orchestration）                      │
│                                                                 │
│         QueryEngine.ts ◄──────────────────────────┐            │
│              │                                     │            │
│              │ fetchSystemPromptParts()            │ loop       │
│              │ processUserInput()                  │            │
│              ▼                                     │            │
│           query.ts ─────── tool_result ────────────┘            │
│              │                                                  │
└──────────────┼──────────────────────────────────────────────────┘
               │ API call
               ▼
┌─────────────────────────────────────────────────────────────────┐
│                       API 层（LLM 调用）                         │
│                                                                 │
│  claude.ts → @anthropic-ai/sdk → Anthropic API                 │
│                                                                 │
│  Provider 选择：Direct / Bedrock / Vertex / Azure               │
└──────────────┬──────────────────────────────────────────────────┘
               │ stream events
               ▼
┌─────────────────────────────────────────────────────────────────┐
│                      工具层（Tool Execution）                    │
│                                                                 │
│  toolOrchestration.runTools()                                   │
│    │                                                            │
│    ├── BashTool ──── execa subprocess                           │
│    ├── FileReadTool ─ fs.read                                   │
│    ├── FileEditTool ─ fs.write                                  │
│    ├── GrepTool ──── ripgrep                                    │
│    ├── WebFetchTool ─ fetch                                     │
│    ├── AgentTool ─── 启动子 QueryEngine                         │
│    └── MCP Tools ─── @modelcontextprotocol/sdk                  │
└──────────────┬──────────────────────────────────────────────────┘
               │ (before execution)
               ▼
┌─────────────────────────────────────────────────────────────────┐
│                    权限层（Permission Guard）                    │
│                                                                 │
│  checkPermissions() → PermissionRequest.tsx → 用户审批          │
│                                                                 │
│  模式：default（每次审批）| auto（自动批准）| plan（只读）       │
└──────────────┬──────────────────────────────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────────────────────────────┐
│                    支撑层（Infrastructure）                      │
│                                                                 │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │ 配置管理      │  │  MCP 服务     │  │  遥测/OTel   │          │
│  │ config.ts    │  │  mcp/client  │  │  analytics/  │          │
│  │ settings/    │  │  mcp/config  │  │  opentelemetry│         │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
│                                                                 │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │ 会话存储      │  │  费用追踪     │  │  上下文压缩   │          │
│  │ sessionStorage│  │  cost-tracker│  │  compact/    │          │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
└─────────────────────────────────────────────────────────────────┘
```

---

*本文档基于 `claude-js v1.0.3` 反编译源码分析生成，仅供学习参考。*

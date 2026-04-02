# 任务 Todo List · OpenCodeAgent 开发计划

> 最后更新：2026-04-02  
> 维护说明：每次开发会话结束后更新任务状态。使用 `[ ]` 表示待做，`[x]` 表示完成，`[~]` 表示进行中，`[-]` 表示取消/搁置。

---

## 四象限总览

```
                    重要
                      ↑
         Q1 紧急重要   │   Q2 重要不紧急
         （立即执行）  │   （计划执行）
    ─────────────────────────────────────→ 紧急
         Q3 紧急不重要 │   Q4 不重要不紧急
         （委托/快做） │   （搁置/删除）
                      │
```

---

## Q1：重要且紧急（立即执行）

### 🔴 P0 核心改造（项目可运行的前提）

- [x] **[P0-01]** 移除遥测/上报模块
  - [x] `src/services/analytics/sink.ts`：替换为 no-op sink
  - [x] `src/entrypoints/init.ts`：移除 1P event logging init 块
  - [x] `src/services/analytics/datadog.ts`：替换为 no-op stubs
  - [x] `src/services/analytics/firstPartyEventLogger.ts`：替换为 no-op stubs

- [x] **[P0-02]** 简化认证流程（移除强制 Anthropic OAuth）
  - [x] `src/services/api/client.ts`：移除 OAuth token 强制获取逻辑，纯 API Key
  - [x] `src/entrypoints/init.ts`：移除 `populateOAuthAccountInfoIfNeeded` 调用
  - [x] `src/utils/config.ts`：`checkHasTrustDialogAccepted()` 直接返回 true

- [x] **[P0-03]** 验证基础运行
  - [x] `bun install` 通过（1193 packages）
  - [x] `--version` 输出正常（`2.1.888`）
  - [x] pipe 模式启动无崩溃，正确连接 Anthropic API（403 expected with placeholder key）

---

## Q2：重要不紧急（计划执行）

> 核心功能建设，决定产品差异化，按阶段计划推进。

### 🟠 Phase 1：Provider 适配层（最核心的差异化功能）

- [ ] **[P1-01]** 设计 Provider 抽象接口
  - [ ] 新建 `src/providers/types.ts`：定义统一 Provider 接口
  - [ ] 新建 `src/providers/registry.ts`：Provider 注册与选择逻辑
  - [ ] 新建 `src/providers/capabilities.ts`：模型能力矩阵（工具支持/上下文长度/视觉能力）

- [ ] **[P1-02]** 实现 OpenAI 兼容适配器
  - [ ] 新建 `src/providers/openai-compat/adapter.ts`
  - [ ] 工具定义格式转换：Anthropic `input_schema` → OpenAI `parameters`
  - [ ] 工具调用响应格式转换：`tool_use` block → `tool_calls` array
  - [ ] 工具结果格式转换：`tool_result` block → role=`tool` 消息
  - [ ] 流式响应格式转换：`BetaRawMessageStreamEvent` ↔ OpenAI SSE delta
  - [ ] 错误处理：OpenAI 错误码 → 内部错误类型映射

- [ ] **[P1-03]** 集成 OpenAI 适配器到 `client.ts`
  - [ ] 新增 `OCA_PROVIDER=openai-compat` 分支
  - [ ] 新增 `OPENAI_BASE_URL` / `OPENAI_API_KEY` 环境变量读取
  - [ ] 测试：DeepSeek API 连通性验证

- [ ] **[P1-04]** Ollama 本地模型支持
  - [ ] 新建 `src/providers/ollama/adapter.ts`（继承 openai-compat）
  - [ ] 自动检测 Ollama 服务是否运行
  - [ ] 新增 `OLLAMA_BASE_URL` 环境变量（默认 `http://localhost:11434`）
  - [ ] 测试：Ollama + qwen2.5-coder 工具调用验证

- [ ] **[P1-05]** 验证国内主流模型
  - [ ] 阿里百炼（Qwen-Max）- OpenAI 兼容接口
  - [ ] DeepSeek API - OpenAI 兼容接口
  - [ ] 火山引擎 Doubao - OpenAI 兼容接口
  - [ ] 整理各模型的兼容性问题与 workaround

### 🟠 Phase 2：中文 UI 与本地化

- [ ] **[P2-01]** 搭建 i18n 基础设施
  - [ ] 新建 `src/i18n/index.ts`：实现 `t(key, params?)` 函数
  - [ ] 新建 `src/i18n/en.ts`：英文字典（从代码中提取 UI 字符串）
  - [ ] 新建 `src/i18n/zh-CN.ts`：中文翻译字典
  - [ ] 语言检测逻辑：CLI 参数 `--lang` → 环境变量 `OCA_LANG` → 系统 locale

- [ ] **[P2-02]** 核心交互路径中文化（高优先级 UI 字符串）
  - [ ] `src/screens/REPL.tsx`：欢迎提示、状态栏、操作提示
  - [ ] `src/components/permissions/PermissionRequest.tsx`：权限审批提示
  - [ ] `src/components/PromptInput/`：输入框提示文字
  - [ ] 错误消息、帮助文字

- [ ] **[P2-03]** 次要 UI 路径中文化
  - [ ] Settings 界面
  - [ ] `/help` 命令输出
  - [ ] 工具执行状态展示

### 🟠 Phase 2：首次启动体验

- [ ] **[P2-04]** 设计首次启动配置向导
  - [ ] 新建 `src/screens/SetupWizard.tsx`
  - [ ] 步骤一：Provider 选择（Anthropic / DeepSeek / 百炼 / Ollama / 自定义）
  - [ ] 步骤二：API Key 和 Base URL 配置
  - [ ] 步骤三：连通性测试
  - [ ] 步骤四：语言选择
  - [ ] 结果写入 `~/.oca/settings.json`

- [ ] **[P2-05]** Profile 系统
  - [ ] 新建 `src/utils/profile.ts`
  - [ ] CLI 参数 `--profile <name>` 支持
  - [ ] Profile YAML 格式定义与解析
  - [ ] `/profile` 斜杠命令支持切换

### 🟠 Phase 3：生态建设

- [ ] **[P3-01]** 费用追踪多 Provider 支持
  - [ ] `src/cost-tracker.ts` 扩展：支持自定义 Provider 的 token 单价
  - [ ] 会话费用统计输出（退出时显示各 Provider 消耗）

- [ ] **[P3-02]** Node.js 兼容性改造
  - [ ] 调研 `bun:bundle` 的 Node.js 替代方案（`@rollup/plugin-replace` 等）
  - [ ] 替换 Bun 专有 API（`Bun.file`、`Bun.serve` 等）
  - [ ] 更新 `build.ts` 支持 webpack/rollup/esbuild 构建
  - [ ] 测试 Node.js 18+ 运行

- [ ] **[P3-03]** 离线优先模式
  - [ ] 网络可用性检测（启动时 ping 配置的 Provider）
  - [ ] 自动降级到 Ollama 本地模型
  - [ ] `dataResidency: "local-only"` 配置项（强制本地模式）

---

## Q3：紧急不重要（快速处理）

> 工程化基础，尽快补齐但不影响核心功能。

- [x] **[Q3-01]** 更新 `package.json` 元信息
  - [x] 修改 `name`（opencodeagent）、`description`、`author`（DoublePeach）、`repository`
  - [x] 更新 `bin` 字段：`oca` / `opencodeagent`

- [x] **[Q3-02]** 更新 `.cursorignore`：添加镜像目录排除（`src/src/` 等）

- [x] **[Q3-03]** 更新 `CLAUDE.md`：改为 OpenCodeAgent 项目 AI 工作指引

- [~] **[Q3-04]** 搭建 GitHub 仓库基础结构
  - [x] 创建 `README.md`（中英双语）
  - [ ] 创建 `CONTRIBUTING.md`
  - [ ] 创建 `.github/ISSUE_TEMPLATE/`
  - [ ] 配置 GitHub Actions（CI：lint + type check）

- [ ] **[Q3-05]** 创建 Provider 贡献指南
  - [ ] 文档：如何为新 Provider 实现 adapter
  - [ ] 示例：贡献 Provider 的 PR 模板

---

## Q4：不重要不紧急（搁置/后续评估）

- [ ] **[Q4-01]** Web UI 包装（超出当前范围，视社区需求）
- [ ] **[Q4-02]** VS Code 扩展（超出当前范围）
- [ ] **[Q4-03]** 飞书 / 钉钉 MCP Server（可作为独立子项目）
- [ ] **[Q4-04]** CI/CD 自动发布流程（早期手动发布即可）
- [ ] **[Q4-05]** 修复 TypeScript 类型错误（~1341 个，不影响运行）
- [ ] **[Q4-06]** Agent Swarms 多 Agent 并行任务系统增强

---

## 里程碑计划

| 里程碑 | 目标 | 关键任务 | 预估完成 |
|--------|------|---------|---------|
| M1: 可运行 | 去遥测去认证，本地跑通 | P0-01/02/03 | ✅ 2026-04-02 完成 |
| M2: 多模型 MVP | 支持 Anthropic + DeepSeek + Ollama | P1-01 ~ P1-05 | M1 后 3-4 周 |
| M3: 中文完整版 | 中文 UI + 配置向导 + Profile | P2-01 ~ P2-05 | M2 后 2-3 周 |
| M4: 公开发布 | GitHub 公开 + README + 贡献文档 | Q3-04/05 | M3 后 1 周 |
| M5: 生态建设 | Node.js 兼容 + 费用追踪 + 离线模式 | P3-01 ~ P3-03 | M4 后持续迭代 |

---

## 当前冲刺（Sprint 1）

> **M1 已完成**，现阶段重点：**M2 多模型 MVP** — Provider 适配层

| 任务 | 状态 | 完成日期 |
|------|------|--------|
| 文档初始化（product-overview.md、todo-list.md） | ✅ 完成 | 2026-04-02 |
| 架构总览文档（architecture-overview.md） | ✅ 完成 | 2026-04-02 |
| README.md 改写（中英双语） | ✅ 完成 | 2026-04-02 |
| GitHub 仓库初始化推送 | ✅ 完成 | 2026-04-02 |
| Q3-01/02/03 package.json / .cursorignore / CLAUDE.md | ✅ 完成 | 2026-04-02 |
| P0-01 移除遥测（datadog / 1P / sink → no-op） | ✅ 完成 | 2026-04-02 |
| P0-02 简化认证（去 OAuth，纯 API Key） | ✅ 完成 | 2026-04-02 |
| P0-03 验证基础运行（bun install + 启动测试） | ✅ 完成 | 2026-04-02 |
| LAW-01 法律咨询 | ⏳ 待处理 | 人工跟进 |
| **P1-01 Provider 抽象接口设计** | 🔲 下一个 | — |
| **P1-02 OpenAI 兼容适配器实现** | 🔲 待排期 | — |
| **P1-03 集成适配器到 client.ts** | 🔲 待排期 | — |

---

*文档维护：每次 Cursor AI 会话结束时更新任务状态。最后更新：2026-04-02*

/**
 * Simplified Chinese (zh-CN) locale.
 * Only covers user-facing UI strings — system prompts and LLM instructions remain in English.
 */
import type { TranslationKeys } from './en.js'

export const zhCN: TranslationKeys = {
  repl: {
    title: 'OpenCodeAgent',
    idle: {
      newTask: '新任务？',
      clearHint: '清空对话',
      tokens: 'tokens',
    },
    search: {
      indexing: '索引中…',
      indexed: '已索引，耗时 {ms}ms',
      noMatches: '无匹配',
      matches: '{current}/{total} 个匹配',
    },
    transcript: {
      showing: '显示详细转录',
      toggle: '{shortcut} 切换',
      collapse: '收起',
      showAll: '展开全部',
      navigate: 'n/N 导航',
    },
    hooks: {
      runningPreCompact: '正在执行 PreCompact 钩子…',
      runningPostCompact: '正在执行 PostCompact 钩子…',
      runningSessionStart: '正在执行 SessionStart 钩子…',
      compacting: '正在压缩对话…',
    },
    sandbox: {
      disabled: '沙箱已禁用',
      errorPrefix: '沙箱错误：',
      requiredUnavailable: '错误：需要沙箱但不可用',
    },
    agent: {
      failedResume: '恢复 Agent 失败：{error}',
    },
    suspended: 'OpenCodeAgent 已挂起。输入 {fg} 或按 {key} 继续。',
    worktreeCreation: '工作树创建耗时 {duration}',
    network: {
      waitingApproval: '等待团队负责人批准访问 {host}',
      label: '网络访问',
    },
    feedback: {
      memoryQuestion: 'Agent 使用记忆的效果如何？（可选）',
    },
  },

  permissions: {
    prompt: {
      defaultQuestion: '是否继续执行？',
      yes: '是',
      no: '否',
      yesAlways: '是，且不再询问 {scope}',
      noTellWhat: '否，并告诉 Agent 如何改进（esc）',
      escCancel: 'Esc 取消',
    },
    network: {
      title: '沙箱外部网络请求',
      question: '是否允许此网络连接？',
      host: '主机：',
    },
    fetch: {
      title: '网络获取',
      question: '是否允许 Agent 获取此内容？',
    },
    bash: {
      title: 'Bash 命令',
    },
    powershell: {
      title: 'PowerShell 命令',
      showDebug: 'Ctrl+d 显示调试信息',
      hideDebug: 'Ctrl-D 隐藏调试信息',
    },
    fileWrite: {
      titleOverwrite: '覆盖文件',
      titleCreate: '创建文件',
      question: '是否{action} {path}？',
    },
    fileEdit: {
      title: '编辑文件',
      question: '是否对 {path} 进行此编辑？',
      fileNotExist: '文件不存在',
      patternNoMatch: '未找到匹配内容',
    },
    notebook: {
      title: '编辑 Notebook',
    },
    filesystem: {
      read: '读取',
      edit: '编辑',
    },
    tool: {
      title: '工具调用',
    },
    skill: {
      mayUseInstructions: 'Agent 可能会使用此技能中的指令…',
    },
    planMode: {
      enter: '进入计划模式？',
      exit: '是否继续执行？',
    },
    worker: {
      tool: '工具：',
      action: '操作：',
      pendingApproval: '权限请求已发送给团队 "{team}" 负责人',
    },
    explanation: {
      unavailable: '无可用说明',
    },
    debug: {
      suggestedRules: '建议规则：',
      suggestions: '建议',
      rules: '规则',
      directories: '目录',
      mode: '模式',
      behavior: '行为',
      message: '消息',
      reason: '原因',
      none: '无',
    },
    rules: {
      tabRecentlyDenied: '最近拒绝',
      tabAllow: '允许',
      tabAsk: '询问',
      tabDeny: '拒绝',
      tabWorkspace: '工作区',
      permissions: '权限：',
      pressAgainExit: '再次按 {key} 退出',
      escCancel: 'Esc 取消',
      ruleDetails: '规则详情',
      deleteTool: '删除 {tool} 工具？',
      addRule: '添加 {type} 权限规则',
      whereToSave: '规则保存在哪里？',
      enterToSubmit: 'Enter 提交 · Esc 取消',
      originalWorkDir: '（原始工作目录）',
      addDirectory: '添加目录到工作区',
      enterPath: '请输入路径…',
      removeDirectory: '从工作区移除此目录？',
      noLongerAccess: 'Agent 将不再能访问 {path}',
    },
  },

  promptInput: {
    placeholder: {
      messageAgent: '发消息给 @{name}…',
      pressUpEdit: '按 ↑ 编辑已排队的消息',
    },
    footer: {
      waiting: '等待中 {duration}',
      pressAgainExit: '再次按 {key} 退出',
      pasting: '粘贴文本中…',
      insertMode: '-- 插入模式 --',
      bashMode: '! 进入 Bash 模式',
      interrupt: '中断',
      stopAgents: '停止 Agents',
      showTasks: '显示任务',
      showTeammates: '显示成员',
      hide: '隐藏',
      manageTasks: '管理',
      viewTasks: '查看任务',
      returnToLead: '返回团队负责人',
      remote: '远程',
      copy: '复制',
      nativeSelect: '原生选择',
      holdToSpeak: '按住 {key} 说话',
      shortcutsHint: '? 查看快捷键',
    },
    help: {
      newline: '{keys} 换行',
      bashMode: '! 进入 Bash 模式',
      commands: '/ 查看命令列表',
      filePaths: '@ 引用文件路径',
      background: '& 后台任务',
      sideQuestion: '/btw 提一个附加问题',
      doubleTapClear: '双击 Esc 清空输入',
      autoAcceptEdits: '自动接受编辑',
      cycleMode: '切换模式',
      verboseOutput: '{key} 详细输出',
      toggleTasks: '{key} 切换任务面板',
      undo: '{key} 撤销',
      suspend: 'Ctrl+Z 挂起',
      pasteImages: '{key} 粘贴图片',
      switchModel: '{key} 切换模型',
      toggleFastMode: '{key} 切换快速模式',
      stashPrompt: '{key} 暂存输入',
      editInEditor: '{key} 在 $EDITOR 中编辑',
      customizeKeys: '/keybindings 自定义快捷键',
    },
    sandbox: {
      blockedOps: '沙箱拦截了 {count} {operations} · {key} 查看详情 · /sandbox 禁用',
      operation: '次操作',
      operations: '次操作',
    },
    notifications: {
      effortHigh: '本轮已设置为高强度模式',
      modelSet: '模型已切换为 {model}',
      sentToAgent: '已发送给 @{name}',
      editorFailed: '外部编辑器失败：{error}',
      noImageInClipboard: '剪贴板中未找到图片',
      optionAsMeta: 'Option 作为 Meta 键',
      terminalSetup: '/terminal-setup',
    },
  },

  general: {
    search: {
      typePlaceholder: '输入关键词搜索…',
      noMatches: '无匹配结果',
      searching: '搜索中…',
    },
    session: {
      rename: '重命名会话',
      enterNewName: '输入新的会话名称',
    },
    question: {
      typeSomething: '请输入内容',
    },
    pressAgainExit: '再次按 {key} 退出',
    escToCancel: '{key} 取消',
  },

  help: {
    title: 'OpenCodeAgent v{version}',
    tabs: {
      general: '常规',
      commands: '命令',
      customCommands: '自定义命令',
    },
    general: {
      description:
        'OpenCodeAgent 理解你的代码库，在你的许可下进行编辑并执行命令——直接在终端中运行。',
      shortcuts: '快捷键',
    },
    commands: {
      browseDefault: '浏览内置命令：',
      browseCustom: '浏览自定义命令：',
      noCustom: '未找到自定义命令',
    },
    forMoreHelp: '更多帮助：',
  },

  tips: {
    multilineInput: '使用 {keys} 输入多行内容',
    memoryFiles: '使用 /memory 管理记忆文件',
    terminalSetup: '使用 /terminal-setup 配置终端选项',
  },

  setup: {
    welcome: '欢迎使用 OpenCodeAgent！',
    subtitle: '让我们来配置您的 AI 提供商。',
    step: '第 {current} 步，共 {total} 步',
    providerSelect: {
      title: '选择 AI 提供商',
      hint: '↑↓ 导航，Enter 选择',
    },
    apiKey: {
      title: '输入 API Key',
      label: 'API Key',
      urlLabel: '服务地址（Base URL）',
      hint: '配置将保存至 ~/.oca/settings.json',
    },
    connectivity: {
      title: '正在测试连接…',
      success: '✓ 连接成功！',
      failure: '✗ 连接失败：{error}',
      retry: '按 r 重试，Enter 跳过',
    },
    language: {
      title: '选择界面语言',
      hint: '仅影响界面显示，系统提示词保持英文以保证效果。',
      changed: '语言已切换为 {lang}',
    },
    done: {
      title: '配置完成！',
      message: '运行 {cmd} 开始编程。',
      skipMessage: '可随时运行 {cmd} 重新配置',
    },
    skip: '跳过',
    back: '上一步',
    next: '下一步',
    finish: '完成',
  },

  language: {
    title: 'Language / 语言',
    hint: '仅影响界面 · UI only — system prompts stay in English',
    cancel: 'Esc 取消',
    changed: '语言已设置为：{lang}',
  },

  providerCmd: {
    titlePick: '切换模型厂商与大模型',
    hintPick: '选择后端（Anthropic、OpenAI 兼容、Ollama 等）。将写入 ~/.oca/settings.json',
    navPick: '↑↓ 选择 · Enter 进入配置 · Esc 取消',
    titleConfigure: '地址与模型',
    hintConfigure: 'Tab 切换字段 · Enter 保存（当前会话立即生效）· Esc 返回厂商列表',
    vendor: '厂商：',
    keyPlaceholder: '留空则保留已保存的 Key',
    navConfigure: 'Tab · Enter 保存 · Esc 返回厂商',
    applied: '已切换为 {vendor} · 模型 {model}',
  },

  onboarding: {
    security: {
      title: '安全提示：',
      canMakeMistakes: 'OpenCodeAgent 可能会犯错',
      canMakeMistakesDetail: '请始终审核 Agent 的操作，尤其是执行代码时。',
      promptInjection: '由于提示注入风险，请仅在可信代码中使用',
    },
    terminal: {
      title: '使用 OpenCodeAgent 的终端设置？',
    },
  },
}

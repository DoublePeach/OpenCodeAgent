/**
 * English locale — source of truth for all UI strings.
 * Keys use dot-notation segments: <area>.<component>.<item>
 * Use {varName} for runtime interpolation.
 */
export const en = {
  // ─── REPL ───────────────────────────────────────────────────────────────────
  repl: {
    title: 'OpenCodeAgent',
    idle: {
      newTask: 'new task?',
      clearHint: 'to save',
      tokens: 'tokens',
    },
    search: {
      indexing: 'indexing…',
      indexed: 'indexed in {ms}ms',
      noMatches: 'no matches',
      matches: '{current}/{total} matches',
    },
    transcript: {
      showing: 'Showing detailed transcript',
      toggle: '{shortcut} to toggle',
      collapse: 'collapse',
      showAll: 'show all',
      navigate: 'n/N to navigate',
    },
    hooks: {
      runningPreCompact: 'Running PreCompact hooks…',
      runningPostCompact: 'Running PostCompact hooks…',
      runningSessionStart: 'Running SessionStart hooks…',
      compacting: 'Compacting conversation',
    },
    sandbox: {
      disabled: 'sandbox disabled',
      errorPrefix: 'Sandbox Error:',
      requiredUnavailable: 'Error: sandbox required but unavailable',
    },
    agent: {
      failedResume: 'Failed to resume agent: {error}',
    },
    suspended: 'OpenCodeAgent has been suspended. Type {fg} or press {key} to continue.',
    worktreeCreation: 'Worktree creation took {duration}',
    network: {
      waitingApproval: 'Waiting for leader to approve network access to {host}',
      label: 'Network Access',
    },
    feedback: {
      memoryQuestion: 'How well did the agent use its memory? (optional)',
    },
  },

  // ─── PERMISSIONS ────────────────────────────────────────────────────────────
  permissions: {
    prompt: {
      defaultQuestion: 'Do you want to proceed?',
      yes: 'Yes',
      no: 'No',
      yesAlways: "Yes, and don't ask again for {scope}",
      noTellWhat: 'No, and tell the agent what to do differently (esc)',
      escCancel: 'Esc to cancel',
    },
    network: {
      title: 'Network request outside of sandbox',
      question: 'Do you want to allow this connection?',
      host: 'Host:',
    },
    fetch: {
      title: 'Fetch',
      question: 'Do you want to allow the agent to fetch this content?',
    },
    bash: {
      title: 'Bash command',
    },
    powershell: {
      title: 'PowerShell command',
      showDebug: 'Ctrl+d to show debug info',
      hideDebug: 'Ctrl-D to hide debug info',
    },
    fileWrite: {
      titleOverwrite: 'Overwrite file',
      titleCreate: 'Create file',
      question: 'Do you want to {action} {path}?',
    },
    fileEdit: {
      title: 'Edit file',
      question: 'Do you want to make this edit to {path}?',
      fileNotExist: 'File does not exist',
      patternNoMatch: 'Pattern did not match any content',
    },
    notebook: {
      title: 'Edit notebook',
    },
    filesystem: {
      read: 'Read',
      edit: 'Edit',
    },
    tool: {
      title: 'Tool use',
    },
    skill: {
      mayUseInstructions: 'The agent may use instructions from this skill…',
    },
    planMode: {
      enter: 'Enter plan mode?',
      exit: 'Would you like to proceed?',
    },
    worker: {
      tool: 'Tool:',
      action: 'Action:',
      pendingApproval: 'Permission request sent to team "{team}" leader',
    },
    explanation: {
      unavailable: 'Explanation unavailable',
    },
    debug: {
      suggestedRules: 'Suggested rules:',
      suggestions: 'Suggestions',
      rules: 'Rules',
      directories: 'Directories',
      mode: 'Mode',
      behavior: 'Behavior',
      message: 'Message',
      reason: 'Reason',
      none: 'None',
    },
    rules: {
      tabRecentlyDenied: 'Recently denied',
      tabAllow: 'Allow',
      tabAsk: 'Ask',
      tabDeny: 'Deny',
      tabWorkspace: 'Workspace',
      permissions: 'Permissions:',
      pressAgainExit: 'Press {key} again to exit',
      escCancel: 'Esc to cancel',
      ruleDetails: 'Rule details',
      deleteTool: 'Delete {tool} tool?',
      addRule: 'Add {type} permission rule',
      whereToSave: 'Where should this rule be saved?',
      enterToSubmit: 'Enter to submit · Esc to cancel',
      originalWorkDir: '(Original working directory)',
      addDirectory: 'Add directory to workspace',
      enterPath: 'Enter the path…',
      removeDirectory: 'Remove directory from workspace?',
      noLongerAccess: 'The agent will no longer have access to {path}',
    },
  },

  // ─── PROMPT INPUT ───────────────────────────────────────────────────────────
  promptInput: {
    placeholder: {
      messageAgent: 'Message @{name}…',
      pressUpEdit: 'Press up to edit queued messages',
    },
    footer: {
      waiting: 'waiting {duration}',
      pressAgainExit: 'Press {key} again to exit',
      pasting: 'Pasting text…',
      insertMode: '-- INSERT --',
      bashMode: '! for bash mode',
      interrupt: 'interrupt',
      stopAgents: 'stop agents',
      showTasks: 'show tasks',
      showTeammates: 'show teammates',
      hide: 'hide',
      manageTasks: 'manage',
      viewTasks: 'view tasks',
      returnToLead: 'return to team lead',
      remote: 'remote',
      copy: 'copy',
      nativeSelect: 'native select',
      holdToSpeak: 'hold {key} to speak',
      shortcutsHint: '? for shortcuts',
    },
    help: {
      newline: '{keys} for newline',
      bashMode: '! for bash mode',
      commands: '/ for commands',
      filePaths: '@ for file paths',
      background: '& for background tasks',
      sideQuestion: '/btw for side question',
      doubleTapClear: 'double tap esc to clear input',
      autoAcceptEdits: 'to auto-accept edits',
      cycleMode: 'to cycle modes',
      verboseOutput: '{key} for verbose output',
      toggleTasks: '{key} to toggle tasks',
      undo: '{key} to undo',
      suspend: 'ctrl + z to suspend',
      pasteImages: '{key} to paste images',
      switchModel: '{key} to switch model',
      toggleFastMode: '{key} to toggle fast mode',
      stashPrompt: '{key} to stash prompt',
      editInEditor: '{key} to edit in $EDITOR',
      customizeKeys: '/keybindings to customize',
    },
    sandbox: {
      blockedOps: 'Sandbox blocked {count} {operations} · {key} for details · /sandbox to disable',
      operation: 'operation',
      operations: 'operations',
    },
    notifications: {
      effortHigh: 'Effort set to high for this turn',
      modelSet: 'Model set to {model}',
      sentToAgent: 'Sent to @{name}',
      editorFailed: 'External editor failed: {error}',
      noImageInClipboard: 'No image found in clipboard',
      optionAsMeta: 'Option as Meta',
      terminalSetup: '/terminal-setup',
    },
  },

  // ─── GENERAL / DIALOGS ──────────────────────────────────────────────────────
  general: {
    search: {
      typePlaceholder: 'Type to search…',
      noMatches: 'No matches',
      searching: 'Searching…',
    },
    session: {
      rename: 'Rename session',
      enterNewName: 'Enter new session name',
    },
    question: {
      typeSomething: 'Type something',
    },
    pressAgainExit: 'Press {key} again to exit',
    escToCancel: '{key} to cancel',
  },

  // ─── HELP ────────────────────────────────────────────────────────────────────
  help: {
    title: 'OpenCodeAgent v{version}',
    tabs: {
      general: 'general',
      commands: 'commands',
      customCommands: 'custom-commands',
    },
    general: {
      description:
        'OpenCodeAgent understands your codebase, makes edits with your permission, and executes commands — right from your terminal.',
      shortcuts: 'Shortcuts',
    },
    commands: {
      browseDefault: 'Browse built-in commands:',
      browseCustom: 'Browse custom commands:',
      noCustom: 'No custom commands found',
    },
    forMoreHelp: 'For more help:',
  },

  // ─── TIPS ────────────────────────────────────────────────────────────────────
  tips: {
    multilineInput: 'Use {keys} for multi-line input',
    memoryFiles: 'Use /memory to manage memory files',
    terminalSetup: 'Use /terminal-setup to configure terminal options',
  },

  // ─── SETUP WIZARD ────────────────────────────────────────────────────────────
  setup: {
    welcome: 'Welcome to OpenCodeAgent!',
    subtitle: "Let's set up your AI provider.",
    step: 'Step {current} of {total}',
    providerSelect: {
      title: 'Choose your AI provider',
      hint: 'Use ↑↓ to navigate, Enter to select',
    },
    apiKey: {
      title: 'Enter your API key',
      label: 'API Key',
      urlLabel: 'Base URL',
      hint: 'Your key will be saved to ~/.oca/settings.json',
    },
    connectivity: {
      title: 'Testing connectivity…',
      success: '✓ Connected successfully!',
      failure: '✗ Connection failed: {error}',
      retry: 'Press r to retry, Enter to skip',
    },
    language: {
      title: 'Choose your language',
      hint: 'This only affects the UI. System prompts stay in English.',
      changed: 'Language changed to {lang}',
    },
    done: {
      title: 'All set!',
      message: 'Run {cmd} to start coding.',
      skipMessage: 'You can re-run setup with {cmd}',
    },
    skip: 'Skip',
    back: 'Back',
    next: 'Next',
    finish: 'Finish',
  },

  // ─── LANGUAGE PICKER ─────────────────────────────────────────────────────────
  language: {
    title: 'Language / 语言',
    hint: 'UI only — system prompts stay in English',
    cancel: 'Esc to cancel',
    changed: 'Language set to: {lang}',
  },

  providerCmd: {
    titlePick: 'Switch AI vendor & model',
    hintPick: 'Choose backend (Anthropic, OpenAI-compat, Ollama…). Saved to ~/.oca/settings.json',
    navPick: '↑↓ navigate · Enter configure · Esc cancel',
    titleConfigure: 'Endpoint & model',
    hintConfigure: 'Tab switch field · Enter save (applies to this session) · Esc back',
    vendor: 'Vendor:',
    keyPlaceholder: '(unchanged if empty)',
    navConfigure: 'Tab · Enter save · Esc back to vendor list',
    applied: 'Provider set to {vendor} · model {model}',
  },

  // ─── ONBOARDING / TRUST ───────────────────────────────────────────────────────
  onboarding: {
    security: {
      title: 'Security notes:',
      canMakeMistakes: 'OpenCodeAgent can make mistakes',
      canMakeMistakesDetail:
        'You should always review responses, especially when running code.',
      promptInjection: 'Due to prompt injection risks, only use with code you trust',
    },
    terminal: {
      title: "Use OpenCodeAgent's terminal setup?",
    },
  },
} as const

export type TranslationKeys = typeof en

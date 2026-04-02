---
name: Provider request / 新 Provider 请求
about: Request support for a new AI provider / 请求添加新的 AI 提供商
title: '[Provider] '
labels: enhancement, provider
assignees: ''
---

## Provider 基本信息 / Provider Info

- Provider Name: [e.g. Moonshot AI]
- API Documentation: [URL]
- OpenAI Compatible: [Yes / No]
- Base URL: [e.g. https://api.moonshot.cn/v1]
- Available Models: [e.g. moonshot-v1-8k, moonshot-v1-32k]

## 使用场景 / Use Case

Why would you like this provider to be supported?

## 已尝试的方法 / What You've Tried

If you've already tried using it via `OCA_PROVIDER=openai-compat`, please share your findings:

```bash
OCA_PROVIDER=openai-compat \
OPENAI_BASE_URL=https://api.your-provider.com/v1 \
OPENAI_API_KEY=your_key \
OCA_MODEL=model-name \
bun run dev
```

Results: [success / error message]

## 兼容性问题 / Compatibility Issues

- Tool calls (function calling): [supported / not supported / partial]
- Streaming: [supported / not supported]
- Vision: [supported / not supported]
- Any other known issues:

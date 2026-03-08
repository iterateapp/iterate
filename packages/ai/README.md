# `@iterate/ai`

Unified AI provider abstraction for the Iterate platform. Supports OpenAI, Anthropic, and Codex with a single interface.

## Usage

```typescript
import { createAIClient, MODELS } from "@iterate/ai"

const ai = createAIClient({
  defaultModel: MODELS["claude-sonnet-4"],
  systemPrompt: "You are a product analyst.",
})

// One-shot
const answer = await ai.ask("What caused the conversion drop?")

// Conversation
const response = await ai.chat([
  { role: "user", content: "Analyze booking funnel" },
])

// Streaming
await ai.chatStream(messages, (chunk) => {
  if (!chunk.done) process.stdout.write(chunk.content)
})
```

## Providers

### Direct access

```typescript
import { createOpenAIProvider } from "@iterate/ai/openai"
import { createAnthropicProvider } from "@iterate/ai/anthropic"
import { createCodexProvider } from "@iterate/ai/codex"
```

### Codex (autonomous PR generation)

```typescript
import { createCodexProvider } from "@iterate/ai/codex"

const codex = createCodexProvider()
const task = await codex.submitTask({
  prompt: "Add one-tap booking from saved list",
  repoUrl: "https://github.com/ahoda-inc/ahoda-web",
  sandboxConfig: {
    install: "pnpm install",
    lint: "pnpm lint",
    test: "pnpm test",
  },
})

const result = await codex.pollUntilComplete(task.taskId)
console.log(result.pullRequestUrl)
```

## Environment Variables

```bash
OPENAI_API_KEY=       # Required for OpenAI / Codex
ANTHROPIC_API_KEY=    # Required for Anthropic
```

## Models

| Key | Provider | Model ID |
|-----|----------|----------|
| `claude-opus-4` | Anthropic | `claude-opus-4-20250514` |
| `claude-sonnet-4` | Anthropic | `claude-sonnet-4-20250514` |
| `claude-haiku-3.5` | Anthropic | `claude-3-5-haiku-20241022` |
| `gpt-4.1` | OpenAI | `gpt-4.1` |
| `gpt-4.1-mini` | OpenAI | `gpt-4.1-mini` |
| `gpt-4.1-nano` | OpenAI | `gpt-4.1-nano` |
| `o3` | OpenAI | `o3` |
| `o4-mini` | OpenAI | `o4-mini` |

// ── @iterate/ai ─────────────────────────────────────────────────────
// Unified AI provider abstraction for OpenAI, Anthropic, and Codex.

export { createAIClient } from "./client"
export type { AIClient, AIClientConfig } from "./client"

export { createOpenAIProvider } from "./providers/openai"
export { createAnthropicProvider } from "./providers/anthropic"
export { createCodexProvider } from "./providers/codex"
export type { CodexProvider } from "./providers/codex"

export { MODELS } from "./types"
export type {
  AIProvider,
  ChatRequest,
  ChatResponse,
  CodexTask,
  CodexTaskResult,
  Message,
  ModelConfig,
  Provider,
  Role,
  StreamCallback,
  StreamChunk,
} from "./types"

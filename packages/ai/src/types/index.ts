import { z } from "zod"

// ── Provider Configuration ──────────────────────────────────────────

export const ProviderSchema = z.enum(["openai", "anthropic"])

export type Provider = z.infer<typeof ProviderSchema>

export const ModelSchema = z.object({
  provider: ProviderSchema,
  model: z.string(),
  maxTokens: z.number().optional(),
  temperature: z.number().min(0).max(2).optional(),
})

export type ModelConfig = z.infer<typeof ModelSchema>

// ── Messages ────────────────────────────────────────────────────────

export const RoleSchema = z.enum(["system", "user", "assistant"])

export type Role = z.infer<typeof RoleSchema>

export interface Message {
  role: Role
  content: string
}

// ── Chat Request / Response ─────────────────────────────────────────

export interface ChatRequest {
  model: ModelConfig
  messages: Message[]
  stream?: boolean
}

export interface ChatResponse {
  content: string
  model: string
  provider: Provider
  usage: {
    promptTokens: number
    completionTokens: number
    totalTokens: number
  }
  finishReason: string
}

// ── Streaming ───────────────────────────────────────────────────────

export interface StreamChunk {
  content: string
  done: boolean
}

export type StreamCallback = (chunk: StreamChunk) => void

// ── Provider Interface ──────────────────────────────────────────────

export interface AIProvider {
  readonly name: Provider
  chat(request: ChatRequest): Promise<ChatResponse>
  chatStream(request: ChatRequest, onChunk: StreamCallback): Promise<ChatResponse>
}

// ── Codex Task ──────────────────────────────────────────────────────

export interface CodexTask {
  prompt: string
  repoUrl: string
  branch?: string
  sandboxConfig?: {
    install: string
    lint: string
    test: string
  }
}

export interface CodexTaskResult {
  taskId: string
  status: "queued" | "running" | "completed" | "failed"
  pullRequestUrl?: string
  output?: string
}

// ── Presets ──────────────────────────────────────────────────────────

export const MODELS = {
  // OpenAI
  "gpt-4.1": { provider: "openai" as const, model: "gpt-4.1" },
  "gpt-4.1-mini": { provider: "openai" as const, model: "gpt-4.1-mini" },
  "gpt-4.1-nano": { provider: "openai" as const, model: "gpt-4.1-nano" },
  "o3": { provider: "openai" as const, model: "o3" },
  "o4-mini": { provider: "openai" as const, model: "o4-mini" },
  // Anthropic
  "claude-opus-4": { provider: "anthropic" as const, model: "claude-opus-4-20250514" },
  "claude-sonnet-4": { provider: "anthropic" as const, model: "claude-sonnet-4-20250514" },
  "claude-haiku-3.5": { provider: "anthropic" as const, model: "claude-3-5-haiku-20241022" },
} as const satisfies Record<string, ModelConfig>

import type {
  AIProvider,
  ChatRequest,
  ChatResponse,
  Message,
  ModelConfig,
  Provider,
  StreamCallback,
} from "./types"
import { MODELS } from "./types"
import { createOpenAIProvider } from "./providers/openai"
import { createAnthropicProvider } from "./providers/anthropic"

// ── Provider Registry ───────────────────────────────────────────────

const providers = new Map<Provider, AIProvider>()

function getProvider(provider: Provider): AIProvider {
  const existing = providers.get(provider)
  if (existing) return existing

  let instance: AIProvider
  switch (provider) {
    case "openai":
      instance = createOpenAIProvider()
      break
    case "anthropic":
      instance = createAnthropicProvider()
      break
    default:
      throw new Error(`Unknown provider: ${provider}`)
  }

  providers.set(provider, instance)
  return instance
}

// ── AI Client ───────────────────────────────────────────────────────

export interface AIClientConfig {
  defaultModel?: ModelConfig
  systemPrompt?: string
}

export function createAIClient(config: AIClientConfig = {}) {
  const defaultModel = config.defaultModel ?? MODELS["claude-sonnet-4"]

  function buildMessages(
    userMessages: Message[],
    systemPrompt?: string
  ): Message[] {
    const messages: Message[] = []
    const sys = systemPrompt ?? config.systemPrompt
    if (sys) {
      messages.push({ role: "system", content: sys })
    }
    messages.push(...userMessages)
    return messages
  }

  return {
    /**
     * Send a chat completion request.
     */
    async chat(
      messages: Message[],
      options?: { model?: ModelConfig; systemPrompt?: string }
    ): Promise<ChatResponse> {
      const model = options?.model ?? defaultModel
      const provider = getProvider(model.provider)
      const request: ChatRequest = {
        model,
        messages: buildMessages(messages, options?.systemPrompt),
      }
      return provider.chat(request)
    },

    /**
     * Stream a chat completion, calling onChunk for each token.
     */
    async chatStream(
      messages: Message[],
      onChunk: StreamCallback,
      options?: { model?: ModelConfig; systemPrompt?: string }
    ): Promise<ChatResponse> {
      const model = options?.model ?? defaultModel
      const provider = getProvider(model.provider)
      const request: ChatRequest = {
        model,
        messages: buildMessages(messages, options?.systemPrompt),
        stream: true,
      }
      return provider.chatStream(request, onChunk)
    },

    /**
     * Quick helper: single user prompt → response string.
     */
    async ask(
      prompt: string,
      options?: { model?: ModelConfig; systemPrompt?: string }
    ): Promise<string> {
      const response = await this.chat(
        [{ role: "user", content: prompt }],
        options
      )
      return response.content
    },
  }
}

export type AIClient = ReturnType<typeof createAIClient>

import Anthropic from "@anthropic-ai/sdk"
import type {
  AIProvider,
  ChatRequest,
  ChatResponse,
  StreamCallback,
} from "../types"

export function createAnthropicProvider(apiKey?: string): AIProvider {
  const client = new Anthropic({
    apiKey: apiKey ?? process.env.ANTHROPIC_API_KEY,
  })

  return {
    name: "anthropic",

    async chat(request: ChatRequest): Promise<ChatResponse> {
      // Separate system message from conversation messages
      const systemMessage = request.messages.find((m) => m.role === "system")
      const conversationMessages = request.messages.filter(
        (m) => m.role !== "system"
      )

      const response = await client.messages.create({
        model: request.model.model,
        max_tokens: request.model.maxTokens ?? 4096,
        ...(systemMessage ? { system: systemMessage.content } : {}),
        messages: conversationMessages.map((m) => ({
          role: m.role as "user" | "assistant",
          content: m.content,
        })),
        ...(request.model.temperature !== undefined
          ? { temperature: request.model.temperature }
          : {}),
      })

      const textBlock = response.content.find((b) => b.type === "text")

      return {
        content: textBlock?.text ?? "",
        model: response.model,
        provider: "anthropic",
        usage: {
          promptTokens: response.usage.input_tokens,
          completionTokens: response.usage.output_tokens,
          totalTokens:
            response.usage.input_tokens + response.usage.output_tokens,
        },
        finishReason: response.stop_reason ?? "end_turn",
      }
    },

    async chatStream(
      request: ChatRequest,
      onChunk: StreamCallback
    ): Promise<ChatResponse> {
      const systemMessage = request.messages.find((m) => m.role === "system")
      const conversationMessages = request.messages.filter(
        (m) => m.role !== "system"
      )

      const stream = client.messages.stream({
        model: request.model.model,
        max_tokens: request.model.maxTokens ?? 4096,
        ...(systemMessage ? { system: systemMessage.content } : {}),
        messages: conversationMessages.map((m) => ({
          role: m.role as "user" | "assistant",
          content: m.content,
        })),
        ...(request.model.temperature !== undefined
          ? { temperature: request.model.temperature }
          : {}),
      })

      let content = ""

      stream.on("text", (text) => {
        content += text
        onChunk({ content: text, done: false })
      })

      const finalMessage = await stream.finalMessage()

      onChunk({ content: "", done: true })

      return {
        content,
        model: finalMessage.model,
        provider: "anthropic",
        usage: {
          promptTokens: finalMessage.usage.input_tokens,
          completionTokens: finalMessage.usage.output_tokens,
          totalTokens:
            finalMessage.usage.input_tokens +
            finalMessage.usage.output_tokens,
        },
        finishReason: finalMessage.stop_reason ?? "end_turn",
      }
    },
  }
}

import OpenAI from "openai"
import type {
  AIProvider,
  ChatRequest,
  ChatResponse,
  StreamCallback,
} from "../types"

export function createOpenAIProvider(apiKey?: string): AIProvider {
  const client = new OpenAI({
    apiKey: apiKey ?? process.env.OPENAI_API_KEY,
  })

  return {
    name: "openai",

    async chat(request: ChatRequest): Promise<ChatResponse> {
      const response = await client.chat.completions.create({
        model: request.model.model,
        messages: request.messages.map((m) => ({
          role: m.role,
          content: m.content,
        })),
        max_tokens: request.model.maxTokens,
        temperature: request.model.temperature,
      })

      const choice = response.choices[0]

      return {
        content: choice?.message?.content ?? "",
        model: response.model,
        provider: "openai",
        usage: {
          promptTokens: response.usage?.prompt_tokens ?? 0,
          completionTokens: response.usage?.completion_tokens ?? 0,
          totalTokens: response.usage?.total_tokens ?? 0,
        },
        finishReason: choice?.finish_reason ?? "stop",
      }
    },

    async chatStream(
      request: ChatRequest,
      onChunk: StreamCallback
    ): Promise<ChatResponse> {
      const stream = await client.chat.completions.create({
        model: request.model.model,
        messages: request.messages.map((m) => ({
          role: m.role,
          content: m.content,
        })),
        max_tokens: request.model.maxTokens,
        temperature: request.model.temperature,
        stream: true,
      })

      let content = ""
      let finishReason = "stop"

      for await (const chunk of stream) {
        const delta = chunk.choices[0]?.delta?.content ?? ""
        if (delta) {
          content += delta
          onChunk({ content: delta, done: false })
        }
        if (chunk.choices[0]?.finish_reason) {
          finishReason = chunk.choices[0].finish_reason
        }
      }

      onChunk({ content: "", done: true })

      return {
        content,
        model: request.model.model,
        provider: "openai",
        usage: { promptTokens: 0, completionTokens: 0, totalTokens: 0 },
        finishReason,
      }
    },
  }
}

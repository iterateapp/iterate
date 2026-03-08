import { createAIClient, MODELS } from "@iterate/ai"
import type { Message, ModelConfig } from "@iterate/ai"

const SYSTEM_PROMPT = `You are the AI engine inside Iterate, a closed-loop product management platform.
You analyze product data — analytics events, user interviews, support tickets, NPS scores, and experiment results — to surface actionable insights.

When the user asks a question:
1. Cross-reference quantitative metrics (Amplitude events, funnel data) with qualitative signals (interviews, support themes).
2. Identify the root cause with specific data points.
3. Propose a concrete recommendation with expected impact, effort estimate, and success metrics.
4. If approved, break the recommendation into engineering tasks and generate pull requests.

Be precise, cite data sources, and think in terms of measurable outcomes.`

export async function POST(request: Request) {
  const body = await request.json()
  const { messages, model: modelName, stream } = body as {
    messages: Message[]
    model?: string
    stream?: boolean
  }

  if (!messages || messages.length === 0) {
    return Response.json({ error: "messages required" }, { status: 400 })
  }

  const model: ModelConfig =
    modelName && modelName in MODELS
      ? MODELS[modelName as keyof typeof MODELS]
      : MODELS["claude-sonnet-4"]

  const ai = createAIClient({
    defaultModel: model,
    systemPrompt: SYSTEM_PROMPT,
  })

  // ── Streaming response ──────────────────────────────────────────
  if (stream) {
    const encoder = new TextEncoder()
    const readable = new ReadableStream({
      async start(controller) {
        try {
          await ai.chatStream(messages, (chunk) => {
            const data = JSON.stringify(chunk)
            controller.enqueue(encoder.encode(`data: ${data}\n\n`))
            if (chunk.done) {
              controller.enqueue(encoder.encode("data: [DONE]\n\n"))
              controller.close()
            }
          })
        } catch (err) {
          const message =
            err instanceof Error ? err.message : "Internal error"
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({ error: message })}\n\n`
            )
          )
          controller.close()
        }
      },
    })

    return new Response(readable, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    })
  }

  // ── Standard response ───────────────────────────────────────────
  try {
    const response = await ai.chat(messages)
    return Response.json(response)
  } catch (err) {
    const message = err instanceof Error ? err.message : "Internal error"
    return Response.json({ error: message }, { status: 500 })
  }
}

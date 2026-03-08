/**
 * OpenAI LLM Adapter
 *
 * Implements LiveKit llm.LLM for OpenAI ChatCompletion API with streaming.
 * Bridges OpenAI streaming responses into LiveKit's LLMStream format.
 */

import { type APIConnectOptions, DEFAULT_API_CONNECT_OPTIONS, llm } from '@livekit/agents';
import OpenAI from 'openai';

export interface OpenAiLlmConfig {
  apiKey: string;
  model: string;
  temperature?: number;
  maxTokens?: number;
}

/**
 * OpenAI LLM Stream implementation
 */
class OpenAiLlmStream extends llm.LLMStream {
  private readonly client: OpenAI;
  private readonly config: OpenAiLlmConfig;

  constructor(
    llmInstance: llm.LLM,
    client: OpenAI,
    config: OpenAiLlmConfig,
    chatCtx: llm.ChatContext,
    connOptions: APIConnectOptions,
  ) {
    super(llmInstance, { chatCtx, connOptions });
    this.client = client;
    this.config = config;
  }

  protected async run(): Promise<void> {
    const chatCtx = this.chatCtx;
    if (!chatCtx) {
      return;
    }

    try {
      // Convert ChatContext items to OpenAI messages
      const messages = chatCtx.items
        .filter((item): item is llm.ChatMessage => item.type === 'message')
        .map((msg) => ({
          role: msg.role as 'system' | 'user' | 'assistant',
          content: msg.textContent ?? '',
        }));

      const stream = await this.client.chat.completions.create({
        model: this.config.model,
        messages,
        temperature: this.config.temperature,
        max_tokens: this.config.maxTokens,
        stream: true,
      });

      let chunkId = 0;
      for await (const chunk of stream) {
        const delta = chunk.choices[0]?.delta;
        if (delta?.content) {
          this.queue.put({
            id: `chunk-${chunkId++}`,
            delta: {
              role: 'assistant',
              content: delta.content,
            },
          });
        }
      }
    } catch (error) {
      console.error('OpenAI LLM error:', error instanceof Error ? error.message : String(error));
      throw error;
    }
  }
}

/**
 * OpenAI LLM Adapter
 */
export class OpenAiLlmAdapter extends llm.LLM {
  private readonly client: OpenAI;
  private readonly config: OpenAiLlmConfig;

  constructor(config: OpenAiLlmConfig) {
    super();
    this.config = config;
    this.client = new OpenAI({ apiKey: config.apiKey });
  }

  label(): string {
    return 'openai-llm';
  }

  get model(): string {
    return this.config.model;
  }

  chat({
    chatCtx,
    connOptions,
  }: {
    chatCtx: llm.ChatContext;
    toolCtx?: llm.ToolContext;
    connOptions?: APIConnectOptions;
    parallelToolCalls?: boolean;
    toolChoice?: llm.ToolChoice;
    extraKwargs?: Record<string, unknown>;
  }): llm.LLMStream {
    return new OpenAiLlmStream(
      this,
      this.client,
      this.config,
      chatCtx,
      connOptions ?? DEFAULT_API_CONNECT_OPTIONS,
    );
  }
}

/**
 * Factory function to create OpenAI LLM adapter
 */
export function createOpenAiLlmAdapter(config: OpenAiLlmConfig): OpenAiLlmAdapter {
  return new OpenAiLlmAdapter(config);
}

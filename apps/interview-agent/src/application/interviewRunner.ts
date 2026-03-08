/**
 * Interview Runner
 *
 * Orchestrates a voice-based interview session using LiveKit Agents.
 * Parses room metadata, creates STT/TTS/LLM adapters, runs the voice agent,
 * collects transcript, summarizes answers, and saves results to Supabase.
 */

import { voice, JobContext } from '@livekit/agents';
import { VAD } from '@livekit/agents-plugin-silero';
import OpenAI from 'openai';
import {
  parseInterviewConfig,
  stringifyInterviewResults,
  type InterviewAnswer,
  type InterviewConfig,
} from '@iterate/shared';
import { createDbClient } from '@iterate/database';
import { FishTtsAdapter } from '../infrastructure/tts/FishTtsAdapter.js';
import { GoogleSttAdapter } from '../infrastructure/stt/GoogleSttAdapter.js';
import { OpenAiLlmAdapter } from '../infrastructure/llm/OpenAiLlmAdapter.js';
import { env } from '../env.js';

interface RoomMetadata {
  sessionId: string;
}

interface TranscriptEntry {
  role: 'user' | 'assistant';
  text: string;
  timestamp: number;
}

/**
 * Build the system prompt for the interview agent.
 * Instructs the AI to ask questions in order, in Japanese.
 */
function buildSystemPrompt(config: InterviewConfig): string {
  const questionList = config.questions
    .map((q, i) => `${i + 1}. [ID: ${q.id}] ${q.text}`)
    .join('\n');

  return `あなたは優秀なインタビュアーです。「${config.interview.interviewer_name}」として、以下の質問を順番に候補者に質問してください。

インタビュータイトル: ${config.interview.title}

【質問リスト】
${questionList}

【進め方のルール】
- 質問は必ず上記の順番で行ってください。
- 一度に一つの質問だけを行ってください。
- 候補者が回答した後、次の質問に進んでください。
- 候補者の回答に対して短い相槌や確認を入れてから次の質問へ進んでください。
- すべての質問が終わったら、インタビューの終了を丁寧に告げてください。
- 言語は日本語を使用してください。

まず、自己紹介をして最初の質問から始めてください。`;
}

/**
 * Parse Google Cloud credentials from JSON string
 */
function parseGoogleCredentials(): { client_email: string; private_key: string } | undefined {
  try {
    const creds = JSON.parse(env.GOOGLE_CLOUD_CREDENTIALS_JSON) as {
      client_email?: string;
      private_key?: string;
    };
    if (creds.client_email && creds.private_key) {
      return { client_email: creds.client_email, private_key: creds.private_key };
    }
    return undefined;
  } catch (err) {
    throw new Error(`Failed to parse GOOGLE_CLOUD_CREDENTIALS_JSON: ${err instanceof Error ? err.message : String(err)}`);
  }
}

/**
 * Summarize a user's answers for a specific question using GPT-4o.
 */
async function summarizeAnswer(
  openai: OpenAI,
  question: string,
  transcript: string,
): Promise<string> {
  if (!transcript.trim()) {
    return '（回答なし）';
  }

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content:
            '以下のインタビュー回答を200文字以内で要約してください。要点を簡潔にまとめてください。',
        },
        {
          role: 'user',
          content: `質問: ${question}\n\n回答の書き起こし:\n${transcript}`,
        },
      ],
      max_tokens: 300,
      temperature: 0.3,
    });

    return completion.choices[0]?.message?.content?.trim() ?? '（要約失敗）';
  } catch (error) {
    console.error('GPT-4o summarization error:', error instanceof Error ? error.message : String(error));
    return '（要約エラー）';
  }
}

/**
 * Extract user transcript segments that likely answer each question.
 * Groups user messages into answer segments based on question order.
 */
function extractAnswerTranscripts(
  transcript: TranscriptEntry[],
  config: InterviewConfig,
): string[] {
  // Collect all user speech segments
  const userSegments = transcript
    .filter((e) => e.role === 'user')
    .map((e) => e.text);

  // Distribute user segments evenly across questions
  const numQuestions = config.questions.length;
  const segmentsPerQuestion = Math.ceil(userSegments.length / Math.max(numQuestions, 1));

  return config.questions.map((_, i) => {
    const start = i * segmentsPerQuestion;
    const end = start + segmentsPerQuestion;
    return userSegments.slice(start, end).join('\n');
  });
}

/**
 * Main interview runner — called as the LiveKit agent entry point.
 */
export async function runInterview(jobCtx: JobContext): Promise<void> {
  const startTime = Date.now();

  // 1. Parse room metadata to get sessionId and configToml
  const rawMetadata = jobCtx.room.metadata ?? '{}';
  let metadata: RoomMetadata;
  try {
    metadata = JSON.parse(rawMetadata) as RoomMetadata;
  } catch {
    throw new Error(`Invalid room metadata JSON: ${rawMetadata}`);
  }

  const { sessionId } = metadata;
  if (!sessionId) {
    throw new Error('Room metadata must contain sessionId');
  }

  console.log(`[InterviewRunner] Starting session ${sessionId}`);

  // 2. Fetch configToml from Supabase
  const db = createDbClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);
  const sessionRecord = await db.getSession(sessionId);
  if (!sessionRecord) {
    console.error(`[Interview] Session not found: ${sessionId}`);
    return;
  }
  const configToml = sessionRecord.config_toml;

  // 3. Parse TOML config and build system prompt
  const config: InterviewConfig = parseInterviewConfig(configToml);
  const systemPrompt = buildSystemPrompt(config);

  // 4. Create adapters
  const googleCredentials = parseGoogleCredentials();
  const sttAdapter = new GoogleSttAdapter({
    languageCode: config.interview.language ?? 'ja-JP',
    sampleRate: 16000,
    credentials: googleCredentials,
  });

  const ttsAdapter = new FishTtsAdapter({
    apiKey: env.FISH_AUDIO_API_KEY,
    referenceId: env.FISH_AUDIO_REFERENCE_ID,
    model: env.FISH_AUDIO_MODEL,
    sampleRate: 44100,
    latency: 'normal',
    speed: 1.0,
  });

  const llmAdapter = new OpenAiLlmAdapter({
    apiKey: env.OPENAI_API_KEY,
    model: 'gpt-4o',
    temperature: 0.7,
  });

  // 4. Load VAD from silero
  const vad = await VAD.load();

  // 5. Create Agent with the adapters and system prompt
  const agent = new voice.Agent({
    instructions: systemPrompt,
    stt: sttAdapter,
    vad,
    llm: llmAdapter,
    tts: ttsAdapter,
  });

  // 6. Connect to room and wait for participant
  await jobCtx.connect();
  console.log(`[InterviewRunner] Connected to room. Waiting for participant...`);
  await jobCtx.waitForParticipant();
  console.log(`[InterviewRunner] Participant joined.`);

  // 7. Collect transcription entries via session events
  const transcript: TranscriptEntry[] = [];

  // 8. Start the agent session (VAD only — adapters are wired into the Agent, not duplicated here)
  const session = new voice.AgentSession({
    vad,
  });

  // Listen for transcription events before starting
  session.on(
    voice.AgentSessionEventTypes.UserInputTranscribed,
    (ev: voice.UserInputTranscribedEvent) => {
      if (ev.isFinal && ev.transcript.trim()) {
        console.log(`[Transcript/User] ${ev.transcript}`);
        transcript.push({
          role: 'user',
          text: ev.transcript,
          timestamp: Date.now(),
        });
      }
    },
  );

  session.on(
    voice.AgentSessionEventTypes.ConversationItemAdded,
    (ev: voice.ConversationItemAddedEvent) => {
      if (ev.item.role === 'assistant' && ev.item.textContent) {
        console.log(`[Transcript/Agent] ${ev.item.textContent}`);
        transcript.push({
          role: 'assistant',
          text: ev.item.textContent,
          timestamp: Date.now(),
        });
      }
    },
  );

  // 9. Start the agent and wait for session close
  await session.start({ agent, room: jobCtx.room });

  await new Promise<void>((resolve) => {
    session.on(voice.AgentSessionEventTypes.Close, (ev: voice.CloseEvent) => {
      console.log(`[InterviewRunner] Session closed: ${ev.reason}`);
      resolve();
    });
  });

  const durationSeconds = Math.round((Date.now() - startTime) / 1000);
  console.log(`[InterviewRunner] Session ended after ${durationSeconds}s`);

  // 10. Summarize answers using GPT-4o
  const openai = new OpenAI({ apiKey: env.OPENAI_API_KEY });
  const answerTranscripts = extractAnswerTranscripts(transcript, config);

  const answers: InterviewAnswer[] = await Promise.all(
    config.questions.map(async (q, i) => {
      const fullTranscript = answerTranscripts[i] ?? '';
      const answerSummary = await summarizeAnswer(openai, q.text, fullTranscript);
      return {
        question_id: q.id,
        question: q.text,
        answer_summary: answerSummary,
        full_transcript: fullTranscript,
      };
    }),
  );

  // 11. Build results TOML
  const resultToml = stringifyInterviewResults({
    session: {
      session_id: sessionId,
      title: config.interview.title,
      completed_at: new Date().toISOString(),
      duration_seconds: durationSeconds,
    },
    answers,
  });

  // 12. Save to Supabase
  try {
    await db.saveResults(sessionId, resultToml);
    console.log(`[Interview] Results saved for session ${sessionId}`);
  } catch (err) {
    console.error(`[Interview] CRITICAL: Failed to save results for session ${sessionId}:`, err);
    console.error('[Interview] Raw results TOML (for manual recovery):\n', resultToml);
    throw err; // Re-throw so the agent framework logs it as a failed job
  }
}

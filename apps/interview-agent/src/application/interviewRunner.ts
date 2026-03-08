/**
 * Interview Runner — Controllable State Machine
 *
 * Orchestrates a voice-based interview session using an explicit state machine:
 *   GREETING → Q(N)_ASKING → Q(N)_WAITING → [Q(N)_FOLLOW_UP → Q(N)_FOLLOW_UP_WAITING] → ... → CLOSING → DONE
 *
 * GPT-4o-mini is used only for:
 *   1. Deciding whether a follow-up question is needed (yes/no + follow-up text)
 *   2. Summarizing each answer after the interview
 *   3. Overall sentiment classification
 */

import type { JobContext } from '@livekit/agents';
import { voice } from '@livekit/agents';
import { VAD } from '@livekit/agents-plugin-silero';
import { PrismaClient } from '@iterate/db';
import type { AgentJobMetadata, InterviewAnswer, InterviewQuestion } from '@iterate/types';
import OpenAI from 'openai';
import type { GoogleSttConfig } from '../infrastructure/stt/GoogleSttAdapter.js';
import { GoogleSttAdapter } from '../infrastructure/stt/GoogleSttAdapter.js';
import type { FishTtsConfig } from '../infrastructure/tts/FishTtsAdapter.js';
import { FishTtsAdapter } from '../infrastructure/tts/FishTtsAdapter.js';
import type { OpenAiLlmConfig } from '../infrastructure/llm/OpenAiLlmAdapter.js';
import { OpenAiLlmAdapter } from '../infrastructure/llm/OpenAiLlmAdapter.js';
import { env } from '../env.js';

const prisma = new PrismaClient();

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** Per-question transcript collected during the interview */
interface QuestionTranscript {
  question: InterviewQuestion;
  agentUtterances: string[];
  userUtterances: string[];
  followUpCount: number;
}

// ---------------------------------------------------------------------------
// Metadata parsing
// ---------------------------------------------------------------------------

function parseJobMetadata(jobCtx: JobContext): AgentJobMetadata {
  const raw = jobCtx.room.metadata ?? '{}';
  let meta: AgentJobMetadata;
  try {
    meta = JSON.parse(raw) as AgentJobMetadata;
  } catch {
    throw new Error('[Interview] Failed to parse room metadata');
  }
  if (!meta.interviewId || !Array.isArray(meta.questions)) {
    throw new Error('[Interview] Invalid metadata: missing interviewId or questions');
  }
  return meta;
}

// ---------------------------------------------------------------------------
// System prompt builders
// ---------------------------------------------------------------------------

function buildSystemPrompt(
  meta: AgentJobMetadata,
  currentQuestion: InterviewQuestion | null,
  phase: 'greeting' | 'question' | 'follow_up' | 'closing',
): string {
  if (phase === 'greeting') {
    return `You are a professional user research interviewer.
Start the interview with a brief self-introduction and explanation of today's interview purpose.
The interview consists of ${meta.questions.length} questions.
Language: English
Interviewer name: ${meta.interviewerName}
Only give the initial greeting, do not ask any questions yet.`;
  }

  if (phase === 'closing') {
    return `The interview is complete. Thank the participant warmly and close the interview.`;
  }

  if (phase === 'follow_up') {
    return `You are a professional user research interviewer.
Original question: "${currentQuestion?.text}"
Language: English
Ask only ONE concise follow-up question to dig deeper into the user's response. Then listen.`;
  }

  return `You are a professional user research interviewer conducting an interview.
Current question: "${currentQuestion?.text}"
Language: English
Interviewer name: ${meta.interviewerName}
Your role is to listen actively to the user's response. Do NOT ask follow-up questions on your own.`;
}

// ---------------------------------------------------------------------------
// GPT-4o-mini helpers
// ---------------------------------------------------------------------------

/**
 * Decide whether a follow-up question is warranted.
 * Returns the follow-up question text, or null if the answer is sufficient.
 */
async function decideFollowUp(
  openai: OpenAI,
  question: InterviewQuestion,
  userResponse: string,
): Promise<string | null> {
  if (!userResponse.trim() || userResponse.length < 10) return null;

  const res = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      {
        role: 'user',
        content: `In a user research interview, the following response was given.\n\nQuestion: ${question.text}\nAnswer: ${userResponse}\n\nIs this answer sufficiently detailed? If more probing is needed, generate one specific follow-up question. If it is sufficient, reply with only "SUFFICIENT".`,
      },
    ],
    max_tokens: 150,
  });

  const answer = res.choices[0]?.message.content?.trim() ?? 'SUFFICIENT';
  if (answer === 'SUFFICIENT' || answer.startsWith('SUFFICIENT')) return null;
  return answer;
}

/**
 * Summarize the user's utterances for one question into a concise Japanese summary.
 */
async function summarizeAnswer(openai: OpenAI, qt: QuestionTranscript): Promise<string> {
  const userText = qt.userUtterances.join(' ');
  if (!userText.trim()) return 'No answer provided';

  const res = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      {
        role: 'user',
        content: `Summarize the following user interview response concisely in 150 words or fewer.\n\nQuestion: ${qt.question.text}\nAnswer: ${userText}\n\nSummary:`,
      },
    ],
    max_tokens: 200,
  });

  return res.choices[0]?.message.content?.trim() ?? userText.slice(0, 150);
}

/**
 * Build a readable transcript string interleaving agent and user utterances.
 */
function buildFullTranscript(qt: QuestionTranscript): string {
  const lines: string[] = [];
  const maxLen = Math.max(qt.agentUtterances.length, qt.userUtterances.length);
  for (let i = 0; i < maxLen; i++) {
    if (qt.agentUtterances[i]) lines.push(`Agent: ${qt.agentUtterances[i]}`);
    if (qt.userUtterances[i]) lines.push(`User: ${qt.userUtterances[i]}`);
  }
  return lines.join('\n');
}

// ---------------------------------------------------------------------------
// Main entry point
// ---------------------------------------------------------------------------

/**
 * Main interview runner — called as the LiveKit agent entry point.
 *
 * Uses an explicit state machine rather than relying on the LLM to advance
 * through questions autonomously.
 */
export async function runInterview(jobCtx: JobContext): Promise<void> {
  const openai = new OpenAI({ apiKey: env.OPENAI_API_KEY });

  // --- Build adapters ---
  let googleCredentials: { client_email: string; private_key: string } | undefined;
  try {
    googleCredentials = JSON.parse(env.GOOGLE_CLOUD_CREDENTIALS_JSON) as {
      client_email: string;
      private_key: string;
    };
  } catch (err) {
    throw new Error(
      `Failed to parse GOOGLE_CLOUD_CREDENTIALS_JSON: ${err instanceof Error ? err.message : String(err)}`,
    );
  }

  const vad = await VAD.load();
  const startTime = Date.now();

  // State machine bookkeeping
  let currentQuestionIndex = -1; // -1 = greeting/closing phase
  let waitingForUser = false;

  // --- Connect and wait for participant ---
  // NOTE: room.metadata is only populated AFTER connect(), so parseJobMetadata must come after.
  await jobCtx.connect();
  const meta = parseJobMetadata(jobCtx);
  const participant = await jobCtx.waitForParticipant();

  const sttConfig: GoogleSttConfig = {
    languageCode: meta.language === 'en' ? 'en-US' : meta.language,
    sampleRate: 16000,
    credentials: googleCredentials,
  };
  const stt = new GoogleSttAdapter(sttConfig);

  const ttsConfig: FishTtsConfig = {
    apiKey: env.FISH_AUDIO_API_KEY,
    referenceId: env.FISH_AUDIO_REFERENCE_ID,
    model: env.FISH_AUDIO_MODEL,
    sampleRate: 24000,
    latency: 'balanced',
    speed: 1.0,
  };
  const tts = new FishTtsAdapter(ttsConfig);

  const llmConfig: OpenAiLlmConfig = {
    apiKey: env.OPENAI_API_KEY,
    model: 'gpt-4o',
    temperature: 0.7,
  };
  const llm = new OpenAiLlmAdapter(llmConfig);

  // --- Per-question transcript storage ---
  const questionTranscripts: QuestionTranscript[] = meta.questions.map((q) => ({
    question: q,
    agentUtterances: [],
    userUtterances: [],
    followUpCount: 0,
  }));
  console.log(`[Interview] Participant joined: ${participant.identity}`);

  // --- Create initial agent (greeting phase) ---
  const createAgent = (phase: 'greeting' | 'question' | 'follow_up' | 'closing', qIndex: number) =>
    new voice.Agent({
      instructions: buildSystemPrompt(
        meta,
        qIndex >= 0 ? meta.questions[qIndex] ?? null : null,
        phase,
      ),
      stt,
      vad,
      llm,
      tts,
    });

  const session = new voice.AgentSession({ vad });

  // --- Event listeners ---
  session.on(
    voice.AgentSessionEventTypes.ConversationItemAdded,
    (ev: voice.ConversationItemAddedEvent) => {
      const text = ev.item.textContent ?? '';
      if (!text) return;

      if (ev.item.role === 'assistant') {
        if (currentQuestionIndex >= 0 && currentQuestionIndex < questionTranscripts.length) {
          questionTranscripts[currentQuestionIndex].agentUtterances.push(text);
        }
        console.log(`[Transcript/Agent] ${text}`);
      }
    },
  );

  session.on(
    voice.AgentSessionEventTypes.UserInputTranscribed,
    (ev: voice.UserInputTranscribedEvent) => {
      if (!ev.isFinal || !ev.transcript.trim()) return;
      console.log(`[Transcript/User] ${ev.transcript}`);

      if (waitingForUser && currentQuestionIndex >= 0 && currentQuestionIndex < questionTranscripts.length) {
        questionTranscripts[currentQuestionIndex].userUtterances.push(ev.transcript.trim());
      }
    },
  );

  // --- Start agent session ---
  await session.start({ agent: createAgent('greeting', -1), room: jobCtx.room });

  // --- Helpers ---
  const waitMs = (ms: number): Promise<void> => new Promise((r) => setTimeout(r, ms));

  /**
   * Ask the agent to say something explicitly and wait for it to finish playing.
   */
  const agentSay = async (text: string): Promise<void> => {
    const handle = session.say(text, { allowInterruptions: false, addToChatCtx: true });
    await handle.waitForPlayout();
  };

  /**
   * Listen for user utterances for up to `listenMs` milliseconds.
   * Returns the concatenated final transcript segments received during that window.
   */
  const collectResponse = async (listenMs = 15000): Promise<string> => {
    waitingForUser = true;
    await waitMs(listenMs);
    waitingForUser = false;

    if (currentQuestionIndex >= 0 && currentQuestionIndex < questionTranscripts.length) {
      return questionTranscripts[currentQuestionIndex].userUtterances
        .slice(-10) // only consider recently added utterances — accumulate per-question
        .join(' ')
        .trim();
    }
    return '';
  };

  // ===========================================================================
  // State machine
  // ===========================================================================

  // ---- Phase 1: GREETING ----
  console.log('[Interview] Phase: GREETING');
  // The agent auto-generates a greeting based on system instructions on start.
  // Give it time to finish greeting before moving to questions.
  await waitMs(8000);

  // ---- Phase 2: QUESTIONS ----
  for (let i = 0; i < meta.questions.length; i++) {
    currentQuestionIndex = i;
    const qt = questionTranscripts[i];
    const questionNumber = i + 1;
    console.log(`[Interview] Phase: QUESTION ${questionNumber}/${meta.questions.length} — ${qt.question.text}`);

    // Switch agent to question-phase instructions
    session.updateAgent(createAgent('question', i));

    // Ask the question explicitly via session.say()
    await agentSay(qt.question.text);
    await waitMs(500);

    // Listen for user response (up to 30s)
    const userResponse = await collectResponse(30000);
    console.log(`[Interview] Q${questionNumber} user response (${userResponse.length} chars)`);

    // Optionally run one follow-up (max 1 per question)
    if (userResponse.length > 0) {
      const followUpText = await decideFollowUp(openai, qt.question, userResponse);
      if (followUpText) {
        qt.followUpCount++;
        console.log(`[Interview] Phase: QUESTION ${questionNumber} FOLLOW-UP`);
        session.updateAgent(createAgent('follow_up', i));

        await agentSay(followUpText);
        await waitMs(500);
        await collectResponse(20000);
      }
    }
  }

  // ---- Phase 3: CLOSING ----
  currentQuestionIndex = -1;
  console.log('[Interview] Phase: CLOSING');
  session.updateAgent(createAgent('closing', -1));
  await agentSay(
    'That concludes all of our questions. Thank you so much for your time today.',
  );
  await waitMs(3000);

  const durationSec = Math.round((Date.now() - startTime) / 1000);
  console.log(`[Interview] Session ended after ${durationSec}s`);

  // ---- Close session ----
  await session.close();

  // ===========================================================================
  // Post-processing: summarize answers and save to DB
  // ===========================================================================

  const answers: InterviewAnswer[] = await Promise.all(
    questionTranscripts.map(async (qt) => ({
      questionId: qt.question.id,
      question: qt.question.text,
      answerSummary: await summarizeAnswer(openai, qt),
      fullTranscript: buildFullTranscript(qt),
      followUpCount: qt.followUpCount,
    })),
  );

  // Overall sentiment based on all answer summaries
  const allText = answers.map((a) => a.answerSummary).join(' ');
  const sentimentRes = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      {
        role: 'user',
        content: `Classify the overall sentiment of the following interview responses as exactly one word: "positive", "neutral", or "negative".\n${allText}`,
      },
    ],
    max_tokens: 10,
  });
  const sentiment = sentimentRes.choices[0]?.message.content?.trim() ?? 'neutral';

  // Save to database
  try {
    await prisma.interviewResponse.create({
      data: {
        interviewId: meta.interviewId,
        respondentId: participant.identity,
        answers: answers as object[],
        sentiment,
        durationSec,
      },
    });

    await prisma.interview.update({
      where: { id: meta.interviewId },
      data: {
        responseCount: { increment: 1 },
        status: 'COMPLETED',
      },
    });

    console.log(`[Interview] Saved InterviewResponse for interview ${meta.interviewId}`);
  } catch (err) {
    console.error(`[Interview] CRITICAL: Failed to save results for ${meta.interviewId}:`, err);
    console.error('[Interview] Raw answers (for manual recovery):', JSON.stringify(answers, null, 2));
    throw err;
  }
}

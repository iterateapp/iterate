# AI Interview App — Design Document

Date: 2026-03-08

## Overview

Phase 2 (Research) of the Iterate product loop. A web-based AI voice interview app where an AI agent conducts user interviews based on questions generated from an Insight. Users access the interview via a unique URL. No authentication required for interviewees.

## System Context

![AIインタビューシステム構成](../images/interview-system.png)

```
Phase 1: Discovery
  Connection(Amplitude) → Insight (status: detected → investigating → resolved)
                               │
                               │ insightId
                               ▼
Phase 2: Research (this app)
  Interview (linked to Insight)
    → Users access /interview/[interviewId]
    → AI voice interview via LiveKit
    → InterviewResponse × N
    → Recommendation (定量 + 定性を統合)
                               │
                               │ recommendationId
                               ▼
Phase 3: PRD (別サービス)
  PRD ← Recommendation
    → Task → Linear → Symphony → GitHub PR
```

## Architecture

### Monorepo Structure

```
apps/
  web/                                        # Next.js (existing)
    app/interview/[interviewId]/
      page.tsx                                # Public interview page
      loading.tsx
    app/api/interview/join/route.ts           # POST: create LiveKit room, return token
  interview-agent/                            # Node.js LiveKit agent worker
    src/
      index.ts                                # Hono HTTP server (health + dispatch)
      agent.ts                                # LiveKit agent entry point
      infrastructure/
        tts/FishAudioTtsAdapter.ts            # Fish Audio custom TTS adapter
        stt/GoogleCloudSttAdapter.ts          # Google Cloud STT adapter
        llm/OpenAiAdapter.ts                  # OpenAI GPT-4o adapter
      application/
        interviewRunner.ts                    # Question loop orchestration
packages/
  db/                                         # Prismaスキーマ・クライアント・マイグレーション
  types/                                      # 共通型定義
```

### Request Flow

1. Interviewee opens `/interview/[interviewId]`
2. Next.js fetches Interview from DB → validates (exists, not expired, status: pending/in_progress)
3. User clicks "インタビューを開始" → POST `/api/interview/join` with `interviewId`
4. API route:
   - Reads Interview (including questions) from DB
   - Creates LiveKit room with `interviewId` as room name
   - Embeds questions JSON as room metadata
   - Updates Interview status to `in_progress`
   - Returns `{ livekitUrl, accessToken }`
5. Frontend connects to LiveKit room via `livekit-client`
6. LiveKit dispatches job to `interview-agent` worker
7. Agent parses questions from job metadata
8. Agent conducts interview: question loop using Google STT → GPT-4o → Fish Audio TTS
9. On completion: agent saves InterviewResponse records to DB, updates Interview status to `completed`

## Database Schema

```sql
-- Prisma schema (packages/db/schema.prisma)

model Interview {
  id            String    @id @default(cuid())
  insightId     String
  insight       Insight   @relation(fields: [insightId], references: [id])
  status        InterviewStatus @default(PENDING)
  targetCount   Int
  sentCount     Int        @default(0)
  responseCount Int        @default(0)
  questions     Json       -- [{ id, text }]
  expiresAt     DateTime
  createdAt     DateTime   @default(now())
  responses     InterviewResponse[]
}

enum InterviewStatus {
  PENDING
  IN_PROGRESS
  COMPLETED
  EXPIRED
}

model InterviewResponse {
  id            String    @id @default(cuid())
  interviewId   String
  interview     Interview @relation(fields: [interviewId], references: [id])
  respondentId  String    -- user ID or anonymous ID
  answers       Json      -- [{ questionId, question, answerSummary, fullTranscript }]
  sentiment     String?
  durationSec   Int?
  createdAt     DateTime  @default(now())
}
```

## Agent Internal Format

インタビューエージェント内部でのみ使用するデータ構造（DBとの変換はAPI route側で行う）。

### Questions (LiveKit room metadata として渡す)

```json
{
  "interviewId": "clxxx",
  "language": "ja",
  "interviewerName": "AIインタビュアー",
  "questions": [
    { "id": "q1", "text": "現在の○○機能をどのように使っていますか？" },
    { "id": "q2", "text": "特に困っている点や改善してほしい点はありますか？" }
  ]
}
```

### Answer (InterviewResponse.answers の各要素)

```json
{
  "questionId": "q1",
  "question": "現在の○○機能をどのように使っていますか？",
  "answerSummary": "週次レポート作成時に主に使用。データエクスポート機能を活用。",
  "fullTranscript": "Agent: 現在の...\nUser: 主に週次レポートを..."
}
```

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 15 (apps/web) |
| Real-time audio | LiveKit Cloud |
| Agent framework | @livekit/agents (Node.js) |
| LLM | OpenAI GPT-4o |
| STT | Google Cloud Speech-to-Text |
| TTS | Fish Audio (custom adapter) |
| Database | PostgreSQL (Supabase) + Prisma |
| Package manager | pnpm workspaces |

## Interview Agent Logic

```
on_job_start:
  1. Parse questions from room metadata
  2. Greet interviewee ("本日はよろしくお願いします。〜についていくつかお聞きします。")
  3. for each question in questions:
       a. Ask question via TTS
       b. Listen for response (Google STT, with silence detection to detect end-of-answer)
       c. Append to transcript
       d. Optional: GPT-4o decides if follow-up needed (1 follow-up max per question)
  4. Close interview ("以上で終了です。ありがとうございました。")
  5. Disconnect from room

on_disconnect:
  1. Build answers array from collected transcripts
  2. POST to Next.js API → save InterviewResponse to DB
  3. Update Interview status to 'completed', increment responseCount
```

## Frontend UI States

- `loading`: セッション情報取得中
- `invalid`: Interview無効（期限切れ or 存在しない）
- `completed`: インタビュー済み
- `idle`: 開始ボタン表示
- `connecting`: LiveKit接続中
- `interviewing`: インタビュー中（transcript表示 + ミュートボタン）
- `ended`: 完了メッセージ

## Fish Audio TTS Adapter

Fish Audio REST API (`https://api.fish.audio/v1/tts`) を使用。
voiceagent-v3 の `ElevenLabsTtsAdapter` と同パターンで実装：
- streaming audio chunks via ReadableStream
- voice model ID: configurable via env var `FISH_AUDIO_VOICE_ID`

## Environment Variables

### apps/web
```
NEXT_PUBLIC_LIVEKIT_URL=
DATABASE_URL=
LIVEKIT_API_KEY=
LIVEKIT_API_SECRET=
```

### apps/interview-agent
```
LIVEKIT_URL=
LIVEKIT_API_KEY=
LIVEKIT_API_SECRET=
OPENAI_API_KEY=
GOOGLE_CLOUD_CREDENTIALS=   # JSON keyfile path or content
FISH_AUDIO_API_KEY=
FISH_AUDIO_VOICE_ID=
DATABASE_URL=
PORT=4444
```

## Parallel Implementation Tasks

Independent tasks that can be implemented in parallel:

1. **packages/db** — Prismaスキーマ定義・マイグレーション（Interview, InterviewResponse）
2. **packages/types** — 共通型定義
3. **Next.js interview page** — UI, Interview fetch, LiveKit connection
4. **Next.js API route** — `/api/interview/join`, LiveKit room creation
5. **interview-agent skeleton** — Agent worker, Hono health server
6. **Fish Audio TTS adapter** — Custom TTS implementation
7. **Google Cloud STT adapter** — Custom STT implementation
8. **Interview runner** — Question loop orchestration logic

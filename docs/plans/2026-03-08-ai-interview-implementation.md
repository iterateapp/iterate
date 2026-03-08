# AI Interview App Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** URLアクセスで使えるAI音声インタビューWebアプリ（LiveKit + OpenAI + Google STT + Fish Audio TTS）

**Architecture:** Next.js（interview UI + API route）+ Node.js LiveKit エージェントワーカー（apps/interview-agent）の2プロセス構成。InterviewIDのURLからDB（Prisma）のInterview設定を取得し、LiveKitでリアルタイム音声インタビューを実施、結果をInterviewResponseとしてDBに保存。

**Tech Stack:** Next.js 15, @livekit/agents (Node.js), livekit-client, OpenAI GPT-4o, Google Cloud STT, Fish Audio TTS (WebSocket), PostgreSQL + Prisma, pnpm workspaces, Turbo

**Reference implementations to copy from:** `~/interx/voiceagent-v3/apps/agent-runtime/src/infrastructure/tts/FishTtsAdapter.ts`, `GoogleSttAdapter.ts`, `OpenAiLlmAdapter.ts`

---

## Parallel Execution Map

```
Group A (start immediately, parallel):
  Task 1: packages/types        ← DB entity types (Interview, InterviewResponse, etc.)
  Task 2: packages/db           ← Prisma schema + client + migration

Group B (after A, parallel):
  Task 3: interview-agent skeleton  ← package.json, tsconfig, Hono server
  Task 4: web interview UI          ← Next.js page component
  Task 5: web API route             ← /api/interview/join

Group C (after Task 3, parallel):
  Task 6: Fish Audio TTS adapter    ← copy from voiceagent-v3
  Task 7: Google Cloud STT adapter  ← copy from voiceagent-v3
  Task 8: OpenAI LLM adapter        ← copy from voiceagent-v3

Group D (after C, sequential):
  Task 9: Interview runner          ← question loop + transcript collection
  Task 10: Wire agent entry point   ← connect all pieces

Group E (after all):
  Task 11: Local integration test   ← end-to-end smoke test
```

---

## Task 1: packages/types — DB entity type definitions

**Files:**
- Create: `packages/types/package.json`
- Create: `packages/types/tsconfig.json`
- Create: `packages/types/src/index.ts`
- Create: `packages/types/src/interview.ts`

**Step 1: Create package.json**

```json
// packages/types/package.json
{
  "name": "@iterate/types",
  "version": "0.0.1",
  "private": true,
  "type": "module",
  "main": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "exports": {
    ".": {
      "import": "./dist/index.js",
      "types": "./dist/index.d.ts"
    }
  },
  "scripts": {
    "build": "tsc",
    "dev": "tsc --watch",
    "typecheck": "tsc --noEmit"
  },
  "devDependencies": {
    "typescript": "^5"
  }
}
```

**Step 2: Create tsconfig.json**

```json
// packages/types/tsconfig.json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "outDir": "./dist",
    "rootDir": "./src",
    "declaration": true,
    "strict": true,
    "esModuleInterop": true
  },
  "include": ["src"]
}
```

**Step 3: Create type definitions**

```typescript
// packages/types/src/interview.ts

// LiveKit room metadata (agent-internal, JSON)
export interface AgentJobMetadata {
  interviewId: string;
  language: string;
  interviewerName: string;
  questions: InterviewQuestion[];
}

export interface InterviewQuestion {
  id: string;
  text: string;
}

// InterviewResponse.answers の各要素
export interface InterviewAnswer {
  questionId: string;
  question: string;
  answerSummary: string;
  fullTranscript: string;
}
```

**Step 4: Create index.ts**

```typescript
// packages/types/src/index.ts
export * from './interview.js';
```

**Step 5: Install and build**

```bash
cd /Users/kazu42/dev/iterate
pnpm install
cd packages/types && pnpm build
```

Expected: `dist/` directory created with compiled JS and type declarations.

**Step 6: Commit**

```bash
git add packages/types
git commit -m "feat: add types package with interview entity types"
```

---

## Task 2: packages/db — Prisma schema + client + migration

**Files:**
- Create: `packages/db/package.json`
- Create: `packages/db/tsconfig.json`
- Create: `packages/db/prisma/schema.prisma`
- Create: `packages/db/src/index.ts`

**Step 1: Create package.json**

```json
// packages/db/package.json
{
  "name": "@iterate/db",
  "version": "0.0.1",
  "private": true,
  "main": "./src/index.ts",
  "scripts": {
    "db:generate": "prisma generate",
    "db:migrate": "prisma migrate dev",
    "db:push": "prisma db push"
  },
  "dependencies": {
    "@prisma/client": "^6"
  },
  "devDependencies": {
    "prisma": "^6",
    "typescript": "^5"
  }
}
```

**Step 2: Create Prisma schema**

```prisma
// packages/db/prisma/schema.prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model Interview {
  id            String          @id @default(cuid())
  insightId     String
  status        InterviewStatus @default(PENDING)
  targetCount   Int
  sentCount     Int             @default(0)
  responseCount Int             @default(0)
  questions     Json            // [{ id, text }]
  expiresAt     DateTime
  createdAt     DateTime        @default(now())
  responses     InterviewResponse[]
}

enum InterviewStatus {
  PENDING
  IN_PROGRESS
  COMPLETED
  EXPIRED
}

model InterviewResponse {
  id           String    @id @default(cuid())
  interviewId  String
  interview    Interview @relation(fields: [interviewId], references: [id])
  respondentId String
  answers      Json      // [{ questionId, question, answerSummary, fullTranscript }]
  sentiment    String?
  durationSec  Int?
  createdAt    DateTime  @default(now())
}
```

**Step 3: Create Prisma client export**

```typescript
// packages/db/src/index.ts
export { PrismaClient } from '@prisma/client';
export type { Interview, InterviewResponse, InterviewStatus } from '@prisma/client';
```

**Step 4: Generate client and migrate**

```bash
cd /Users/kazu42/dev/iterate/packages/db
pnpm db:generate
pnpm db:migrate --name init_interview
```

Expected: Prisma client generated, migration applied to DB.

**Step 5: Commit**

```bash
git add packages/db
git commit -m "feat: add db package with Prisma schema for Interview entities"
```

---

```bash
cd /Users/kazu42/dev/iterate
pnpm install
cd packages/database && pnpm build
```

**Step 7: Commit**

```bash
git add packages/database
git commit -m "feat: add database package with Supabase client and migration"
```

---

## Task 3: apps/interview-agent — Skeleton

**Files:**
- Create: `apps/interview-agent/package.json`
- Create: `apps/interview-agent/tsconfig.json`
- Create: `apps/interview-agent/.env.example`
- Create: `apps/interview-agent/src/index.ts`
- Create: `apps/interview-agent/src/env.ts`

**Step 1: Create package.json**

```json
// apps/interview-agent/package.json
{
  "name": "interview-agent",
  "version": "0.0.1",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "tsx watch src/index.ts",
    "dev:agent": "tsx src/agent.ts dev",
    "build": "tsc",
    "start": "node dist/index.js",
    "start:agent": "node dist/agent.js dev",
    "typecheck": "tsc --noEmit"
  },
  "dependencies": {
    "@google-cloud/speech": "^6.7.0",
    "@hono/node-server": "^1.13.0",
    "@iterate/db": "workspace:*",
    "@iterate/types": "workspace:*",
    "@livekit/agents": "^1.0.44",
    "@livekit/agents-plugin-livekit": "^1.0.48",
    "@livekit/agents-plugin-silero": "^1.0.44",
    "@livekit/rtc-node": "^0.13.24",
    "hono": "^4",
    "msgpackr": "^1.11.2",
    "openai": "^4",
    "ws": "^8"
  },
  "devDependencies": {
    "@types/node": "^20",
    "@types/ws": "^8",
    "tsx": "^4",
    "typescript": "^5"
  }
}
```

**Step 2: Create tsconfig.json**

```json
// apps/interview-agent/tsconfig.json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "outDir": "./dist",
    "rootDir": "./src",
    "declaration": true,
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true
  },
  "include": ["src"]
}
```

**Step 3: Create env.ts**

```typescript
// apps/interview-agent/src/env.ts
function required(key: string): string {
  const val = process.env[key];
  if (!val) throw new Error(`Missing required env var: ${key}`);
  return val;
}

export const env = {
  PORT: Number(process.env.PORT ?? 4444),
  LIVEKIT_URL: required('LIVEKIT_URL'),
  LIVEKIT_API_KEY: required('LIVEKIT_API_KEY'),
  LIVEKIT_API_SECRET: required('LIVEKIT_API_SECRET'),
  OPENAI_API_KEY: required('OPENAI_API_KEY'),
  GOOGLE_CLOUD_CREDENTIALS_JSON: required('GOOGLE_CLOUD_CREDENTIALS_JSON'),
  FISH_AUDIO_API_KEY: required('FISH_AUDIO_API_KEY'),
  FISH_AUDIO_REFERENCE_ID: process.env.FISH_AUDIO_REFERENCE_ID ?? '',
  FISH_AUDIO_MODEL: process.env.FISH_AUDIO_MODEL ?? 'speech-1.5',
  DATABASE_URL: required('DATABASE_URL'),
};
```

**Step 4: Create Hono health server (src/index.ts)**

```typescript
// apps/interview-agent/src/index.ts
import { serve } from '@hono/node-server';
import { Hono } from 'hono';
import { env } from './env.js';

const app = new Hono();

app.get('/health', (c) => c.json({ status: 'ok', service: 'interview-agent' }));

serve({ fetch: app.fetch, port: env.PORT }, () => {
  console.log(`Interview agent HTTP server listening on port ${env.PORT}`);
  console.log('Start the LiveKit agent worker with: pnpm dev:agent');
});
```

**Step 5: Create .env.example**

```bash
# apps/interview-agent/.env.example
LIVEKIT_URL=wss://your-livekit-server.livekit.cloud
LIVEKIT_API_KEY=your-api-key
LIVEKIT_API_SECRET=your-api-secret
OPENAI_API_KEY=sk-...
GOOGLE_CLOUD_CREDENTIALS_JSON={"type":"service_account",...}
FISH_AUDIO_API_KEY=your-fish-audio-key
FISH_AUDIO_REFERENCE_ID=your-voice-model-id
FISH_AUDIO_MODEL=speech-1.5
DATABASE_URL=postgresql://user:password@localhost:5432/iterate
PORT=4444
```

**Step 6: Install and verify**

```bash
cd /Users/kazu42/dev/iterate
pnpm install
cd apps/interview-agent && pnpm typecheck
```

Expected: No TypeScript errors.

**Step 7: Commit**

```bash
git add apps/interview-agent
git commit -m "feat: add interview-agent app skeleton with Hono health server"
```

---

## Task 4: apps/web — Interview UI page

**Files:**
- Modify: `apps/web/package.json` (add deps)
- Create: `apps/web/app/interview/[sessionId]/page.tsx`
- Create: `apps/web/app/interview/[sessionId]/InterviewRoom.tsx`
- Create: `apps/web/app/interview/[sessionId]/useInterviewCall.ts`

**Step 1: Add dependencies to apps/web/package.json**

Edit `apps/web/package.json` — add to `dependencies`:
```json
"@iterate/db": "workspace:*",
"@iterate/types": "workspace:*",
"livekit-client": "^2",
"lucide-react": "^0.469.0"
```

**Step 2: Create server page (session validation)**

```typescript
// apps/web/app/interview/[sessionId]/page.tsx
import { notFound } from 'next/navigation';
import { PrismaClient } from '@iterate/db';
import { InterviewRoom } from './InterviewRoom';

const prisma = new PrismaClient();

interface Props {
  params: Promise<{ interviewId: string }>;
}

export default async function InterviewPage({ params }: Props) {
  const { interviewId } = await params;

  const interview = await prisma.interview.findUnique({
    where: { id: interviewId },
  });

  if (!interview) return notFound();

  if (interview.status === 'EXPIRED') {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-gray-500">このインタビューの有効期限が切れています。</p>
      </div>
    );
  }

  if (interview.status === 'COMPLETED') {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-gray-500">このインタビューはすでに完了しています。ありがとうございました。</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-gray-50">
      <header className="border-b bg-white px-6 py-4">
        <h1 className="text-lg font-semibold text-gray-900">ユーザーインタビュー</h1>
      </header>
      <main className="flex flex-1 items-center justify-center p-6">
        <InterviewRoom interviewId={interviewId} />
      </main>
    </div>
  );
}
```

**Step 3: Create useInterviewCall hook**

```typescript
// apps/web/app/interview/[sessionId]/useInterviewCall.ts
'use client';

import {
  ConnectionState,
  type RemoteParticipant,
  type RemoteTrackPublication,
  Room,
  RoomEvent,
  Track,
  type Participant,
  type TrackPublication,
  type TranscriptionSegment,
} from 'livekit-client';
import { useCallback, useEffect, useRef, useState } from 'react';

export type CallState = 'idle' | 'connecting' | 'connected' | 'ended' | 'error';

export interface TranscriptEntry {
  id: string;
  speaker: 'user' | 'agent';
  text: string;
  isFinal: boolean;
}

export function useInterviewCall(sessionId: string) {
  const [callState, setCallState] = useState<CallState>('idle');
  const [isMuted, setIsMuted] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [error, setError] = useState('');
  const [transcript, setTranscript] = useState<TranscriptEntry[]>([]);

  const roomRef = useRef<Room | null>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (callState === 'connected') {
      timerRef.current = setInterval(() => setElapsed((e) => e + 1), 1000);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [callState]);

  useEffect(() => () => { roomRef.current?.disconnect(); }, []);

  const handleTrackSubscribed = useCallback(
    (track: RemoteTrackPublication['track'], _pub: RemoteTrackPublication, _p: RemoteParticipant) => {
      if (track?.kind === Track.Kind.Audio && audioRef.current) {
        track.attach(audioRef.current);
      }
    },
    [],
  );

  const handleTranscription = useCallback(
    (segments: TranscriptionSegment[], participant?: Participant, _pub?: TrackPublication) => {
      setTranscript((prev) => {
        const updated = [...prev];
        for (const seg of segments) {
          if (!seg.text) continue;
          const isUser = participant?.identity === roomRef.current?.localParticipant?.identity;
          const entry: TranscriptEntry = {
            id: seg.id,
            speaker: isUser ? 'user' : 'agent',
            text: seg.text,
            isFinal: seg.final,
          };
          const idx = updated.findIndex((e) => e.id === seg.id);
          if (idx >= 0) updated[idx] = entry;
          else updated.push(entry);
        }
        return updated;
      });
    },
    [],
  );

  const startCall = async () => {
    setCallState('connecting');
    setError('');
    setElapsed(0);
    setTranscript([]);

    try {
      const res = await fetch('/api/interview/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId }),
      });

      if (!res.ok) {
        const body = await res.json();
        throw new Error(body.error ?? 'Failed to join interview');
      }

      const { livekitUrl, accessToken } = await res.json();

      const room = new Room({ adaptiveStream: true, dynacast: true });
      roomRef.current = room;

      room.on(RoomEvent.TrackSubscribed, handleTrackSubscribed);
      room.on(RoomEvent.TranscriptionReceived, handleTranscription);
      room.on(RoomEvent.ConnectionStateChanged, (state: ConnectionState) => {
        if (state === ConnectionState.Connected) setCallState('connected');
        else if (state === ConnectionState.Disconnected) setCallState('ended');
      });
      room.on(RoomEvent.Disconnected, () => setCallState('ended'));

      await room.connect(livekitUrl, accessToken);
      await room.localParticipant.setMicrophoneEnabled(true);
      setCallState('connected');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      setCallState('error');
    }
  };

  const endCall = () => {
    roomRef.current?.disconnect();
    roomRef.current = null;
    setCallState('ended');
  };

  const toggleMute = async () => {
    const room = roomRef.current;
    if (!room) return;
    const newMuted = !isMuted;
    await room.localParticipant.setMicrophoneEnabled(!newMuted);
    setIsMuted(newMuted);
  };

  const formatTime = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;

  return { callState, isMuted, elapsed, error, transcript, audioRef, startCall, endCall, toggleMute, formatTime };
}
```

**Step 4: Create InterviewRoom component**

```typescript
// apps/web/app/interview/[sessionId]/InterviewRoom.tsx
'use client';

import { Mic, MicOff, PhoneOff, Play } from 'lucide-react';
import { useInterviewCall } from './useInterviewCall';

interface Props {
  sessionId: string;
  title: string;
}

export function InterviewRoom({ sessionId, title }: Props) {
  const { callState, isMuted, elapsed, error, transcript, audioRef, startCall, endCall, toggleMute, formatTime } =
    useInterviewCall(sessionId);

  return (
    <div className="w-full max-w-lg rounded-2xl bg-white shadow-lg overflow-hidden">
      {/* biome-ignore lint/a11y/useMediaCaption: audio-only remote stream */}
      <audio ref={audioRef} autoPlay />

      {/* Header */}
      <div className="border-b px-6 py-4 text-center">
        <h2 className="font-medium text-gray-900">{title}</h2>
        {callState === 'connected' && (
          <div className="mt-1 flex items-center justify-center gap-2">
            <span className="text-sm text-gray-500">通話中 {formatTime(elapsed)}</span>
            <div className="flex items-center gap-0.5">
              {[0,1,2,3,4,5].map((i) => (
                <div
                  key={i}
                  className="w-0.5 rounded-full bg-blue-500 animate-pulse"
                  style={{ height: `${8 + (i % 3) * 4}px`, animationDelay: `${i * 0.08}s` }}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Transcript or status */}
      <div className="h-80 overflow-y-auto p-4 space-y-3">
        {transcript.length === 0 ? (
          <div className="flex h-full items-center justify-center text-center text-gray-400 text-sm">
            {callState === 'idle' && 'マイクを許可して、インタビューを開始してください。'}
            {callState === 'connecting' && '接続中...'}
            {callState === 'ended' && '終了しました。ご参加ありがとうございました。'}
            {callState === 'error' && error}
          </div>
        ) : (
          transcript.map((entry) => (
            <div key={entry.id} className={`flex gap-2 ${entry.speaker === 'user' ? 'flex-row-reverse' : ''}`}>
              <div className={`max-w-[80%] rounded-2xl px-3 py-2 text-sm ${
                entry.speaker === 'user'
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-100 text-gray-900'
              } ${!entry.isFinal ? 'opacity-60' : ''}`}>
                {entry.text}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Controls */}
      <div className="border-t p-4 flex items-center justify-center gap-4">
        {callState === 'idle' && (
          <button
            onClick={startCall}
            className="flex items-center gap-2 rounded-full bg-green-500 px-6 py-3 text-white font-medium hover:bg-green-600 transition-colors"
          >
            <Play className="h-4 w-4" />
            インタビューを開始
          </button>
        )}

        {callState === 'connecting' && (
          <div className="flex items-center gap-2 text-gray-500 text-sm">
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
            接続中...
          </div>
        )}

        {callState === 'connected' && (
          <>
            <button
              onClick={toggleMute}
              className={`h-12 w-12 rounded-full flex items-center justify-center transition-colors ${
                isMuted ? 'bg-red-100 text-red-600' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {isMuted ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
            </button>
            <button
              onClick={endCall}
              className="h-12 w-12 rounded-full bg-red-500 text-white flex items-center justify-center hover:bg-red-600 transition-colors"
            >
              <PhoneOff className="h-5 w-5" />
            </button>
          </>
        )}

        {(callState === 'ended' || callState === 'error') && (
          <button
            onClick={() => window.location.reload()}
            className="rounded-full border px-6 py-2 text-sm text-gray-700 hover:bg-gray-50"
          >
            再接続
          </button>
        )}
      </div>
    </div>
  );
}
```

**Step 5: Install and verify**

```bash
cd /Users/kazu42/dev/iterate
pnpm install
cd apps/web && pnpm typecheck
```

**Step 6: Commit**

```bash
git add apps/web
git commit -m "feat: add interview UI page and LiveKit hook for web app"
```

---

## Task 5: apps/web — API route /api/interview/join

**Files:**
- Create: `apps/web/app/api/interview/join/route.ts`
- Create: `apps/web/env.ts`

**Step 1: Create env.ts for server vars**

```typescript
// apps/web/env.ts
function required(key: string): string {
  const val = process.env[key];
  if (!val) throw new Error(`Missing env var: ${key}`);
  return val;
}

export const env = {
  LIVEKIT_URL: required('LIVEKIT_URL'),
  LIVEKIT_API_KEY: required('LIVEKIT_API_KEY'),
  LIVEKIT_API_SECRET: required('LIVEKIT_API_SECRET'),
  DATABASE_URL: required('DATABASE_URL'),
};
```

**Step 2: Add livekit-server-sdk to apps/web**

Edit `apps/web/package.json` — add to `dependencies`:
```json
"livekit-server-sdk": "^2"
```

**Step 3: Create API route**

```typescript
// apps/web/app/api/interview/join/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { AccessToken, RoomServiceClient } from 'livekit-server-sdk';
import { PrismaClient } from '@iterate/db';
import type { AgentJobMetadata } from '@iterate/types';
import { env } from '@/env';

const prisma = new PrismaClient();

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { interviewId } = body;

  if (!interviewId || typeof interviewId !== 'string') {
    return NextResponse.json({ error: 'interviewId required' }, { status: 400 });
  }

  const interview = await prisma.interview.findUnique({
    where: { id: interviewId },
  });

  if (!interview) {
    return NextResponse.json({ error: 'Interview not found' }, { status: 404 });
  }

  if (interview.status === 'COMPLETED' || interview.status === 'EXPIRED') {
    return NextResponse.json({ error: 'Interview is no longer available' }, { status: 410 });
  }

  if (new Date(interview.expiresAt) < new Date()) {
    await prisma.interview.update({
      where: { id: interviewId },
      data: { status: 'EXPIRED' },
    });
    return NextResponse.json({ error: 'Interview expired' }, { status: 410 });
  }

  const roomName = `interview-${interviewId}`;

  // Create LiveKit room with interview questions as metadata
  const roomService = new RoomServiceClient(
    env.LIVEKIT_URL,
    env.LIVEKIT_API_KEY,
    env.LIVEKIT_API_SECRET,
  );

  const metadata: AgentJobMetadata = {
    interviewId,
    language: 'ja',
    interviewerName: 'AIインタビュアー',
    questions: interview.questions as { id: string; text: string }[],
  };

  await roomService.createRoom({
    name: roomName,
    metadata: JSON.stringify(metadata),
  });

  // Generate participant access token
  const at = new AccessToken(env.LIVEKIT_API_KEY, env.LIVEKIT_API_SECRET, {
    identity: `interviewee-${Date.now()}`,
    name: 'Interviewee',
  });
  at.addGrant({
    room: roomName,
    roomJoin: true,
    canPublish: true,
    canSubscribe: true,
  });

  const accessToken = await at.toJwt();

  // Mark interview as in_progress
  await prisma.interview.update({
    where: { id: interviewId },
    data: { status: 'IN_PROGRESS' },
  });

  return NextResponse.json({
    livekitUrl: env.LIVEKIT_URL,
    accessToken,
    roomName,
  });
}
```

**Step 4: Create .env.local for web app**

```bash
# apps/web/.env.local.example
LIVEKIT_URL=wss://your-livekit-server.livekit.cloud
LIVEKIT_API_KEY=your-api-key
LIVEKIT_API_SECRET=your-api-secret
DATABASE_URL=postgresql://user:password@localhost:5432/iterate
```

**Step 5: Install and verify**

```bash
cd /Users/kazu42/dev/iterate && pnpm install
cd apps/web && pnpm typecheck
```

**Step 6: Commit**

```bash
git add apps/web/app/api apps/web/env.ts
git commit -m "feat: add /api/interview/join route with LiveKit room creation"
```

---

## Task 6: Fish Audio TTS Adapter (copy from voiceagent-v3)

**Files:**
- Create: `apps/interview-agent/src/infrastructure/tts/FishTtsAdapter.ts`

**Step 1: Copy the Fish Audio adapter**

The full implementation exists at:
`~/interx/voiceagent-v3/apps/agent-runtime/src/infrastructure/tts/FishTtsAdapter.ts`

Copy it verbatim, but:
1. Remove the import of `FishTtsConfig` from domain config — define it inline
2. Remove the import of `applyTextSubstitutions` — apply directly (no substitution rules)

```typescript
// apps/interview-agent/src/infrastructure/tts/FishTtsAdapter.ts
// Adapted from ~/interx/voiceagent-v3/apps/agent-runtime/src/infrastructure/tts/FishTtsAdapter.ts
// Changes: inline config type, removed text substitution

import { tts } from '@livekit/agents';
import { AudioFrame } from '@livekit/rtc-node';
import { pack, unpack } from 'msgpackr';
import type { RawData } from 'ws';
import WebSocket from 'ws';

export interface FishTtsConfig {
  apiKey: string;
  referenceId: string;
  model: string;
  sampleRate: number;
  latency: 'normal' | 'balanced';
  speed: number;
}

const FISH_TTS_WS_URL = 'wss://api.fish.audio/v1/tts/live';
const FRAME_DURATION_MS = 10;

// [Paste the COMPLETE contents of FishTtsAdapter.ts from voiceagent-v3 here]
// The implementation is unchanged except for the two imports above.
// Copy from: ~/interx/voiceagent-v3/apps/agent-runtime/src/infrastructure/tts/FishTtsAdapter.ts
```

Run the copy command:
```bash
cp ~/interx/voiceagent-v3/apps/agent-runtime/src/infrastructure/tts/FishTtsAdapter.ts \
   /Users/kazu42/dev/iterate/apps/interview-agent/src/infrastructure/tts/FishTtsAdapter.ts
```

Then edit the file to replace the import lines:
```typescript
// REPLACE:
import type { FishTtsConfig, TextSubstitutionRule } from '../../domain/config/index.js';
import { applyTextSubstitutions } from './textSubstitution.js';

// WITH:
export interface FishTtsConfig {
  apiKey: string;
  referenceId: string;
  model: string;
  sampleRate: number;
  latency: 'normal' | 'balanced';
  speed: number;
}
```

And remove all `TextSubstitutionRule` and `applyTextSubstitutions` references (replace `applyTextSubstitutions(text, this.rules)` with `text`).

**Step 2: Verify compilation**

```bash
cd /Users/kazu42/dev/iterate/apps/interview-agent
pnpm typecheck
```

Expected: No errors related to FishTtsAdapter.

**Step 3: Commit**

```bash
git add apps/interview-agent/src/infrastructure/tts/
git commit -m "feat: add Fish Audio TTS adapter (adapted from voiceagent-v3)"
```

---

## Task 7: Google Cloud STT Adapter (copy from voiceagent-v3)

**Files:**
- Create: `apps/interview-agent/src/infrastructure/stt/GoogleSttAdapter.ts`

**Step 1: Copy the Google STT adapter**

```bash
cp ~/interx/voiceagent-v3/apps/agent-runtime/src/infrastructure/stt/GoogleSttAdapter.ts \
   /Users/kazu42/dev/iterate/apps/interview-agent/src/infrastructure/stt/GoogleSttAdapter.ts
```

Edit to replace config import:
```typescript
// REPLACE:
import type { GoogleSttConfig } from '../../domain/config/index.js';

// WITH:
export interface GoogleSttConfig {
  languageCode: string;
  sampleRate: number;
  credentials?: { client_email: string; private_key: string };
}
```

**Step 2: Verify**

```bash
pnpm typecheck
```

**Step 3: Commit**

```bash
git add apps/interview-agent/src/infrastructure/stt/
git commit -m "feat: add Google Cloud STT adapter (adapted from voiceagent-v3)"
```

---

## Task 8: OpenAI LLM Adapter (copy from voiceagent-v3)

**Files:**
- Create: `apps/interview-agent/src/infrastructure/llm/OpenAiLlmAdapter.ts`

**Step 1: Copy the OpenAI adapter**

```bash
cp ~/interx/voiceagent-v3/apps/agent-runtime/src/infrastructure/llm/OpenAiLlmAdapter.ts \
   /Users/kazu42/dev/iterate/apps/interview-agent/src/infrastructure/llm/OpenAiLlmAdapter.ts
```

Edit to inline the config type:
```typescript
// REPLACE:
import type { OpenAiLlmConfig } from '../../domain/config/index.js';

// WITH:
export interface OpenAiLlmConfig {
  apiKey: string;
  model: string;
  temperature?: number;
  maxTokens?: number;
}
```

**Step 2: Verify**

```bash
pnpm typecheck
```

**Step 3: Commit**

```bash
git add apps/interview-agent/src/infrastructure/llm/
git commit -m "feat: add OpenAI LLM adapter (adapted from voiceagent-v3)"
```

---

## Task 9: Interview Runner — Question loop orchestration

**Files:**
- Create: `apps/interview-agent/src/application/interviewRunner.ts`

**Step 1: Implement the interview runner**

The runner builds a system prompt from the question list in room metadata, creates a `VoicePipelineAgent`, and collects transcripts. When the session ends, it summarizes answers with GPT-4o and saves an InterviewResponse to DB via API.

```typescript
// apps/interview-agent/src/application/interviewRunner.ts
import type { JobContext } from '@livekit/agents';
import { llm, voice } from '@livekit/agents';
import { VAD } from '@livekit/agents-plugin-silero';
import type { Participant, TranscriptionSegment } from '@livekit/rtc-node';
import OpenAI from 'openai';
import { PrismaClient } from '@iterate/db';
import type { AgentJobMetadata, InterviewAnswer, InterviewQuestion } from '@iterate/types';
import type { GoogleSttConfig } from '../infrastructure/stt/GoogleSttAdapter.js';
import { GoogleSttAdapter } from '../infrastructure/stt/GoogleSttAdapter.js';
import type { FishTtsConfig } from '../infrastructure/tts/FishTtsAdapter.js';
import { FishTtsAdapter } from '../infrastructure/tts/FishTtsAdapter.js';
import type { OpenAiLlmConfig } from '../infrastructure/llm/OpenAiLlmAdapter.js';
import { OpenAiLlmAdapter } from '../infrastructure/llm/OpenAiLlmAdapter.js';
import { env } from '../env.js';

const prisma = new PrismaClient();

interface TranscriptEntry {
  speaker: 'user' | 'agent';
  text: string;
}

function buildSystemPrompt(meta: AgentJobMetadata): string {
  const questionList = meta.questions
    .map((q, i) => `${i + 1}. ${q.text}`)
    .join('\n');

  return `あなたはユーザーリサーチのAIインタビュアーです。以下の質問リストに従って、インタビューを進めてください。

## インタビュー質問
${questionList}

## ルール
- 必ず最初に簡単な挨拶をして、インタビューの目的を説明してください
- 質問は1つずつ順番に行ってください
- 回答が不明確な場合は、1回だけ深掘り質問をしてもよいです（同じ質問は繰り返さない）
- 全ての質問が終わったら、お礼を言って会話を終了してください
- 回答は簡潔に促してください（長すぎる質問はしない）
- 言語: ${meta.language === 'ja' ? '日本語' : meta.language}`;
}

export async function runInterview(jobCtx: JobContext): Promise<void> {
  // Parse metadata from room
  const roomMetadata = jobCtx.room?.metadata ?? '{}';
  let meta: AgentJobMetadata;
  try {
    meta = JSON.parse(roomMetadata) as AgentJobMetadata;
  } catch {
    console.error('[Interview] Failed to parse room metadata');
    return;
  }

  // Load adapters
  const credentials = JSON.parse(env.GOOGLE_CLOUD_CREDENTIALS_JSON);
  const googleSttConfig: GoogleSttConfig = {
    languageCode: 'ja-JP',
    sampleRate: 16000,
    credentials,
  };
  const fishTtsConfig: FishTtsConfig = {
    apiKey: env.FISH_AUDIO_API_KEY,
    referenceId: env.FISH_AUDIO_REFERENCE_ID,
    model: env.FISH_AUDIO_MODEL,
    sampleRate: 24000,
    latency: 'balanced',
    speed: 1.0,
  };
  const openAiLlmConfig: OpenAiLlmConfig = {
    apiKey: env.OPENAI_API_KEY,
    model: 'gpt-4o',
    temperature: 0.7,
  };

  const sttAdapter = new GoogleSttAdapter(googleSttConfig);
  const ttsAdapter = new FishTtsAdapter(fishTtsConfig);
  const llmAdapter = new OpenAiLlmAdapter(openAiLlmConfig);

  // Build system prompt from metadata
  const systemPrompt = buildSystemPrompt(meta);

  // Collect transcript
  const transcriptEntries: TranscriptEntry[] = [];
  const startTime = Date.now();

  // VAD
  console.log('[Interview] Loading VAD...');
  const vad = await VAD.load();

  // Chat context with system prompt
  const chatCtx = new llm.ChatContext();
  chatCtx.append({ role: 'system', text: systemPrompt });

  // Create voice pipeline agent
  const agent = new voice.VoicePipelineAgent(vad, sttAdapter, llmAdapter, ttsAdapter, {
    chatCtx,
    allowInterruptions: false,
  });

  // Connect to room
  await jobCtx.connect();
  const participant = await jobCtx.waitForParticipant();

  // Capture transcriptions
  jobCtx.room?.on(
    'transcriptionReceived',
    (segments: TranscriptionSegment[], p?: Participant) => {
      for (const seg of segments) {
        if (!seg.final || !seg.text.trim()) continue;
        const isUser = p?.identity === participant.identity;
        transcriptEntries.push({ speaker: isUser ? 'user' : 'agent', text: seg.text });
      }
    },
  );

  // Start session
  await agent.start(jobCtx.room!, participant);

  // Wait for session end
  await new Promise<void>((resolve) => {
    agent.on('close', resolve);
    participant.on('disconnected', resolve);
  });

  const durationSeconds = Math.round((Date.now() - startTime) / 1000);

  // Summarize answers with GPT-4o
  const answers = await summarizeAnswers(meta.questions, transcriptEntries, openAiLlmConfig);

  // Save InterviewResponse to DB
  await prisma.interviewResponse.create({
    data: {
      interviewId: meta.interviewId,
      respondentId: `anon-${Date.now()}`,
      answers,
      durationSec: durationSeconds,
    },
  });

  // Increment responseCount on Interview
  await prisma.interview.update({
    where: { id: meta.interviewId },
    data: {
      responseCount: { increment: 1 },
      status: 'COMPLETED',
    },
  });

  console.log(`[Interview] Response saved for interview ${meta.interviewId}`);
}

async function summarizeAnswers(
  questions: InterviewQuestion[],
  transcript: TranscriptEntry[],
  llmConfig: OpenAiLlmConfig,
): Promise<InterviewAnswer[]> {
  const openai = new OpenAI({ apiKey: llmConfig.apiKey });
  const fullTranscript = transcript
    .map((e) => `${e.speaker === 'agent' ? 'AI' : 'User'}: ${e.text}`)
    .join('\n');

  const answers: InterviewAnswer[] = [];

  for (const q of questions) {
    const prompt = `以下のインタビュートランスクリプトから、この質問に対するユーザーの回答を100文字以内で要約してください。

質問: ${q.text}

トランスクリプト:
${fullTranscript}

要約（回答がない場合は「回答なし」と記載）:`;

    const res = await openai.chat.completions.create({
      model: llmConfig.model,
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 200,
    });

    const summary = res.choices[0]?.message.content?.trim() ?? '回答なし';
    answers.push({
      questionId: q.id,
      question: q.text,
      answerSummary: summary,
      fullTranscript,
    });
  }

  return answers;
}
```

**Step 2: Verify compilation**

```bash
pnpm typecheck
```

**Step 3: Commit**

```bash
git add apps/interview-agent/src/application/
git commit -m "feat: add interview runner with question loop and result summarization"
```

---

## Task 10: Wire Agent Entry Point

**Files:**
- Create: `apps/interview-agent/src/agent.ts`

**Step 1: Create agent.ts**

```typescript
// apps/interview-agent/src/agent.ts
/**
 * LiveKit Agent Entry Point
 *
 * Usage:
 *   tsx src/agent.ts dev     # Development
 *   node dist/agent.js dev   # Production
 */

import { cli, defineAgent, type JobContext, type JobProcess } from '@livekit/agents';
import { VAD } from '@livekit/agents-plugin-silero';
import { runInterview } from './application/interviewRunner.js';

export default defineAgent({
  prewarm: async (_proc: JobProcess) => {
    console.log('[Agent] Prewarm: loading VAD model...');
    await VAD.load();
    console.log('[Agent] Prewarm complete');
  },

  entry: async (jobCtx: JobContext) => {
    console.log(`[Agent] Job received: ${jobCtx.job?.id ?? 'unknown'}`);
    try {
      await runInterview(jobCtx);
    } catch (error) {
      console.error('[Agent] Interview failed:', error instanceof Error ? error.message : error);
    }
  },
});

cli.runApp({ usage: 'Interview agent worker' });
```

**Step 2: Verify**

```bash
pnpm typecheck
```

**Step 3: Update turbo.json to add agent task**

Edit `/Users/kazu42/dev/iterate/turbo.json`:
```json
{
  "$schema": "https://turbo.build/schema.json",
  "tasks": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": [".next/**", "!.next/cache/**", "dist/**"]
    },
    "dev": {
      "cache": false,
      "persistent": true
    },
    "dev:agent": {
      "cache": false,
      "persistent": true
    },
    "lint": {
      "dependsOn": ["^lint"]
    },
    "typecheck": {
      "dependsOn": ["^build"]
    }
  }
}
```

**Step 4: Final typecheck across all packages**

```bash
cd /Users/kazu42/dev/iterate
pnpm install
pnpm --filter "interview-agent" typecheck
pnpm --filter "web" typecheck
```

**Step 5: Commit**

```bash
git add apps/interview-agent/src/agent.ts turbo.json
git commit -m "feat: wire LiveKit agent entry point for interview runner"
```

---

## Task 11: Local Integration Test

**Prerequisites:**
- LiveKit server running (or LiveKit Cloud account)
- PostgreSQL DB running (Supabase local or cloud)
- `.env` files configured for both apps

**Step 1: Apply Prisma migration**

```bash
cd /Users/kazu42/dev/iterate/packages/db
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/iterate pnpm db:migrate --name init
```

**Step 2: Insert a test Interview**

```typescript
// packages/db/prisma/seed.ts
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

await prisma.interview.create({
  data: {
    id: 'test-interview-001',
    insightId: 'test-insight-001',
    status: 'PENDING',
    targetCount: 5,
    questions: [
      { id: 'q1', text: '現在の仕事でどんなツールをよく使いますか？' },
      { id: 'q2', text: '改善してほしいことはありますか？' },
    ],
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
  },
});
```

```bash
pnpm ts-node prisma/seed.ts
```

**Step 3: Start the agent worker**

```bash
cd /Users/kazu42/dev/iterate/apps/interview-agent
cp .env.example .env  # fill in real values
pnpm dev:agent
```

Expected output:
```
[Agent] Prewarm: loading VAD model...
[Agent] Prewarm complete
Agent worker started. Waiting for jobs...
```

**Step 4: Start Next.js**

```bash
cd /Users/kazu42/dev/iterate/apps/web
cp .env.local.example .env.local  # fill in real values
pnpm dev
```

**Step 5: Open interview URL**

Open browser: `http://localhost:3000/interview/test-interview-001`

Expected:
- "インタビューを開始" button visible

**Step 6: Start interview**

1. Click "インタビューを開始"
2. Allow microphone access
3. Verify AI greets and asks first question
4. Answer the questions
5. Verify transcript appears in real-time
6. Verify AI ends the interview after all questions

**Step 7: Verify results saved**

```typescript
const interview = await prisma.interview.findUnique({
  where: { id: 'test-interview-001' },
  include: { responses: true },
});
console.log(interview?.status);          // 'COMPLETED'
console.log(interview?.responses.length); // 1
```

Expected: `status = 'COMPLETED'`, `responses.length >= 1`

**Step 8: Final commit**

```bash
git add .
git commit -m "feat: complete AI interview app - LiveKit voice interview with Fish Audio TTS"
```

---

## Quick Reference: Running locally

```bash
# Terminal 1: LiveKit agent worker
cd apps/interview-agent && pnpm dev:agent

# Terminal 2: Next.js web app
cd apps/web && pnpm dev

# Terminal 3: Hono health server (optional)
cd apps/interview-agent && pnpm dev
```

## Environment Variables Summary

| Variable | Where | Description |
|----------|-------|-------------|
| `LIVEKIT_URL` | both | LiveKit server WebSocket URL |
| `LIVEKIT_API_KEY` | both | LiveKit API key |
| `LIVEKIT_API_SECRET` | both | LiveKit API secret |
| `OPENAI_API_KEY` | agent | OpenAI API key |
| `GOOGLE_CLOUD_CREDENTIALS_JSON` | agent | Service account JSON (stringified) |
| `FISH_AUDIO_API_KEY` | agent | Fish Audio API key |
| `FISH_AUDIO_REFERENCE_ID` | agent | Voice model ID |
| `DATABASE_URL` | both | PostgreSQL connection string |

# AI Interview App Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** URLアクセスで使えるAI音声インタビューWebアプリ（LiveKit + OpenAI + Google STT + Fish Audio TTS）

**Architecture:** Next.js（interview UI + API route）+ Node.js LiveKit エージェントワーカー（apps/interview-agent）の2プロセス構成。セッションID付きURLからSupabaseのTOML設定を取得し、LiveKitでリアルタイム音声インタビューを実施、結果をTOMLで保存。

**Tech Stack:** Next.js 16, @livekit/agents (Node.js), livekit-client, OpenAI GPT-4o, Google Cloud STT, Fish Audio TTS (WebSocket), Supabase, pnpm workspaces, Turbo

**Reference implementations to copy from:** `~/interx/voiceagent-v3/apps/agent-runtime/src/infrastructure/tts/FishTtsAdapter.ts`, `GoogleSttAdapter.ts`, `OpenAiLlmAdapter.ts`

---

## Parallel Execution Map

```
Group A (start immediately, parallel):
  Task 1: packages/shared       ← TOML types
  Task 2: packages/database     ← Supabase client + migration

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

## Task 1: packages/shared — TOML type definitions

**Files:**
- Create: `packages/shared/package.json`
- Create: `packages/shared/tsconfig.json`
- Create: `packages/shared/src/index.ts`
- Create: `packages/shared/src/interviewTypes.ts`

**Step 1: Create package.json**

```json
// packages/shared/package.json
{
  "name": "@iterate/shared",
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
  },
  "dependencies": {
    "smol-toml": "^1.3.4"
  }
}
```

**Step 2: Create tsconfig.json**

```json
// packages/shared/tsconfig.json
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
// packages/shared/src/interviewTypes.ts
import { parse, stringify } from 'smol-toml';

// Input TOML (from Phase 1)
export interface InterviewQuestion {
  id: string;
  text: string;
}

export interface InterviewConfig {
  interview: {
    title: string;
    language: string;
    interviewer_name: string;
  };
  questions: InterviewQuestion[];
}

// Output TOML (Phase 2 → Phase 3)
export interface InterviewAnswer {
  question_id: string;
  question: string;
  answer_summary: string;
  full_transcript: string;
}

export interface InterviewResults {
  session: {
    session_id: string;
    title: string;
    completed_at: string;
    duration_seconds: number;
  };
  answers: InterviewAnswer[];
}

// Parsers
export function parseInterviewConfig(toml: string): InterviewConfig {
  return parse(toml) as InterviewConfig;
}

export function stringifyInterviewResults(results: InterviewResults): string {
  return stringify(results as Record<string, unknown>);
}
```

**Step 4: Create index.ts**

```typescript
// packages/shared/src/index.ts
export * from './interviewTypes.js';
```

**Step 5: Install and build**

```bash
cd /Users/kazu42/dev/iterate
pnpm install
cd packages/shared && pnpm build
```

Expected: `dist/` directory created with compiled JS and type declarations.

**Step 6: Commit**

```bash
git add packages/shared
git commit -m "feat: add shared package with interview TOML types"
```

---

## Task 2: packages/database — Supabase client + migration

**Files:**
- Create: `packages/database/package.json`
- Create: `packages/database/tsconfig.json`
- Create: `packages/database/src/index.ts`
- Create: `packages/database/src/client.ts`
- Create: `packages/database/migrations/001_interview_sessions.sql`

**Step 1: Create package.json**

```json
// packages/database/package.json
{
  "name": "@iterate/database",
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
  },
  "dependencies": {
    "@supabase/supabase-js": "^2"
  }
}
```

**Step 2: Create tsconfig.json** (same as shared)

```json
// packages/database/tsconfig.json
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

**Step 3: Create migration SQL**

```sql
-- packages/database/migrations/001_interview_sessions.sql
CREATE TYPE interview_status AS ENUM ('pending', 'in_progress', 'completed', 'expired');

CREATE TABLE interview_sessions (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  config_toml   text NOT NULL,
  results_toml  text,
  status        interview_status NOT NULL DEFAULT 'pending',
  expires_at    timestamptz NOT NULL,
  created_at    timestamptz NOT NULL DEFAULT now()
);

-- Index for URL lookup by ID
CREATE INDEX idx_interview_sessions_status ON interview_sessions(status);
```

**Step 4: Create Supabase client**

```typescript
// packages/database/src/client.ts
import { createClient } from '@supabase/supabase-js';

export type InterviewStatus = 'pending' | 'in_progress' | 'completed' | 'expired';

export interface InterviewSession {
  id: string;
  config_toml: string;
  results_toml: string | null;
  status: InterviewStatus;
  expires_at: string;
  created_at: string;
}

export function createDbClient(supabaseUrl: string, supabaseKey: string) {
  const client = createClient(supabaseUrl, supabaseKey);

  return {
    async getSession(id: string): Promise<InterviewSession | null> {
      const { data, error } = await client
        .from('interview_sessions')
        .select('*')
        .eq('id', id)
        .single();
      if (error) return null;
      return data as InterviewSession;
    },

    async updateStatus(id: string, status: InterviewStatus): Promise<void> {
      await client
        .from('interview_sessions')
        .update({ status })
        .eq('id', id);
    },

    async saveResults(id: string, resultToml: string): Promise<void> {
      await client
        .from('interview_sessions')
        .update({ results_toml: resultToml, status: 'completed' as InterviewStatus })
        .eq('id', id);
    },
  };
}

export type DbClient = ReturnType<typeof createDbClient>;
```

**Step 5: Create index.ts**

```typescript
// packages/database/src/index.ts
export * from './client.js';
```

**Step 6: Build**

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
    "@iterate/database": "workspace:*",
    "@iterate/shared": "workspace:*",
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
  SUPABASE_URL: required('SUPABASE_URL'),
  SUPABASE_SERVICE_ROLE_KEY: required('SUPABASE_SERVICE_ROLE_KEY'),
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
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
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
"@supabase/supabase-js": "^2",
"@iterate/database": "workspace:*",
"@iterate/shared": "workspace:*",
"livekit-client": "^2",
"lucide-react": "^0.469.0"
```

**Step 2: Create server page (session validation)**

```typescript
// apps/web/app/interview/[sessionId]/page.tsx
import { notFound } from 'next/navigation';
import { createDbClient } from '@iterate/database';
import { parseInterviewConfig } from '@iterate/shared';
import { InterviewRoom } from './InterviewRoom';

interface Props {
  params: Promise<{ sessionId: string }>;
}

export default async function InterviewPage({ params }: Props) {
  const { sessionId } = await params;

  const db = createDbClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );

  const session = await db.getSession(sessionId);

  if (!session) return notFound();

  if (session.status === 'expired') {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-gray-500">このインタビューの有効期限が切れています。</p>
      </div>
    );
  }

  if (session.status === 'completed') {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-gray-500">このインタビューはすでに完了しています。ありがとうございました。</p>
      </div>
    );
  }

  const config = parseInterviewConfig(session.config_toml);

  return (
    <div className="flex min-h-screen flex-col bg-gray-50">
      <header className="border-b bg-white px-6 py-4">
        <h1 className="text-lg font-semibold text-gray-900">{config.interview.title}</h1>
      </header>
      <main className="flex flex-1 items-center justify-center p-6">
        <InterviewRoom sessionId={sessionId} title={config.interview.title} />
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
  SUPABASE_URL: required('SUPABASE_URL'),
  SUPABASE_SERVICE_ROLE_KEY: required('SUPABASE_SERVICE_ROLE_KEY'),
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
import { createDbClient } from '@iterate/database';
import { env } from '@/env';

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { sessionId } = body;

  if (!sessionId || typeof sessionId !== 'string') {
    return NextResponse.json({ error: 'sessionId required' }, { status: 400 });
  }

  const db = createDbClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);
  const session = await db.getSession(sessionId);

  if (!session) {
    return NextResponse.json({ error: 'Session not found' }, { status: 404 });
  }

  if (session.status === 'completed' || session.status === 'expired') {
    return NextResponse.json({ error: 'Session is no longer available' }, { status: 410 });
  }

  if (new Date(session.expires_at) < new Date()) {
    await db.updateStatus(sessionId, 'expired');
    return NextResponse.json({ error: 'Session expired' }, { status: 410 });
  }

  const roomName = `interview-${sessionId}`;

  // Create LiveKit room with interview config as metadata
  const roomService = new RoomServiceClient(
    env.LIVEKIT_URL,
    env.LIVEKIT_API_KEY,
    env.LIVEKIT_API_SECRET,
  );

  await roomService.createRoom({
    name: roomName,
    metadata: JSON.stringify({ sessionId, configToml: session.config_toml }),
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

  // Mark session as in_progress
  await db.updateStatus(sessionId, 'in_progress');

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
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
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

The runner builds a system prompt from the TOML question list, creates a `VoicePipelineAgent`, and collects transcripts. When the session ends, it summarizes answers with GPT-4o and saves results to Supabase.

```typescript
// apps/interview-agent/src/application/interviewRunner.ts
import type { JobContext } from '@livekit/agents';
import { llm, voice } from '@livekit/agents';
import { VAD } from '@livekit/agents-plugin-silero';
import type { Participant, TranscriptionSegment } from '@livekit/rtc-node';
import OpenAI from 'openai';
import { createDbClient } from '@iterate/database';
import { parseInterviewConfig, stringifyInterviewResults } from '@iterate/shared';
import type { InterviewAnswer } from '@iterate/shared';
import type { GoogleSttConfig } from '../infrastructure/stt/GoogleSttAdapter.js';
import { GoogleSttAdapter } from '../infrastructure/stt/GoogleSttAdapter.js';
import type { FishTtsConfig } from '../infrastructure/tts/FishTtsAdapter.js';
import { FishTtsAdapter } from '../infrastructure/tts/FishTtsAdapter.js';
import type { OpenAiLlmConfig } from '../infrastructure/llm/OpenAiLlmAdapter.js';
import { OpenAiLlmAdapter } from '../infrastructure/llm/OpenAiLlmAdapter.js';
import { env } from '../env.js';

interface TranscriptEntry {
  speaker: 'user' | 'agent';
  text: string;
}

function buildSystemPrompt(configToml: string): string {
  const config = parseInterviewConfig(configToml);
  const questionList = config.questions
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
- 言語: ${config.interview.language === 'ja' ? '日本語' : config.interview.language}`;
}

export async function runInterview(jobCtx: JobContext): Promise<void> {
  // Parse metadata from room
  const roomMetadata = jobCtx.room?.metadata ?? '{}';
  let sessionId: string;
  let configToml: string;
  try {
    const meta = JSON.parse(roomMetadata);
    sessionId = meta.sessionId;
    configToml = meta.configToml;
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

  // Build system prompt from TOML
  const systemPrompt = buildSystemPrompt(configToml);

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
  const config = parseInterviewConfig(configToml);
  const answers = await summarizeAnswers(config.questions, transcriptEntries, openAiLlmConfig);

  // Build results TOML
  const results = {
    session: {
      session_id: sessionId,
      title: config.interview.title,
      completed_at: new Date().toISOString(),
      duration_seconds: durationSeconds,
    },
    answers,
  };

  const resultToml = stringifyInterviewResults(results);

  // Save to Supabase
  const db = createDbClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);
  await db.saveResults(sessionId, resultToml);
  console.log(`[Interview] Results saved for session ${sessionId}`);
}

async function summarizeAnswers(
  questions: Array<{ id: string; text: string }>,
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
      question_id: q.id,
      question: q.text,
      answer_summary: summary,
      full_transcript: fullTranscript,
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
- Supabase project with migration applied
- `.env` files configured for both apps

**Step 1: Apply Supabase migration**

If using Supabase local:
```bash
supabase init  # from /Users/kazu42/dev/iterate
supabase start
psql -h localhost -p 54322 -U postgres -d postgres \
  -f packages/database/migrations/001_interview_sessions.sql
```

If using Supabase Cloud, run the SQL in the Dashboard SQL editor.

**Step 2: Insert a test session**

```sql
INSERT INTO interview_sessions (id, config_toml, status, expires_at)
VALUES (
  'test-session-001',
  E'[interview]\ntitle = "テストインタビュー"\nlanguage = "ja"\ninterviewer_name = "AI"\n\n[[questions]]\nid = "q1"\ntext = "現在の仕事でどんなツールをよく使いますか？"\n\n[[questions]]\nid = "q2"\ntext = "改善してほしいことはありますか？"',
  'pending',
  NOW() + INTERVAL '7 days'
);
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

Open browser: `http://localhost:3000/interview/test-session-001`

Expected:
- Page shows "テストインタビュー" title
- "インタビューを開始" button visible

**Step 6: Start interview**

1. Click "インタビューを開始"
2. Allow microphone access
3. Verify AI greets and asks first question
4. Answer the questions
5. Verify transcript appears in real-time
6. Verify AI ends the interview after all questions

**Step 7: Verify results saved**

```sql
SELECT id, status, results_toml IS NOT NULL as has_results
FROM interview_sessions
WHERE id = 'test-session-001';
```

Expected: `status = 'completed'`, `has_results = true`

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
| `SUPABASE_URL` | both | Supabase project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | both | Supabase service role key |

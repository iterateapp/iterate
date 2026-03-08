import { NextRequest, NextResponse } from 'next/server';
import { AccessToken, RoomServiceClient } from 'livekit-server-sdk';
import { PrismaClient } from '@iterate/db';
import type { AgentJobMetadata } from '@iterate/types';

const prisma = new PrismaClient();

function getEnv(key: string): string {
  const val = process.env[key];
  if (!val) throw new Error(`Missing env var: ${key}`);
  return val;
}

export async function POST(req: NextRequest) {
  const body = await req.json() as { interviewId?: string };
  const { interviewId } = body;

  if (!interviewId || typeof interviewId !== 'string') {
    return NextResponse.json({ error: 'interviewId required' }, { status: 400 });
  }

  const livekitUrl = getEnv('LIVEKIT_URL');
  const livekitApiKey = getEnv('LIVEKIT_API_KEY');
  const livekitApiSecret = getEnv('LIVEKIT_API_SECRET');

  let interview;
  try {
    interview = await prisma.interview.findUnique({ where: { id: interviewId } });
  } catch (err) {
    console.error('DB error:', err);
    return NextResponse.json({ error: 'Database error' }, { status: 500 });
  }

  if (!interview) {
    return NextResponse.json({ error: 'Interview not found' }, { status: 404 });
  }

  if (interview.status !== 'PENDING') {
    const messages: Record<string, string> = {
      COMPLETED: 'This interview has already been completed.',
      EXPIRED: 'This interview link has expired.',
      IN_PROGRESS: 'This interview is already in progress.',
    };
    return NextResponse.json(
      { error: messages[interview.status] ?? 'Interview unavailable' },
      { status: 410 },
    );
  }

  if (new Date(interview.expiresAt) < new Date()) {
    await prisma.interview.update({ where: { id: interviewId }, data: { status: 'EXPIRED' } });
    return NextResponse.json({ error: 'Interview expired' }, { status: 410 });
  }

  const roomName = `interview-${interviewId}`;

  const metadata: AgentJobMetadata = {
    interviewId,
    language: 'en',
    interviewerName: 'AI Interviewer',
    questions: interview.questions as { id: string; text: string }[],
  };

  try {
    const roomService = new RoomServiceClient(livekitUrl, livekitApiKey, livekitApiSecret);
    await roomService.createRoom({ name: roomName, metadata: JSON.stringify(metadata) });
  } catch (err) {
    console.error('LiveKit error:', err);
    return NextResponse.json({ error: 'Failed to create room' }, { status: 500 });
  }

  const at = new AccessToken(livekitApiKey, livekitApiSecret, {
    identity: `interviewee-${Date.now()}`,
    name: 'Interviewee',
  });
  at.addGrant({ room: roomName, roomJoin: true, canPublish: true, canSubscribe: true });
  const accessToken = await at.toJwt();

  await prisma.interview.update({ where: { id: interviewId }, data: { status: 'IN_PROGRESS' } });

  return NextResponse.json({ livekitUrl, accessToken, roomName });
}

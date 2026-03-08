import { NextRequest, NextResponse } from 'next/server';
import { AccessToken, RoomServiceClient } from 'livekit-server-sdk';
import { createDbClient } from '@iterate/database';

function getEnv(key: string): string {
  const val = process.env[key];
  if (!val) throw new Error(`Missing env var: ${key}`);
  return val;
}

export async function POST(req: NextRequest) {
  const body = await req.json() as { sessionId?: string };
  const { sessionId } = body;

  if (!sessionId || typeof sessionId !== 'string') {
    return NextResponse.json({ error: 'sessionId required' }, { status: 400 });
  }

  const supabaseUrl = getEnv('SUPABASE_URL');
  const supabaseKey = getEnv('SUPABASE_SERVICE_ROLE_KEY');
  const livekitUrl = getEnv('LIVEKIT_URL');
  const livekitApiKey = getEnv('LIVEKIT_API_KEY');
  const livekitApiSecret = getEnv('LIVEKIT_API_SECRET');

  const db = createDbClient(supabaseUrl, supabaseKey);

  let session;
  try {
    session = await db.getSession(sessionId);
  } catch (err) {
    console.error('DB error:', err);
    return NextResponse.json({ error: 'Database error' }, { status: 500 });
  }

  if (!session) {
    return NextResponse.json({ error: 'Session not found' }, { status: 404 });
  }

  if (session.status !== 'pending') {
    const messages: Record<string, string> = {
      completed: 'このインタビューはすでに完了しています。',
      expired: 'このインタビューの有効期限が切れています。',
      in_progress: 'このインタビューはすでに進行中です。',
    };
    return NextResponse.json({ error: messages[session.status] ?? 'Session unavailable' }, { status: 410 });
  }

  if (new Date(session.expires_at) < new Date()) {
    await db.updateStatus(sessionId, 'expired').catch(console.error);
    return NextResponse.json({ error: 'Session expired' }, { status: 410 });
  }

  const roomName = `interview-${sessionId}`;

  try {
    const roomService = new RoomServiceClient(livekitUrl, livekitApiKey, livekitApiSecret);
    await roomService.createRoom({
      name: roomName,
      metadata: JSON.stringify({ sessionId }),
    });
  } catch (err) {
    console.error('LiveKit room creation error:', err);
    return NextResponse.json({ error: 'Failed to create room' }, { status: 500 });
  }

  const at = new AccessToken(livekitApiKey, livekitApiSecret, {
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

  await db.updateStatus(sessionId, 'in_progress').catch(console.error);

  return NextResponse.json({ livekitUrl, accessToken, roomName });
}

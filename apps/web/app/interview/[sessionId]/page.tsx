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

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

  if (new Date(interview.expiresAt) < new Date() && interview.status === 'PENDING') {
    await prisma.interview.update({
      where: { id: interviewId },
      data: { status: 'EXPIRED' },
    });
  }

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

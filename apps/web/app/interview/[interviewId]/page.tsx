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
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <p className="text-zinc-400">This interview link has expired.</p>
      </div>
    );
  }

  if (interview.status === 'COMPLETED') {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <p className="text-zinc-400">This interview has already been completed. Thank you.</p>
      </div>
    );
  }

  return <InterviewRoom interviewId={interviewId} />;
}

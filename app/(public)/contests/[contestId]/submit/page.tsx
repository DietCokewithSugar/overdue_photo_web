import { notFound } from 'next/navigation';

import { ContestSubmissionScreen } from '@/features/contests/components/contest-submission-screen';

interface ContestSubmitPageProps {
  params: Promise<{ contestId: string }>;
}

export default async function ContestSubmitPage({ params }: ContestSubmitPageProps) {
  const { contestId } = await params;

  if (!contestId) {
    notFound();
  }

  return <ContestSubmissionScreen contestId={contestId} />;
}

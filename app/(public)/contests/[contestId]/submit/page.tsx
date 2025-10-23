import { notFound } from 'next/navigation';

import { ContestSubmissionScreen } from '@/features/contests/components/contest-submission-screen';

interface ContestSubmitPageProps {
  params: { contestId: string };
}

export default function ContestSubmitPage({ params }: ContestSubmitPageProps) {
  if (!params.contestId) {
    notFound();
  }

  return <ContestSubmissionScreen contestId={params.contestId} />;
}

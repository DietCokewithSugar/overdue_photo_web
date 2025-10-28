import { notFound } from 'next/navigation';

import { ContestDetailScreen } from '@/features/contests/components/contest-detail-screen';

interface ContestPageProps {
  params: Promise<{ contestId: string }>;
}

export default async function ContestPage({ params }: ContestPageProps) {
  const { contestId } = await params;

  if (!contestId) {
    notFound();
  }

  return <ContestDetailScreen contestId={contestId} />;
}

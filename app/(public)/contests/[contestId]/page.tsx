import { notFound } from 'next/navigation';

import { ContestDetailScreen } from '@/features/contests/components/contest-detail-screen';

interface ContestPageProps {
  params: { contestId: string };
}

export default function ContestPage({ params }: ContestPageProps) {
  if (!params.contestId) {
    notFound();
  }

  return <ContestDetailScreen contestId={params.contestId} />;
}

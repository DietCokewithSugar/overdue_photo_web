import { ProfileContestEntriesScreen } from '@/features/profile/components/profile-contest-entries';

interface PageProps {
  params: Promise<{ contestId: string }>;
}

export default async function ProfileContestEntriesPage({ params }: PageProps) {
  const { contestId } = await params;
  return <ProfileContestEntriesScreen contestId={contestId} />;
}

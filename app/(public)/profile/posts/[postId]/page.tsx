import { ProfilePostDetailScreen } from '@/features/profile/components/profile-post-detail';

interface PageProps {
  params: Promise<{ postId: string }>;
}

export default async function ProfilePostDetailPage({ params }: PageProps) {
  const { postId } = await params;
  return <ProfilePostDetailScreen postId={postId} />;
}

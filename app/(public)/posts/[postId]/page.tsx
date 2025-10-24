import { notFound } from 'next/navigation';

import { PostDetailScreen } from '@/features/posts/components/post-detail-screen';

interface PostPageProps {
  params: Promise<{ postId: string }>;
}

export default async function PostPage({ params }: PostPageProps) {
  const { postId } = await params;

  if (!postId) {
    notFound();
  }

  return <PostDetailScreen postId={postId} />;
}

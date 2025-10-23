import { notFound } from 'next/navigation';

import { PostDetailScreen } from '@/features/posts/components/post-detail-screen';

interface PostPageProps {
  params: { postId: string };
}

export default function PostPage({ params }: PostPageProps) {
  if (!params.postId) {
    notFound();
  }

  return <PostDetailScreen postId={params.postId} />;
}

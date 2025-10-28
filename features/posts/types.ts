export interface PostImage {
  id: string;
  post_id: string;
  storage_path: string;
  thumbnail_path: string | null;
  width: number | null;
  height: number | null;
  blurhash: string | null;
  sort_order: number;
  created_at: string;
}

export interface PostAuthor {
  id: string;
  display_name: string | null;
  avatar_url: string | null;
}

export interface PostDto {
  id: string;
  author_id: string;
  title: string;
  content_richtext: Record<string, unknown> | null;
  content_plaintext: string | null;
  is_featured: boolean;
  status: 'draft' | 'published' | 'archived';
  published_at: string | null;
  created_at: string;
  updated_at: string;
  images: PostImage[];
  likesCount: number;
  commentsCount: number;
  author: PostAuthor | null;
}

export interface PaginatedPostsResponse {
  items: PostDto[];
  nextCursor: string | null;
}

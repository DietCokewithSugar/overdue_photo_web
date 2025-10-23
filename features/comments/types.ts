export interface CommentDto {
  id: string;
  post_id: string;
  author_id: string;
  body: string;
  parent_comment_id: string | null;
  status: 'active' | 'deleted' | 'hidden';
  created_at: string;
  updated_at: string;
  author: {
    id: string;
    display_name: string;
    avatar_url: string | null;
  } | null;
}

export interface PaginatedCommentsResponse {
  items: CommentDto[];
  nextCursor: string | null;
}

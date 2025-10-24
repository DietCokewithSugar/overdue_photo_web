import type { PostDto } from './types';

const formatNameFromString = (value: string) => {
  const trimmed = value.trim();
  if (!trimmed) return '';
  const chars = Array.from(trimmed);
  return chars.slice(0, 2).join('').toUpperCase();
};

export const getAuthorInitials = (post: PostDto) => {
  if (post.author?.display_name) {
    const initials = formatNameFromString(post.author.display_name);
    if (initials) return initials;
  }

  const compact = post.author_id.replace(/-/g, '');
  return compact.slice(0, 2).toUpperCase() || 'US';
};

export const getAuthorLabel = (post: PostDto) => {
  const displayName = post.author?.display_name?.trim();
  if (displayName) {
    return displayName;
  }

  const compact = post.author_id.replace(/-/g, '');
  return `用户 ${compact.slice(0, 6) || '访客'}`;
};

export const getPostPublishedDate = (post: PostDto) => {
  const timestamp = post.published_at ?? post.created_at;

  if (!timestamp) {
    return null;
  }

  return new Date(timestamp).toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  });
};

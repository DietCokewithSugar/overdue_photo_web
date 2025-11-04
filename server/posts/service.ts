import 'server-only';

import { getSupabaseAdminClient } from '@/lib/supabase';
import { resolveUserRole } from '@/server/auth';
import type { Database } from '@/types/database';

import {
  ForbiddenError,
  InternalServerError,
  NotFoundError,
  UnprocessableEntityError
} from '@/server/errors';
import {
  createPostInputSchema,
  updatePostInputSchema,
  type CreatePostInput,
  type UpdatePostInput
} from './schema';

type PostRow = Database['public']['Tables']['posts']['Row'];
type PostImageRow = Database['public']['Tables']['post_images']['Row'];
type ProfileRow = Database['public']['Tables']['profiles']['Row'];

export type PostAuthor = Pick<ProfileRow, 'id' | 'display_name' | 'avatar_url'>;

export type PostWithImages = PostRow & {
  images: PostImageRow[];
  likesCount: number;
  commentsCount: number;
  author: PostAuthor | null;
};

const mapPost = (
  post: PostRow,
  images: PostImageRow[],
  likes = 0,
  comments = 0,
  author?: PostAuthor | null
): PostWithImages => ({
  ...post,
  images,
  likesCount: likes,
  commentsCount: comments,
  author: author ?? null
});

type PostRecord = PostRow & {
  post_images?: PostImageRow[];
  profiles?: PostAuthor | null;
};

export const createPost = async (authorId: string, payload: CreatePostInput): Promise<PostWithImages> => {
  const input = createPostInputSchema.parse(payload);
  const supabase = getSupabaseAdminClient();

  const publishedAt =
    input.status === 'published' ? input.publishedAt ?? new Date().toISOString() : null;

  const { data: post, error } = await supabase
    .from('posts')
    .insert({
      author_id: authorId,
      title: input.title,
      content_richtext: input.contentRichtext ?? null,
      content_plaintext: input.contentPlaintext ?? null,
      status: input.status,
      published_at: publishedAt
    })
    .select()
    .single();

  if (error || !post) {
    throw new UnprocessableEntityError(error?.message ?? '创建帖子失败');
  }

  const imagesPayload = input.images.map((image, index) => ({
    post_id: post.id,
    storage_path: image.storagePath,
    thumbnail_path: image.thumbnailPath ?? null,
    width: image.width ?? null,
    height: image.height ?? null,
    blurhash: image.blurhash ?? null,
    sort_order: image.sortOrder ?? index
  }));

  const { data: images, error: imageError } = await supabase
    .from('post_images')
    .insert(imagesPayload)
    .select()
    .order('sort_order', { ascending: true });

  if (imageError || !images) {
    await supabase.from('posts').delete().eq('id', post.id);
    throw new UnprocessableEntityError(imageError?.message ?? '保存帖子图片失败');
  }

  const { data: authorProfile, error: authorError } = await supabase
    .from('profiles')
    .select('id, display_name, avatar_url')
    .eq('id', authorId)
    .maybeSingle();

  if (authorError) {
    throw new InternalServerError(authorError.message);
  }

  const author = authorProfile
    ? {
        id: authorProfile.id,
        display_name: authorProfile.display_name,
        avatar_url: authorProfile.avatar_url
      }
    : null;

  return mapPost(post, images, 0, 0, author);
};

export const getPostById = async (postId: string): Promise<PostWithImages> => {
  const supabase = getSupabaseAdminClient();
  const { data: post, error } = await supabase
    .from('posts')
    .select('*')
    .eq('id', postId)
    .maybeSingle();

  if (error) {
    throw new InternalServerError(error.message);
  }

  if (!post) {
    throw new NotFoundError('帖子不存在');
  }

  const [{ data: images, error: imagesError }, statsResult, authorResult] = await Promise.all([
    supabase
      .from('post_images')
      .select('*')
      .eq('post_id', post.id)
      .order('sort_order', { ascending: true }),
    supabase.from('post_statistics').select('*').eq('post_id', post.id).maybeSingle(),
    supabase
      .from('profiles')
      .select('id, display_name, avatar_url')
      .eq('id', post.author_id)
      .maybeSingle()
  ]);

  if (imagesError || !images) {
    throw new InternalServerError(imagesError?.message ?? '加载帖子图片失败');
  }

  if (statsResult.error) {
    throw new InternalServerError(statsResult.error.message);
  }

  if (authorResult.error) {
    throw new InternalServerError(authorResult.error.message);
  }

  const stats = statsResult.data;
  const authorProfile = authorResult.data
    ? {
        id: authorResult.data.id,
        display_name: authorResult.data.display_name,
        avatar_url: authorResult.data.avatar_url
      }
    : null;

  return mapPost(post, images, stats?.likes_count ?? 0, stats?.comments_count ?? 0, authorProfile);
};

const getPostStats = async (postId: string) => {
  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from('post_statistics')
    .select('*')
    .eq('post_id', postId)
    .maybeSingle();

  if (error) {
    throw new InternalServerError(error.message);
  }

  return {
    likesCount: data?.likes_count ?? 0,
    commentsCount: data?.comments_count ?? 0
  };
};

export interface ListPostsOptions {
  authorId?: string;
  cursor?: string;
  limit?: number;
  filter?: 'latest' | 'featured';
  status?: Database['public']['Enums']['post_status'];
}

export const listPosts = async (options: ListPostsOptions = {}): Promise<PostWithImages[]> => {
  const supabase = getSupabaseAdminClient();
  const limit = Math.min(options.limit ?? 20, 50);

  let query = supabase
    .from('posts')
    .select('*, post_images(*), profiles!posts_author_id_fkey(id, display_name, avatar_url)')
    .order('published_at', { ascending: false, nullsFirst: false })
    .order('created_at', { ascending: false })
    .order('sort_order', { ascending: true, referencedTable: 'post_images' });

  if (options.filter === 'latest') {
    query = query.eq('status', 'published');
  }

  if (options.filter === 'featured') {
    query = query.eq('is_featured', true).eq('status', 'published');
  }

  if (options.status) {
    query = query.eq('status', options.status);
  }

  if (options.authorId) {
    query = query.eq('author_id', options.authorId);
  }

  if (options.cursor) {
    query = query.lt('published_at', options.cursor);
  }

  query = query.limit(limit);

  const { data, error } = await query;

  if (error || !data) {
    throw new InternalServerError(error?.message ?? '加载帖子失败');
  }

  const postIds = data.map((item) => item.id);

  const { data: statsData, error: statsError } = await supabase
    .from('post_statistics')
    .select('*')
    .in('post_id', postIds.length > 0 ? postIds : ['00000000-0000-0000-0000-000000000000']);

  if (statsError) {
    throw new InternalServerError(statsError.message);
  }

  const statsMap = new Map(
    (statsData ?? []).map((stat) => [stat.post_id ?? '', stat])
  );

  return (data as PostRecord[]).map((post) => {
    const { post_images, profiles, ...rest } = post;
    const images = post_images ?? [];
    const stats = statsMap.get(post.id);
    const author = profiles
      ? {
          id: profiles.id,
          display_name: profiles.display_name,
          avatar_url: profiles.avatar_url
        }
      : null;

    return mapPost(rest as PostRow, images, stats?.likes_count ?? 0, stats?.comments_count ?? 0, author);
  });
};

export const updatePost = async (
  postId: string,
  authorId: string,
  payload: UpdatePostInput
): Promise<PostWithImages> => {
  const supabase = getSupabaseAdminClient();
  const postResult = await supabase.from('posts').select('*').eq('id', postId).maybeSingle();

  if (postResult.error) {
    throw new InternalServerError(postResult.error.message);
  }

  const existing = postResult.data;

  if (!existing) {
    throw new NotFoundError('帖子不存在');
  }

  const actorRole = await resolveUserRole(authorId);
  const isOwner = existing.author_id === authorId;
  const isAdmin = actorRole === 'admin';

  if (!isOwner && !isAdmin) {
    throw new ForbiddenError('无权修改该帖子');
  }

  const input = updatePostInputSchema.parse(payload);

  // 如果尝试设置精选状态，检查是否为管理员
  if (input.isFeatured !== undefined && input.isFeatured !== existing.is_featured) {
    if (!isAdmin) {
      throw new ForbiddenError('只有管理员可以设置精选状态');
    }
  }

  const nextStatus = input.status ?? existing.status;
  const publishedAt =
    nextStatus === 'published'
      ? input.publishedAt ?? existing.published_at ?? new Date().toISOString()
      : existing.published_at;

  const nextIsFeatured = input.isFeatured ?? existing.is_featured;

  const updatePayload = {
    title: input.title ?? existing.title,
    content_richtext:
      input.contentRichtext === undefined ? existing.content_richtext : input.contentRichtext,
    content_plaintext:
      input.contentPlaintext === undefined ? existing.content_plaintext : input.contentPlaintext,
    status: nextStatus,
    is_featured: nextIsFeatured,
    published_at: publishedAt
  };

  const { data: updatedPost, error: updateError } = await supabase
    .from('posts')
    .update(updatePayload)
    .eq('id', postId)
    .select()
    .single();

  if (updateError || !updatedPost) {
    throw new UnprocessableEntityError(updateError?.message ?? '更新帖子失败');
  }

  // 如果设为精选，记录到 post_features 表
  if (input.isFeatured !== undefined && nextIsFeatured && !existing.is_featured) {
    const { error: featureError } = await supabase.from('post_features').insert({
      post_id: postId,
      featured_by: authorId,
      featured_at: new Date().toISOString()
    });

    if (featureError) {
      // 记录操作历史失败不影响主操作，但记录错误
      console.error('Failed to record featured action:', featureError);
    }
  }

  if (input.images) {
    await supabase.from('post_images').delete().eq('post_id', postId);

    const imagesPayload = input.images.map((image, index) => ({
      post_id: postId,
      storage_path: image.storagePath,
      thumbnail_path: image.thumbnailPath ?? null,
      width: image.width ?? null,
      height: image.height ?? null,
      blurhash: image.blurhash ?? null,
      sort_order: image.sortOrder ?? index
    }));

    const { error: insertError } = await supabase.from('post_images').insert(imagesPayload);

    if (insertError) {
      throw new InternalServerError(insertError.message);
    }
  }

  return getPostById(postId);
};

export const deletePost = async (postId: string, authorId: string) => {
  const supabase = getSupabaseAdminClient();
  const fetchResult = await supabase.from('posts').select('author_id').eq('id', postId).maybeSingle();

  if (fetchResult.error) {
    throw new InternalServerError(fetchResult.error.message);
  }

  const post = fetchResult.data;

  if (!post) {
    throw new NotFoundError('帖子不存在');
  }

  const role = await resolveUserRole(authorId);
  const isOwner = post.author_id === authorId;
  const isAdmin = role === 'admin';

  if (!isOwner && !isAdmin) {
    throw new ForbiddenError('无权删除该帖子');
  }

  const { error } = await supabase.from('posts').delete().eq('id', postId);

  if (error) {
    throw new InternalServerError(error.message);
  }
};

export const likePost = async (postId: string, userId: string) => {
  const supabase = getSupabaseAdminClient();
  const { error } = await supabase
    .from('post_likes')
    .insert({ post_id: postId, user_id: userId });

  if (error && error.code !== '23505') {
    throw new InternalServerError(error.message);
  }

  const stats = await getPostStats(postId);
  return stats.likesCount;
};

export const unlikePost = async (postId: string, userId: string) => {
  const supabase = getSupabaseAdminClient();
  const { error } = await supabase
    .from('post_likes')
    .delete()
    .eq('post_id', postId)
    .eq('user_id', userId);

  if (error) {
    throw new InternalServerError(error.message);
  }

  const stats = await getPostStats(postId);
  return stats.likesCount;
};

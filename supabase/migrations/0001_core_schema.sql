-- Core schema for 过期相册（Expired Album）
-- Run inside Supabase SQL editor or via supabase CLI migrations.

-- Extensions
create extension if not exists "pgcrypto";

-- Enums
create type public.user_role as enum ('user', 'admin');
create type public.post_status as enum ('draft', 'published', 'archived');
create type public.comment_status as enum ('active', 'deleted', 'hidden');
create type public.contest_status as enum ('draft', 'published', 'closed');
create type public.entry_type as enum ('single', 'collection');
create type public.entry_status as enum ('pending', 'approved', 'rejected');

-- Helper functions
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

-- Base tables
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null,
  avatar_url text,
  bio text,
  role public.user_role not null default 'user',
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table public.follows (
  follower_id uuid not null references public.profiles(id) on delete cascade,
  followed_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default timezone('utc', now()),
  primary key (follower_id, followed_id),
  check (follower_id <> followed_id)
);

create table public.posts (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  content_richtext jsonb,
  content_plaintext text,
  is_featured boolean not null default false,
  status public.post_status not null default 'draft',
  published_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table public.post_images (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts(id) on delete cascade,
  storage_path text not null,
  thumbnail_path text,
  width integer,
  height integer,
  blurhash text,
  sort_order integer not null default 0,
  created_at timestamptz not null default timezone('utc', now())
);

create unique index post_images_sort_order_idx on public.post_images (post_id, sort_order);

create table public.post_likes (
  post_id uuid not null references public.posts(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default timezone('utc', now()),
  primary key (post_id, user_id)
);

create table public.post_comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts(id) on delete cascade,
  author_id uuid not null references public.profiles(id) on delete cascade,
  body text not null,
  parent_comment_id uuid references public.post_comments(id) on delete cascade,
  status public.comment_status not null default 'active',
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index post_comments_post_id_idx on public.post_comments (post_id);

create table public.post_features (
  post_id uuid not null references public.posts(id) on delete cascade,
  featured_by uuid references public.profiles(id) on delete set null,
  featured_at timestamptz not null default timezone('utc', now()),
  primary key (post_id, featured_at)
);

create table public.contests (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  slug text not null unique,
  description text,
  poster_path text,
  submission_starts_at timestamptz not null,
  submission_ends_at timestamptz not null,
  single_submission_limit integer not null default 0,
  collection_submission_limit integer not null default 0,
  single_file_size_limit_mb integer not null default 20,
  status public.contest_status not null default 'draft',
  created_by uuid not null references public.profiles(id) on delete restrict,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  check (submission_ends_at > submission_starts_at)
);

create table public.contest_entries (
  id uuid primary key default gen_random_uuid(),
  contest_id uuid not null references public.contests(id) on delete cascade,
  author_id uuid not null references public.profiles(id) on delete cascade,
  entry_type public.entry_type not null,
  title text not null,
  description text,
  status public.entry_status not null default 'pending',
  submitted_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index contest_entries_contest_idx on public.contest_entries (contest_id, status);

create table public.contest_entry_images (
  id uuid primary key default gen_random_uuid(),
  entry_id uuid not null references public.contest_entries(id) on delete cascade,
  storage_path text not null,
  thumbnail_path text,
  width integer,
  height integer,
  sort_order integer not null default 0,
  created_at timestamptz not null default timezone('utc', now())
);

create unique index contest_entry_images_sort_idx on public.contest_entry_images (entry_id, sort_order);

create table public.contest_entry_audit_logs (
  id uuid primary key default gen_random_uuid(),
  entry_id uuid not null references public.contest_entries(id) on delete cascade,
  action text not null,
  operator_id uuid references public.profiles(id) on delete set null,
  notes text,
  created_at timestamptz not null default timezone('utc', now())
);

create table public.user_settings (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  receive_notifications boolean not null default true,
  language text default 'zh-CN',
  timezone text default 'Asia/Shanghai',
  updated_at timestamptz not null default timezone('utc', now())
);

create table public.media_variants (
  id uuid primary key default gen_random_uuid(),
  original_path text not null,
  variant_type text not null,
  storage_path text not null,
  width integer,
  height integer,
  filesize integer,
  created_at timestamptz not null default timezone('utc', now())
);

create table public.admin_notes (
  id uuid primary key default gen_random_uuid(),
  resource_type text not null,
  resource_id uuid not null,
  note text not null,
  author_id uuid not null references public.profiles(id) on delete set null,
  created_at timestamptz not null default timezone('utc', now())
);

create or replace function public.is_admin(user_id uuid)
returns boolean
language sql
stable
as $$
  select exists(select 1 from public.profiles p where p.id = user_id and p.role = 'admin');
$$;

-- Materialized metrics
create view public.post_statistics as
select
  p.id as post_id,
  coalesce(l.likes_count, 0) as likes_count,
  coalesce(c.comments_count, 0) as comments_count
from public.posts p
left join (
  select post_id, count(*)::int as likes_count
  from public.post_likes
  group by post_id
) l on l.post_id = p.id
left join (
  select post_id, count(*) filter (where status = 'active')::int as comments_count
  from public.post_comments
  group by post_id
) c on c.post_id = p.id;

create view public.contest_statistics as
select
  contest_id,
  count(*)::int as total_entries,
  count(*) filter (where status = 'approved')::int as approved_entries,
  count(distinct author_id)::int as participant_count
from public.contest_entries
group by contest_id;

-- Triggers
create trigger set_timestamp_on_profiles
before update on public.profiles
for each row
execute function public.set_updated_at();

create trigger set_timestamp_on_posts
before update on public.posts
for each row
execute function public.set_updated_at();

create trigger set_timestamp_on_post_comments
before update on public.post_comments
for each row
execute function public.set_updated_at();

create trigger set_timestamp_on_contests
before update on public.contests
for each row
execute function public.set_updated_at();

create trigger set_timestamp_on_contest_entries
before update on public.contest_entries
for each row
execute function public.set_updated_at();

create trigger set_timestamp_on_user_settings
before update on public.user_settings
for each row
execute function public.set_updated_at();

-- Row Level Security
alter table public.profiles enable row level security;
alter table public.posts enable row level security;
alter table public.post_images enable row level security;
alter table public.post_likes enable row level security;
alter table public.post_comments enable row level security;
alter table public.post_features enable row level security;
alter table public.contests enable row level security;
alter table public.contest_entries enable row level security;
alter table public.contest_entry_images enable row level security;
alter table public.contest_entry_audit_logs enable row level security;
alter table public.user_settings enable row level security;
alter table public.media_variants enable row level security;
alter table public.admin_notes enable row level security;

-- Policies
create policy "Public read profiles" on public.profiles
for select using (true);

create policy "Users manage own profile" on public.profiles
for all
using (auth.uid() = id)
with check (auth.uid() = id);

create policy "Public read posts" on public.posts
for select
using (status = 'published' or auth.uid() = author_id or public.is_admin(auth.uid()));

create policy "Users manage own posts" on public.posts
for all
using (auth.uid() = author_id or public.is_admin(auth.uid()))
with check (auth.uid() = author_id or public.is_admin(auth.uid()));

create policy "Public read post images" on public.post_images
for select using (true);

create policy "Users manage post images" on public.post_images
for all
using (auth.uid() = (select author_id from public.posts where id = post_images.post_id) or public.is_admin(auth.uid()))
with check (auth.uid() = (select author_id from public.posts where id = post_images.post_id) or public.is_admin(auth.uid()));

create policy "Users like posts" on public.post_likes
for insert
with check (auth.uid() = user_id);

create policy "Users manage own post likes" on public.post_likes
for delete
using (auth.uid() = user_id);

create policy "Public see post likes" on public.post_likes
for select using (true);

create policy "Public read comments" on public.post_comments
for select using (status = 'active' or public.is_admin(auth.uid()) or auth.uid() = author_id);

create policy "Users manage own comments" on public.post_comments
for all
using (auth.uid() = author_id or public.is_admin(auth.uid()))
with check (auth.uid() = author_id or public.is_admin(auth.uid()));

create policy "Public read contests" on public.contests
for select using (status in ('published', 'closed') or public.is_admin(auth.uid()));

create policy "Admins manage contests" on public.contests
for all
using (public.is_admin(auth.uid()))
with check (public.is_admin(auth.uid()));

create policy "Public read contest entries" on public.contest_entries
for select using (status = 'approved' or auth.uid() = author_id or public.is_admin(auth.uid()));

create policy "Users manage own entries" on public.contest_entries
for all
using (auth.uid() = author_id or public.is_admin(auth.uid()))
with check (auth.uid() = author_id or public.is_admin(auth.uid()));

create policy "Public read contest entry images" on public.contest_entry_images
for select using (true);

create policy "Users manage entry images" on public.contest_entry_images
for all
using (
  auth.uid() = (
    select author_id from public.contest_entries where id = contest_entry_images.entry_id
  ) or public.is_admin(auth.uid())
)
with check (
  auth.uid() = (
    select author_id from public.contest_entries where id = contest_entry_images.entry_id
  ) or public.is_admin(auth.uid())
);

create policy "Admins manage entry audits" on public.contest_entry_audit_logs
for all
using (public.is_admin(auth.uid()))
with check (public.is_admin(auth.uid()));

create policy "Users read own settings" on public.user_settings
for select using (auth.uid() = user_id);

create policy "Users manage own settings" on public.user_settings
for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "Admins manage media variants" on public.media_variants
for all
using (public.is_admin(auth.uid()))
with check (public.is_admin(auth.uid()));

create policy "Admins manage admin notes" on public.admin_notes
for all
using (public.is_admin(auth.uid()))
with check (public.is_admin(auth.uid()));

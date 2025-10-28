export interface ContestDto {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  poster_path: string | null;
  submission_starts_at: string;
  submission_ends_at: string;
  single_submission_limit: number;
  collection_submission_limit: number;
  single_file_size_limit_mb: number;
  status: 'draft' | 'published' | 'closed';
  created_at: string;
  updated_at: string;
  totalEntries: number;
  approvedEntries: number;
  participantCount: number;
}

export interface ContestListResponse {
  items: ContestDto[];
  nextCursor: string | null;
}

export interface ContestEntryDto {
  id: string;
  contest_id: string;
  author_id: string;
  entry_type: 'single' | 'collection';
  title: string;
  description: string | null;
  status: 'pending' | 'approved' | 'rejected';
  submitted_at: string;
  updated_at: string;
  images: Array<{
    id: string;
    storage_path: string;
    thumbnail_path: string | null;
    sort_order: number;
  }>;
  author: {
    id: string;
    display_name: string;
    avatar_url: string | null;
  } | null;
  contest?: ContestSummaryDto | null;
}

export interface ContestEntriesResponse {
  items: ContestEntryDto[];
  nextCursor: string | null;
}

export interface ContestSummaryDto {
  id: string;
  title: string;
  submission_starts_at: string;
  submission_ends_at: string;
  status: 'draft' | 'published' | 'closed';
}

export interface UserContestEntriesResponse {
  items: Array<ContestEntryDto & { contest: ContestSummaryDto }>;
  nextCursor: string | null;
}

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      admin_notes: {
        Row: {
          author_id: string;
          created_at: string;
          id: string;
          note: string;
          resource_id: string;
          resource_type: string;
        };
        Insert: {
          author_id: string;
          created_at?: string;
          id?: string;
          note: string;
          resource_id: string;
          resource_type: string;
        };
        Update: {
          author_id?: string;
          created_at?: string;
          id?: string;
          note?: string;
          resource_id?: string;
          resource_type?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'admin_notes_author_id_fkey';
            columns: ['author_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          }
        ];
      };
      contest_entries: {
        Row: {
          author_id: string;
          contest_id: string;
          description: string | null;
          entry_type: Database['public']['Enums']['entry_type'];
          id: string;
          status: Database['public']['Enums']['entry_status'];
          submitted_at: string;
          title: string;
          updated_at: string;
        };
        Insert: {
          author_id: string;
          contest_id: string;
          description?: string | null;
          entry_type: Database['public']['Enums']['entry_type'];
          id?: string;
          status?: Database['public']['Enums']['entry_status'];
          submitted_at?: string;
          title: string;
          updated_at?: string;
        };
        Update: {
          author_id?: string;
          contest_id?: string;
          description?: string | null;
          entry_type?: Database['public']['Enums']['entry_type'];
          id?: string;
          status?: Database['public']['Enums']['entry_status'];
          submitted_at?: string;
          title?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'contest_entries_author_id_fkey';
            columns: ['author_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'contest_entries_contest_id_fkey';
            columns: ['contest_id'];
            isOneToOne: false;
            referencedRelation: 'contests';
            referencedColumns: ['id'];
          }
        ];
      };
      contest_entry_audit_logs: {
        Row: {
          action: string;
          created_at: string;
          entry_id: string;
          id: string;
          notes: string | null;
          operator_id: string | null;
        };
        Insert: {
          action: string;
          created_at?: string;
          entry_id: string;
          id?: string;
          notes?: string | null;
          operator_id?: string | null;
        };
        Update: {
          action?: string;
          created_at?: string;
          entry_id?: string;
          id?: string;
          notes?: string | null;
          operator_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'contest_entry_audit_logs_entry_id_fkey';
            columns: ['entry_id'];
            isOneToOne: false;
            referencedRelation: 'contest_entries';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'contest_entry_audit_logs_operator_id_fkey';
            columns: ['operator_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          }
        ];
      };
      contest_entry_images: {
        Row: {
          created_at: string;
          entry_id: string;
          height: number | null;
          id: string;
          sort_order: number;
          storage_path: string;
          thumbnail_path: string | null;
          width: number | null;
        };
        Insert: {
          created_at?: string;
          entry_id: string;
          height?: number | null;
          id?: string;
          sort_order?: number;
          storage_path: string;
          thumbnail_path?: string | null;
          width?: number | null;
        };
        Update: {
          created_at?: string;
          entry_id?: string;
          height?: number | null;
          id?: string;
          sort_order?: number;
          storage_path?: string;
          thumbnail_path?: string | null;
          width?: number | null;
        };
        Relationships: [
          {
            foreignKeyName: 'contest_entry_images_entry_id_fkey';
            columns: ['entry_id'];
            isOneToOne: false;
            referencedRelation: 'contest_entries';
            referencedColumns: ['id'];
          }
        ];
      };
      contests: {
        Row: {
          collection_submission_limit: number;
          created_at: string;
          created_by: string;
          description: string | null;
          id: string;
          poster_path: string | null;
          single_file_size_limit_mb: number;
          single_submission_limit: number;
          slug: string;
          status: Database['public']['Enums']['contest_status'];
          submission_ends_at: string;
          submission_starts_at: string;
          title: string;
          updated_at: string;
        };
        Insert: {
          collection_submission_limit?: number;
          created_at?: string;
          created_by: string;
          description?: string | null;
          id?: string;
          poster_path?: string | null;
          single_file_size_limit_mb?: number;
          single_submission_limit?: number;
          slug: string;
          status?: Database['public']['Enums']['contest_status'];
          submission_ends_at: string;
          submission_starts_at: string;
          title: string;
          updated_at?: string;
        };
        Update: {
          collection_submission_limit?: number;
          created_at?: string;
          created_by?: string;
          description?: string | null;
          id?: string;
          poster_path?: string | null;
          single_file_size_limit_mb?: number;
          single_submission_limit?: number;
          slug?: string;
          status?: Database['public']['Enums']['contest_status'];
          submission_ends_at?: string;
          submission_starts_at?: string;
          title?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'contests_created_by_fkey';
            columns: ['created_by'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          }
        ];
      };
      follows: {
        Row: {
          followed_id: string;
          follower_id: string;
          created_at: string;
        };
        Insert: {
          followed_id: string;
          follower_id: string;
          created_at?: string;
        };
        Update: {
          followed_id?: string;
          follower_id?: string;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'follows_followed_id_fkey';
            columns: ['followed_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'follows_follower_id_fkey';
            columns: ['follower_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          }
        ];
      };
      media_variants: {
        Row: {
          created_at: string;
          filesize: number | null;
          height: number | null;
          id: string;
          original_path: string;
          storage_path: string;
          variant_type: string;
          width: number | null;
        };
        Insert: {
          created_at?: string;
          filesize?: number | null;
          height?: number | null;
          id?: string;
          original_path: string;
          storage_path: string;
          variant_type: string;
          width?: number | null;
        };
        Update: {
          created_at?: string;
          filesize?: number | null;
          height?: number | null;
          id?: string;
          original_path?: string;
          storage_path?: string;
          variant_type?: string;
          width?: number | null;
        };
        Relationships: [];
      };
      post_comments: {
        Row: {
          author_id: string;
          body: string;
          created_at: string;
          id: string;
          parent_comment_id: string | null;
          post_id: string;
          status: Database['public']['Enums']['comment_status'];
          updated_at: string;
        };
        Insert: {
          author_id: string;
          body: string;
          created_at?: string;
          id?: string;
          parent_comment_id?: string | null;
          post_id: string;
          status?: Database['public']['Enums']['comment_status'];
          updated_at?: string;
        };
        Update: {
          author_id?: string;
          body?: string;
          created_at?: string;
          id?: string;
          parent_comment_id?: string | null;
          post_id?: string;
          status?: Database['public']['Enums']['comment_status'];
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'post_comments_author_id_fkey';
            columns: ['author_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'post_comments_parent_comment_id_fkey';
            columns: ['parent_comment_id'];
            isOneToOne: false;
            referencedRelation: 'post_comments';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'post_comments_post_id_fkey';
            columns: ['post_id'];
            isOneToOne: false;
            referencedRelation: 'posts';
            referencedColumns: ['id'];
          }
        ];
      };
      post_features: {
        Row: {
          featured_at: string;
          featured_by: string | null;
          post_id: string;
        };
        Insert: {
          featured_at?: string;
          featured_by?: string | null;
          post_id: string;
        };
        Update: {
          featured_at?: string;
          featured_by?: string | null;
          post_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'post_features_featured_by_fkey';
            columns: ['featured_by'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'post_features_post_id_fkey';
            columns: ['post_id'];
            isOneToOne: false;
            referencedRelation: 'posts';
            referencedColumns: ['id'];
          }
        ];
      };
      post_images: {
        Row: {
          blurhash: string | null;
          created_at: string;
          height: number | null;
          id: string;
          post_id: string;
          sort_order: number;
          storage_path: string;
          thumbnail_path: string | null;
          width: number | null;
        };
        Insert: {
          blurhash?: string | null;
          created_at?: string;
          height?: number | null;
          id?: string;
          post_id: string;
          sort_order?: number;
          storage_path: string;
          thumbnail_path?: string | null;
          width?: number | null;
        };
        Update: {
          blurhash?: string | null;
          created_at?: string;
          height?: number | null;
          id?: string;
          post_id?: string;
          sort_order?: number;
          storage_path?: string;
          thumbnail_path?: string | null;
          width?: number | null;
        };
        Relationships: [
          {
            foreignKeyName: 'post_images_post_id_fkey';
            columns: ['post_id'];
            isOneToOne: false;
            referencedRelation: 'posts';
            referencedColumns: ['id'];
          }
        ];
      };
      post_likes: {
        Row: {
          created_at: string;
          post_id: string;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          post_id: string;
          user_id: string;
        };
        Update: {
          created_at?: string;
          post_id?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'post_likes_post_id_fkey';
            columns: ['post_id'];
            isOneToOne: false;
            referencedRelation: 'posts';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'post_likes_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          }
        ];
      };
      posts: {
        Row: {
          author_id: string;
          content_plaintext: string | null;
          content_richtext: Json | null;
          created_at: string;
          id: string;
          is_featured: boolean;
          published_at: string | null;
          status: Database['public']['Enums']['post_status'];
          title: string;
          updated_at: string;
        };
        Insert: {
          author_id: string;
          content_plaintext?: string | null;
          content_richtext?: Json | null;
          created_at?: string;
          id?: string;
          is_featured?: boolean;
          published_at?: string | null;
          status?: Database['public']['Enums']['post_status'];
          title: string;
          updated_at?: string;
        };
        Update: {
          author_id?: string;
          content_plaintext?: string | null;
          content_richtext?: Json | null;
          created_at?: string;
          id?: string;
          is_featured?: boolean;
          published_at?: string | null;
          status?: Database['public']['Enums']['post_status'];
          title?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'posts_author_id_fkey';
            columns: ['author_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          }
        ];
      };
      profiles: {
        Row: {
          avatar_url: string | null;
          bio: string | null;
          created_at: string;
          display_name: string;
          id: string;
          role: Database['public']['Enums']['user_role'];
          updated_at: string;
        };
        Insert: {
          avatar_url?: string | null;
          bio?: string | null;
          created_at?: string;
          display_name: string;
          id: string;
          role?: Database['public']['Enums']['user_role'];
          updated_at?: string;
        };
        Update: {
          avatar_url?: string | null;
          bio?: string | null;
          created_at?: string;
          display_name?: string;
          id?: string;
          role?: Database['public']['Enums']['user_role'];
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'profiles_id_fkey';
            columns: ['id'];
            isOneToOne: true;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          }
        ];
      };
      user_settings: {
        Row: {
          language: string | null;
          receive_notifications: boolean;
          timezone: string | null;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          language?: string | null;
          receive_notifications?: boolean;
          timezone?: string | null;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          language?: string | null;
          receive_notifications?: boolean;
          timezone?: string | null;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'user_settings_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: true;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          }
        ];
      };
    };
    Views: {
      post_statistics: {
        Row: {
          comments_count: number | null;
          likes_count: number | null;
          post_id: string | null;
        };
        Relationships: [];
      };
      contest_statistics: {
        Row: {
          contest_id: string | null;
          total_entries: number | null;
          approved_entries: number | null;
          participant_count: number | null;
        };
        Relationships: [];
      };
    };
    Functions: {
      is_admin: {
        Args: {
          user_id: string;
        };
        Returns: boolean;
      };
      set_updated_at: {
        Args: Record<PropertyKey, never>;
        Returns: unknown;
      };
    };
    Enums: {
      comment_status: 'active' | 'deleted' | 'hidden';
      contest_status: 'draft' | 'published' | 'closed';
      entry_status: 'pending' | 'approved' | 'rejected';
      entry_type: 'single' | 'collection';
      post_status: 'draft' | 'published' | 'archived';
      user_role: 'user' | 'admin';
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
}

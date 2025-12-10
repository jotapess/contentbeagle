// Database types for Supabase
// Run `npx supabase gen types typescript --project-id eiowwhicvrtawgotvswt > src/types/database.ts`
// to regenerate from the actual schema

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      teams: {
        Row: {
          id: string;
          name: string;
          slug: string;
          owner_id: string;
          plan: "free" | "pro" | "enterprise";
          settings: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          slug: string;
          owner_id: string;
          plan?: "free" | "pro" | "enterprise";
          settings?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          slug?: string;
          owner_id?: string;
          plan?: "free" | "pro" | "enterprise";
          settings?: Json;
          created_at?: string;
          updated_at?: string;
        };
      };
      team_members: {
        Row: {
          id: string;
          team_id: string;
          user_id: string;
          role: "owner" | "admin" | "editor" | "viewer";
          invited_by: string | null;
          invited_at: string | null;
          joined_at: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          team_id: string;
          user_id: string;
          role?: "owner" | "admin" | "editor" | "viewer";
          invited_by?: string | null;
          invited_at?: string | null;
          joined_at?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          team_id?: string;
          user_id?: string;
          role?: "owner" | "admin" | "editor" | "viewer";
          invited_by?: string | null;
          invited_at?: string | null;
          joined_at?: string;
          created_at?: string;
        };
      };
      profiles: {
        Row: {
          id: string;
          email: string;
          full_name: string | null;
          avatar_url: string | null;
          default_team_id: string | null;
          preferences: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          full_name?: string | null;
          avatar_url?: string | null;
          default_team_id?: string | null;
          preferences?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          full_name?: string | null;
          avatar_url?: string | null;
          default_team_id?: string | null;
          preferences?: Json;
          created_at?: string;
          updated_at?: string;
        };
      };
      brands: {
        Row: {
          id: string;
          team_id: string;
          name: string;
          website_url: string | null;
          logo_url: string | null;
          description: string | null;
          industry: string | null;
          target_audience: string | null;
          status: "pending" | "crawling" | "analyzing" | "ready" | "error";
          created_by: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          team_id: string;
          name: string;
          website_url?: string | null;
          logo_url?: string | null;
          description?: string | null;
          industry?: string | null;
          target_audience?: string | null;
          status?: "pending" | "crawling" | "analyzing" | "ready" | "error";
          created_by: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          team_id?: string;
          name?: string;
          website_url?: string | null;
          logo_url?: string | null;
          description?: string | null;
          industry?: string | null;
          target_audience?: string | null;
          status?: "pending" | "crawling" | "analyzing" | "ready" | "error";
          created_by?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      articles: {
        Row: {
          id: string;
          team_id: string;
          brand_id: string;
          title: string;
          slug: string | null;
          excerpt: string | null;
          content: string | null;
          content_html: string | null;
          status: "draft" | "editing" | "seo_review" | "cross_linking" | "humanizing" | "polished" | "approved" | "published" | "archived";
          input_type: "bullets" | "draft" | "research" | "topic_only" | null;
          original_input: string | null;
          target_audience: string | null;
          target_length: string | null;
          call_to_action: string | null;
          seo_title: string | null;
          seo_description: string | null;
          focus_keyword: string | null;
          secondary_keywords: string[];
          seo_score: number | null;
          suggested_links: Json;
          applied_links: Json;
          humanization_applied: boolean;
          humanization_rules_used: string[];
          ai_patterns_found: Json;
          word_count: number | null;
          reading_time_minutes: number | null;
          featured_image_url: string | null;
          published_url: string | null;
          published_at: string | null;
          created_by: string;
          assigned_to: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          team_id: string;
          brand_id: string;
          title: string;
          slug?: string | null;
          excerpt?: string | null;
          content?: string | null;
          content_html?: string | null;
          status?: "draft" | "editing" | "seo_review" | "cross_linking" | "humanizing" | "polished" | "approved" | "published" | "archived";
          input_type?: "bullets" | "draft" | "research" | "topic_only" | null;
          original_input?: string | null;
          target_audience?: string | null;
          target_length?: string | null;
          call_to_action?: string | null;
          seo_title?: string | null;
          seo_description?: string | null;
          focus_keyword?: string | null;
          secondary_keywords?: string[];
          seo_score?: number | null;
          suggested_links?: Json;
          applied_links?: Json;
          humanization_applied?: boolean;
          humanization_rules_used?: string[];
          ai_patterns_found?: Json;
          word_count?: number | null;
          reading_time_minutes?: number | null;
          featured_image_url?: string | null;
          published_url?: string | null;
          published_at?: string | null;
          created_by: string;
          assigned_to?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          team_id?: string;
          brand_id?: string;
          title?: string;
          slug?: string | null;
          excerpt?: string | null;
          content?: string | null;
          content_html?: string | null;
          status?: "draft" | "editing" | "seo_review" | "cross_linking" | "humanizing" | "polished" | "approved" | "published" | "archived";
          input_type?: "bullets" | "draft" | "research" | "topic_only" | null;
          original_input?: string | null;
          target_audience?: string | null;
          target_length?: string | null;
          call_to_action?: string | null;
          seo_title?: string | null;
          seo_description?: string | null;
          focus_keyword?: string | null;
          secondary_keywords?: string[];
          seo_score?: number | null;
          suggested_links?: Json;
          applied_links?: Json;
          humanization_applied?: boolean;
          humanization_rules_used?: string[];
          ai_patterns_found?: Json;
          word_count?: number | null;
          reading_time_minutes?: number | null;
          featured_image_url?: string | null;
          published_url?: string | null;
          published_at?: string | null;
          created_by?: string;
          assigned_to?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      ai_pattern_rules_global: {
        Row: {
          id: string;
          name: string;
          description: string | null;
          category: "phrase_replacement" | "sentence_structure" | "word_variety" | "transition_words" | "punctuation" | "paragraph_flow" | "tone_adjustment" | "custom";
          pattern_type: "regex" | "exact" | "semantic" | "ai_detection";
          pattern: string | null;
          replacement: string | null;
          replacement_options: string[];
          severity: "low" | "medium" | "high";
          is_active: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          description?: string | null;
          category: "phrase_replacement" | "sentence_structure" | "word_variety" | "transition_words" | "punctuation" | "paragraph_flow" | "tone_adjustment" | "custom";
          pattern_type: "regex" | "exact" | "semantic" | "ai_detection";
          pattern?: string | null;
          replacement?: string | null;
          replacement_options?: string[];
          severity?: "low" | "medium" | "high";
          is_active?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          description?: string | null;
          category?: "phrase_replacement" | "sentence_structure" | "word_variety" | "transition_words" | "punctuation" | "paragraph_flow" | "tone_adjustment" | "custom";
          pattern_type?: "regex" | "exact" | "semantic" | "ai_detection";
          pattern?: string | null;
          replacement?: string | null;
          replacement_options?: string[];
          severity?: "low" | "medium" | "high";
          is_active?: boolean;
          created_at?: string;
        };
      };
      api_providers: {
        Row: {
          id: string;
          name: string;
          base_url: string | null;
          docs_url: string | null;
          required_fields: Json;
          is_active: boolean;
        };
        Insert: {
          id: string;
          name: string;
          base_url?: string | null;
          docs_url?: string | null;
          required_fields?: Json;
          is_active?: boolean;
        };
        Update: {
          id?: string;
          name?: string;
          base_url?: string | null;
          docs_url?: string | null;
          required_fields?: Json;
          is_active?: boolean;
        };
      };
    };
    Views: Record<string, never>;
    Functions: {
      is_team_member: {
        Args: { p_team_id: string };
        Returns: boolean;
      };
      has_team_role: {
        Args: { p_team_id: string; p_roles: string[] };
        Returns: boolean;
      };
      get_user_teams: {
        Args: Record<string, never>;
        Returns: string[];
      };
      get_user_role: {
        Args: { p_team_id: string };
        Returns: string;
      };
      is_team_owner: {
        Args: { p_team_id: string };
        Returns: boolean;
      };
    };
    Enums: Record<string, never>;
  };
};

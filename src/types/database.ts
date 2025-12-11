export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      ai_pattern_rules: {
        Row: {
          category: string
          created_at: string | null
          created_by: string
          description: string | null
          global_rule_id: string | null
          id: string
          is_active: boolean | null
          name: string
          pattern: string | null
          pattern_type: string
          replacement: string | null
          replacement_options: string[] | null
          severity: string | null
          team_id: string
          updated_at: string | null
        }
        Insert: {
          category: string
          created_at?: string | null
          created_by: string
          description?: string | null
          global_rule_id?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          pattern?: string | null
          pattern_type: string
          replacement?: string | null
          replacement_options?: string[] | null
          severity?: string | null
          team_id: string
          updated_at?: string | null
        }
        Update: {
          category?: string
          created_at?: string | null
          created_by?: string
          description?: string | null
          global_rule_id?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          pattern?: string | null
          pattern_type?: string
          replacement?: string | null
          replacement_options?: string[] | null
          severity?: string | null
          team_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ai_pattern_rules_global_rule_id_fkey"
            columns: ["global_rule_id"]
            isOneToOne: false
            referencedRelation: "ai_pattern_rules_global"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_pattern_rules_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_pattern_rules_global: {
        Row: {
          category: string
          created_at: string | null
          description: string | null
          id: string
          is_active: boolean | null
          name: string
          pattern: string | null
          pattern_type: string
          replacement: string | null
          replacement_options: string[] | null
          severity: string | null
        }
        Insert: {
          category: string
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          pattern?: string | null
          pattern_type: string
          replacement?: string | null
          replacement_options?: string[] | null
          severity?: string | null
        }
        Update: {
          category?: string
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          pattern?: string | null
          pattern_type?: string
          replacement?: string | null
          replacement_options?: string[] | null
          severity?: string | null
        }
        Relationships: []
      }
      ai_usage_log: {
        Row: {
          article_id: string | null
          brand_id: string | null
          created_at: string | null
          estimated_cost: number | null
          feature: string
          id: string
          input_tokens: number | null
          model: string
          output_tokens: number | null
          provider: string
          team_id: string
          total_tokens: number | null
          user_id: string
        }
        Insert: {
          article_id?: string | null
          brand_id?: string | null
          created_at?: string | null
          estimated_cost?: number | null
          feature: string
          id?: string
          input_tokens?: number | null
          model: string
          output_tokens?: number | null
          provider: string
          team_id: string
          total_tokens?: number | null
          user_id: string
        }
        Update: {
          article_id?: string | null
          brand_id?: string | null
          created_at?: string | null
          estimated_cost?: number | null
          feature?: string
          id?: string
          input_tokens?: number | null
          model?: string
          output_tokens?: number | null
          provider?: string
          team_id?: string
          total_tokens?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_usage_log_article_id_fkey"
            columns: ["article_id"]
            isOneToOne: false
            referencedRelation: "articles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_usage_log_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_usage_log_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      api_providers: {
        Row: {
          base_url: string | null
          docs_url: string | null
          id: string
          is_active: boolean | null
          name: string
          required_fields: Json | null
        }
        Insert: {
          base_url?: string | null
          docs_url?: string | null
          id: string
          is_active?: boolean | null
          name: string
          required_fields?: Json | null
        }
        Update: {
          base_url?: string | null
          docs_url?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          required_fields?: Json | null
        }
        Relationships: []
      }
      article_comments: {
        Row: {
          article_id: string
          content: string
          created_at: string | null
          highlighted_text: string | null
          id: string
          parent_id: string | null
          resolved: boolean | null
          resolved_at: string | null
          resolved_by: string | null
          text_position_end: number | null
          text_position_start: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          article_id: string
          content: string
          created_at?: string | null
          highlighted_text?: string | null
          id?: string
          parent_id?: string | null
          resolved?: boolean | null
          resolved_at?: string | null
          resolved_by?: string | null
          text_position_end?: number | null
          text_position_start?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          article_id?: string
          content?: string
          created_at?: string | null
          highlighted_text?: string | null
          id?: string
          parent_id?: string | null
          resolved?: boolean | null
          resolved_at?: string | null
          resolved_by?: string | null
          text_position_end?: number | null
          text_position_start?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "article_comments_article_id_fkey"
            columns: ["article_id"]
            isOneToOne: false
            referencedRelation: "articles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "article_comments_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "article_comments"
            referencedColumns: ["id"]
          },
        ]
      }
      article_versions: {
        Row: {
          article_id: string
          change_summary: string | null
          changed_by: string
          content: string | null
          content_html: string | null
          created_at: string | null
          id: string
          status: string
          title: string
          version_number: number
        }
        Insert: {
          article_id: string
          change_summary?: string | null
          changed_by: string
          content?: string | null
          content_html?: string | null
          created_at?: string | null
          id?: string
          status: string
          title: string
          version_number: number
        }
        Update: {
          article_id?: string
          change_summary?: string | null
          changed_by?: string
          content?: string | null
          content_html?: string | null
          created_at?: string | null
          id?: string
          status?: string
          title?: string
          version_number?: number
        }
        Relationships: [
          {
            foreignKeyName: "article_versions_article_id_fkey"
            columns: ["article_id"]
            isOneToOne: false
            referencedRelation: "articles"
            referencedColumns: ["id"]
          },
        ]
      }
      article_workflow_log: {
        Row: {
          article_id: string
          created_at: string | null
          from_status: string | null
          id: string
          notes: string | null
          to_status: string
          transitioned_by: string
        }
        Insert: {
          article_id: string
          created_at?: string | null
          from_status?: string | null
          id?: string
          notes?: string | null
          to_status: string
          transitioned_by: string
        }
        Update: {
          article_id?: string
          created_at?: string | null
          from_status?: string | null
          id?: string
          notes?: string | null
          to_status?: string
          transitioned_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "article_workflow_log_article_id_fkey"
            columns: ["article_id"]
            isOneToOne: false
            referencedRelation: "articles"
            referencedColumns: ["id"]
          },
        ]
      }
      articles: {
        Row: {
          ai_patterns_found: Json | null
          applied_links: Json | null
          assigned_to: string | null
          brand_id: string
          call_to_action: string | null
          content: string | null
          content_html: string | null
          created_at: string | null
          created_by: string
          excerpt: string | null
          featured_image_url: string | null
          focus_keyword: string | null
          humanization_applied: boolean | null
          humanization_rules_used: string[] | null
          id: string
          input_type: string | null
          original_input: string | null
          published_at: string | null
          published_url: string | null
          reading_time_minutes: number | null
          secondary_keywords: string[] | null
          seo_description: string | null
          seo_score: number | null
          seo_title: string | null
          slug: string | null
          status: string
          suggested_links: Json | null
          target_audience: string | null
          target_length: string | null
          team_id: string
          title: string
          updated_at: string | null
          word_count: number | null
        }
        Insert: {
          ai_patterns_found?: Json | null
          applied_links?: Json | null
          assigned_to?: string | null
          brand_id: string
          call_to_action?: string | null
          content?: string | null
          content_html?: string | null
          created_at?: string | null
          created_by: string
          excerpt?: string | null
          featured_image_url?: string | null
          focus_keyword?: string | null
          humanization_applied?: boolean | null
          humanization_rules_used?: string[] | null
          id?: string
          input_type?: string | null
          original_input?: string | null
          published_at?: string | null
          published_url?: string | null
          reading_time_minutes?: number | null
          secondary_keywords?: string[] | null
          seo_description?: string | null
          seo_score?: number | null
          seo_title?: string | null
          slug?: string | null
          status?: string
          suggested_links?: Json | null
          target_audience?: string | null
          target_length?: string | null
          team_id: string
          title: string
          updated_at?: string | null
          word_count?: number | null
        }
        Update: {
          ai_patterns_found?: Json | null
          applied_links?: Json | null
          assigned_to?: string | null
          brand_id?: string
          call_to_action?: string | null
          content?: string | null
          content_html?: string | null
          created_at?: string | null
          created_by?: string
          excerpt?: string | null
          featured_image_url?: string | null
          focus_keyword?: string | null
          humanization_applied?: boolean | null
          humanization_rules_used?: string[] | null
          id?: string
          input_type?: string | null
          original_input?: string | null
          published_at?: string | null
          published_url?: string | null
          reading_time_minutes?: number | null
          secondary_keywords?: string[] | null
          seo_description?: string | null
          seo_score?: number | null
          seo_title?: string | null
          slug?: string | null
          status?: string
          suggested_links?: Json | null
          target_audience?: string | null
          target_length?: string | null
          team_id?: string
          title?: string
          updated_at?: string | null
          word_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "articles_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "articles_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      brand_competitors: {
        Row: {
          brand_id: string
          competitor_name: string
          competitor_url: string | null
          created_at: string | null
          differentiation_notes: string | null
          id: string
        }
        Insert: {
          brand_id: string
          competitor_name: string
          competitor_url?: string | null
          created_at?: string | null
          differentiation_notes?: string | null
          id?: string
        }
        Update: {
          brand_id?: string
          competitor_name?: string
          competitor_url?: string | null
          created_at?: string | null
          differentiation_notes?: string | null
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "brand_competitors_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
        ]
      }
      brand_intelligence: {
        Row: {
          brand_id: string
          content_gaps: Json | null
          created_at: string | null
          extracted_keywords: Json | null
          extracted_topics: Json | null
          extraction_error: string | null
          extraction_model: string | null
          extraction_status: string | null
          id: string
          keyword_opportunities: Json | null
          last_extraction_at: string | null
          last_keyword_research_at: string | null
          pages_analyzed: number | null
          updated_at: string | null
          voice_summary: Json | null
        }
        Insert: {
          brand_id: string
          content_gaps?: Json | null
          created_at?: string | null
          extracted_keywords?: Json | null
          extracted_topics?: Json | null
          extraction_error?: string | null
          extraction_model?: string | null
          extraction_status?: string | null
          id?: string
          keyword_opportunities?: Json | null
          last_extraction_at?: string | null
          last_keyword_research_at?: string | null
          pages_analyzed?: number | null
          updated_at?: string | null
          voice_summary?: Json | null
        }
        Update: {
          brand_id?: string
          content_gaps?: Json | null
          created_at?: string | null
          extracted_keywords?: Json | null
          extracted_topics?: Json | null
          extraction_error?: string | null
          extraction_model?: string | null
          extraction_status?: string | null
          id?: string
          keyword_opportunities?: Json | null
          last_extraction_at?: string | null
          last_keyword_research_at?: string | null
          pages_analyzed?: number | null
          updated_at?: string | null
          voice_summary?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "brand_intelligence_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: true
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
        ]
      }
      brand_profiles: {
        Row: {
          avoid_words: string[] | null
          brand_id: string
          branded_phrases: Json | null
          confidence_score: number | null
          core_themes: string[] | null
          created_at: string | null
          do_list: string[] | null
          dont_list: string[] | null
          id: string
          is_active: boolean
          key_terminology: Json | null
          pain_points_addressed: string[] | null
          paragraph_length: string | null
          power_words: string[] | null
          preferred_pov: string | null
          sample_sentences: Json | null
          sentence_structure: string | null
          source_pages_count: number | null
          tone_confidence: number | null
          tone_empathy: number | null
          tone_enthusiasm: number | null
          tone_formality: number | null
          tone_humor: number | null
          updated_at: string | null
          value_propositions: string[] | null
          version: number
          vocabulary_level: string | null
          voice_adjectives: string[] | null
          voice_description: string | null
        }
        Insert: {
          avoid_words?: string[] | null
          brand_id: string
          branded_phrases?: Json | null
          confidence_score?: number | null
          core_themes?: string[] | null
          created_at?: string | null
          do_list?: string[] | null
          dont_list?: string[] | null
          id?: string
          is_active?: boolean
          key_terminology?: Json | null
          pain_points_addressed?: string[] | null
          paragraph_length?: string | null
          power_words?: string[] | null
          preferred_pov?: string | null
          sample_sentences?: Json | null
          sentence_structure?: string | null
          source_pages_count?: number | null
          tone_confidence?: number | null
          tone_empathy?: number | null
          tone_enthusiasm?: number | null
          tone_formality?: number | null
          tone_humor?: number | null
          updated_at?: string | null
          value_propositions?: string[] | null
          version?: number
          vocabulary_level?: string | null
          voice_adjectives?: string[] | null
          voice_description?: string | null
        }
        Update: {
          avoid_words?: string[] | null
          brand_id?: string
          branded_phrases?: Json | null
          confidence_score?: number | null
          core_themes?: string[] | null
          created_at?: string | null
          do_list?: string[] | null
          dont_list?: string[] | null
          id?: string
          is_active?: boolean
          key_terminology?: Json | null
          pain_points_addressed?: string[] | null
          paragraph_length?: string | null
          power_words?: string[] | null
          preferred_pov?: string | null
          sample_sentences?: Json | null
          sentence_structure?: string | null
          source_pages_count?: number | null
          tone_confidence?: number | null
          tone_empathy?: number | null
          tone_enthusiasm?: number | null
          tone_formality?: number | null
          tone_humor?: number | null
          updated_at?: string | null
          value_propositions?: string[] | null
          version?: number
          vocabulary_level?: string | null
          voice_adjectives?: string[] | null
          voice_description?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "brand_profiles_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
        ]
      }
      brands: {
        Row: {
          created_at: string | null
          created_by: string
          description: string | null
          id: string
          industry: string | null
          logo_url: string | null
          name: string
          status: string
          target_audience: string | null
          team_id: string
          updated_at: string | null
          website_url: string | null
        }
        Insert: {
          created_at?: string | null
          created_by: string
          description?: string | null
          id?: string
          industry?: string | null
          logo_url?: string | null
          name: string
          status?: string
          target_audience?: string | null
          team_id: string
          updated_at?: string | null
          website_url?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string
          description?: string | null
          id?: string
          industry?: string | null
          logo_url?: string | null
          name?: string
          status?: string
          target_audience?: string | null
          team_id?: string
          updated_at?: string | null
          website_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "brands_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      crawl_jobs: {
        Row: {
          brand_id: string
          completed_at: string | null
          created_at: string | null
          error_message: string | null
          firecrawl_job_id: string | null
          id: string
          max_pages: number | null
          pages_crawled: number | null
          seed_urls: string[]
          started_at: string | null
          started_by: string
          status: string
        }
        Insert: {
          brand_id: string
          completed_at?: string | null
          created_at?: string | null
          error_message?: string | null
          firecrawl_job_id?: string | null
          id?: string
          max_pages?: number | null
          pages_crawled?: number | null
          seed_urls: string[]
          started_at?: string | null
          started_by: string
          status?: string
        }
        Update: {
          brand_id?: string
          completed_at?: string | null
          created_at?: string | null
          error_message?: string | null
          firecrawl_job_id?: string | null
          id?: string
          max_pages?: number | null
          pages_crawled?: number | null
          seed_urls?: string[]
          started_at?: string | null
          started_by?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "crawl_jobs_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
        ]
      }
      crawl_usage_log: {
        Row: {
          crawl_job_id: string | null
          created_at: string | null
          credits_used: number | null
          id: string
          pages_crawled: number
          team_id: string
        }
        Insert: {
          crawl_job_id?: string | null
          created_at?: string | null
          credits_used?: number | null
          id?: string
          pages_crawled: number
          team_id: string
        }
        Update: {
          crawl_job_id?: string | null
          created_at?: string | null
          credits_used?: number | null
          id?: string
          pages_crawled?: number
          team_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "crawl_usage_log_crawl_job_id_fkey"
            columns: ["crawl_job_id"]
            isOneToOne: false
            referencedRelation: "crawl_jobs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crawl_usage_log_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      crawled_pages: {
        Row: {
          brand_id: string
          canonical_url: string | null
          content_category: string | null
          content_hash: string | null
          content_type: string | null
          crawl_job_id: string | null
          crawled_at: string | null
          created_at: string | null
          extracted_keywords: string[] | null
          id: string
          is_active: boolean | null
          key_topics: string[] | null
          last_modified: string | null
          markdown_content: string | null
          meta_description: string | null
          plain_text: string | null
          primary_topic: string | null
          published_date: string | null
          reading_time_minutes: number | null
          summary: string | null
          target_keywords: string[] | null
          title: string | null
          url: string
          word_count: number | null
        }
        Insert: {
          brand_id: string
          canonical_url?: string | null
          content_category?: string | null
          content_hash?: string | null
          content_type?: string | null
          crawl_job_id?: string | null
          crawled_at?: string | null
          created_at?: string | null
          extracted_keywords?: string[] | null
          id?: string
          is_active?: boolean | null
          key_topics?: string[] | null
          last_modified?: string | null
          markdown_content?: string | null
          meta_description?: string | null
          plain_text?: string | null
          primary_topic?: string | null
          published_date?: string | null
          reading_time_minutes?: number | null
          summary?: string | null
          target_keywords?: string[] | null
          title?: string | null
          url: string
          word_count?: number | null
        }
        Update: {
          brand_id?: string
          canonical_url?: string | null
          content_category?: string | null
          content_hash?: string | null
          content_type?: string | null
          crawl_job_id?: string | null
          crawled_at?: string | null
          created_at?: string | null
          extracted_keywords?: string[] | null
          id?: string
          is_active?: boolean | null
          key_topics?: string[] | null
          last_modified?: string | null
          markdown_content?: string | null
          meta_description?: string | null
          plain_text?: string | null
          primary_topic?: string | null
          published_date?: string | null
          reading_time_minutes?: number | null
          summary?: string | null
          target_keywords?: string[] | null
          title?: string | null
          url?: string
          word_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "crawled_pages_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crawled_pages_crawl_job_id_fkey"
            columns: ["crawl_job_id"]
            isOneToOne: false
            referencedRelation: "crawl_jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      keyword_cache: {
        Row: {
          created_at: string | null
          data: Json
          expires_at: string
          id: string
          keyword: string
          location_code: number | null
        }
        Insert: {
          created_at?: string | null
          data: Json
          expires_at: string
          id?: string
          keyword: string
          location_code?: number | null
        }
        Update: {
          created_at?: string | null
          data?: Json
          expires_at?: string
          id?: string
          keyword?: string
          location_code?: number | null
        }
        Relationships: []
      }
      keyword_research: {
        Row: {
          article_id: string | null
          competition: number | null
          competition_level: string | null
          cpc: number | null
          created_at: string | null
          fetched_at: string | null
          id: string
          keyword: string
          language_code: string | null
          location_code: number | null
          related_keywords: Json | null
          search_volume: number | null
          serp_features: string[] | null
          team_id: string
          top_domains: string[] | null
        }
        Insert: {
          article_id?: string | null
          competition?: number | null
          competition_level?: string | null
          cpc?: number | null
          created_at?: string | null
          fetched_at?: string | null
          id?: string
          keyword: string
          language_code?: string | null
          location_code?: number | null
          related_keywords?: Json | null
          search_volume?: number | null
          serp_features?: string[] | null
          team_id: string
          top_domains?: string[] | null
        }
        Update: {
          article_id?: string | null
          competition?: number | null
          competition_level?: string | null
          cpc?: number | null
          created_at?: string | null
          fetched_at?: string | null
          id?: string
          keyword?: string
          language_code?: string | null
          location_code?: number | null
          related_keywords?: Json | null
          search_volume?: number | null
          serp_features?: string[] | null
          team_id?: string
          top_domains?: string[] | null
        }
        Relationships: [
          {
            foreignKeyName: "keyword_research_article_id_fkey"
            columns: ["article_id"]
            isOneToOne: false
            referencedRelation: "articles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "keyword_research_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          default_team_id: string | null
          email: string
          full_name: string | null
          id: string
          preferences: Json | null
          updated_at: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          default_team_id?: string | null
          email: string
          full_name?: string | null
          id: string
          preferences?: Json | null
          updated_at?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          default_team_id?: string | null
          email?: string
          full_name?: string | null
          id?: string
          preferences?: Json | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_default_team_id_fkey"
            columns: ["default_team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      seo_usage_log: {
        Row: {
          article_id: string | null
          brand_id: string | null
          created_at: string | null
          estimated_cost: number | null
          id: string
          operation: string
          request_count: number
          team_id: string
        }
        Insert: {
          article_id?: string | null
          brand_id?: string | null
          created_at?: string | null
          estimated_cost?: number | null
          id?: string
          operation: string
          request_count?: number
          team_id: string
        }
        Update: {
          article_id?: string | null
          brand_id?: string | null
          created_at?: string | null
          estimated_cost?: number | null
          id?: string
          operation?: string
          request_count?: number
          team_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "seo_usage_log_article_id_fkey"
            columns: ["article_id"]
            isOneToOne: false
            referencedRelation: "articles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "seo_usage_log_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "seo_usage_log_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      team_members: {
        Row: {
          created_at: string | null
          id: string
          invited_at: string | null
          invited_by: string | null
          joined_at: string | null
          role: string
          team_id: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          invited_at?: string | null
          invited_by?: string | null
          joined_at?: string | null
          role?: string
          team_id: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          invited_at?: string | null
          invited_by?: string | null
          joined_at?: string | null
          role?: string
          team_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "team_members_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      teams: {
        Row: {
          created_at: string | null
          id: string
          name: string
          owner_id: string
          plan: string
          settings: Json | null
          slug: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          name: string
          owner_id: string
          plan?: string
          settings?: Json | null
          slug: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          name?: string
          owner_id?: string
          plan?: string
          settings?: Json | null
          slug?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      user_api_keys: {
        Row: {
          config: Json | null
          created_at: string | null
          created_by: string
          id: string
          is_active: boolean | null
          last_error: string | null
          last_used_at: string | null
          provider_id: string
          team_id: string
          updated_at: string | null
          vault_secret_id: string | null
        }
        Insert: {
          config?: Json | null
          created_at?: string | null
          created_by: string
          id?: string
          is_active?: boolean | null
          last_error?: string | null
          last_used_at?: string | null
          provider_id: string
          team_id: string
          updated_at?: string | null
          vault_secret_id?: string | null
        }
        Update: {
          config?: Json | null
          created_at?: string | null
          created_by?: string
          id?: string
          is_active?: boolean | null
          last_error?: string | null
          last_used_at?: string | null
          provider_id?: string
          team_id?: string
          updated_at?: string | null
          vault_secret_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_api_keys_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "api_providers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_api_keys_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_user_role: { Args: { p_team_id: string }; Returns: string }
      get_user_teams: { Args: never; Returns: string[] }
      has_team_role: {
        Args: { p_roles: string[]; p_team_id: string }
        Returns: boolean
      }
      is_team_member: { Args: { p_team_id: string }; Returns: boolean }
      is_team_owner: { Args: { p_team_id: string }; Returns: boolean }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const

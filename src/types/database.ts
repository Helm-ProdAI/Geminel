// Supabase database types
// Auto-generated shape matching schema.sql
// Update this file if the schema changes.

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export interface Database {
  public: {
    Tables: {
      brands: {
        Row: {
          id: string;
          brand_name: string;
          brand_type: "personal" | "creator" | "corporate" | "ecommerce";
          is_local: boolean;
          archived: boolean;
          voice: Json;
          visual_identity: Json;
          primary_persona: Json;
          secondary_personas: Json;
          geographic_focus: string | null;
          audience_size_estimate: number | null;
          primary_goal: string | null;
          goal_type: "awareness" | "leads" | "sales" | "retention" | "advocacy" | null;
          current_stage_focus: number | null;
          weakest_stage: number | null;
          quarterly_targets: Json;
          positioning_statement: string | null;
          core_differentiator: string | null;
          competitors: Json;
          market_category: string | null;
          biggest_leak: string | null;
          past_wins: Json;
          past_losses: Json;
          social_channels: Json;
          seo_config: Json;
          email_config: Json;
          paid_ads_config: Json;
          video_config: Json | null;
          content_lab_results: Json;
          evergreen_assets: Json;
          babuu_permissions: string[];
          review_cadence: string | null;
          contact_email: string | null;
          timezone: string | null;
          created_at: string;
          updated_at: string;
          next_quarterly_review: string | null;
          last_context_refresh: string | null;
        };
        Insert: Partial<Database["public"]["Tables"]["brands"]["Row"]> & { brand_name: string; brand_type: string };
        Update: Partial<Database["public"]["Tables"]["brands"]["Row"]>;
      };
      brand_integrations: {
        Row: {
          id: string;
          brand_id: string;
          platform: string;
          platform_account_id: string | null;
          access_token_encrypted: string | null;
          refresh_token_encrypted: string | null;
          token_expires_at: string | null;
          metadata: Json;
          active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["brand_integrations"]["Row"]> & { brand_id: string; platform: string };
        Update: Partial<Database["public"]["Tables"]["brand_integrations"]["Row"]>;
      };
      babuu_conversations: {
        Row: {
          id: string;
          brand_id: string;
          session_id: string;
          role: "user" | "assistant";
          content: string;
          skills_called: string[];
          sources_cited: Json;
          confidence: "high" | "medium" | "low" | null;
          created_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["babuu_conversations"]["Row"], "id" | "created_at">;
        Update: Partial<Database["public"]["Tables"]["babuu_conversations"]["Row"]>;
      };
      analytics_cache: {
        Row: {
          id: string;
          brand_id: string;
          stage: number;
          platform: string;
          metric_date: string;
          metrics: Json;
          raw_response: Json | null;
          fetched_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["analytics_cache"]["Row"], "id">;
        Update: Partial<Database["public"]["Tables"]["analytics_cache"]["Row"]>;
      };
      content_calendar: {
        Row: {
          id: string;
          brand_id: string;
          scheduled_for: string | null;
          published_at: string | null;
          platform: string;
          format: string;
          pillar: "teach" | "connect" | "spark" | null;
          hook: string | null;
          body: string | null;
          cta: string | null;
          hashtags: string[];
          status: "draft" | "approved" | "scheduled" | "published" | "archived";
          asset_urls: string[];
          performance: Json | null;
          content_lab_test_id: string | null;
          babuu_generated: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["content_calendar"]["Row"]> & { brand_id: string; platform: string; format: string };
        Update: Partial<Database["public"]["Tables"]["content_calendar"]["Row"]>;
      };
      content_lab_tests: {
        Row: {
          id: string;
          brand_id: string;
          variable_tested: string;
          hypothesis: string;
          success_metric: string;
          control_description: string | null;
          variant_description: string | null;
          start_date: string;
          end_date: string | null;
          status: "active" | "completed" | "paused";
          control_result: Json | null;
          variant_result: Json | null;
          winner: "control" | "variant" | "inconclusive" | null;
          confidence: "high" | "medium" | "low" | null;
          learning: string | null;
          next_test_suggestion: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["content_lab_tests"]["Row"]> & { brand_id: string; variable_tested: string; hypothesis: string; success_metric: string; start_date: string };
        Update: Partial<Database["public"]["Tables"]["content_lab_tests"]["Row"]>;
      };
      ad_campaigns: {
        Row: {
          id: string;
          brand_id: string;
          platform: string;
          platform_campaign_id: string | null;
          campaign_name: string;
          objective: string | null;
          status: string;
          daily_budget: number | null;
          total_budget: number | null;
          start_date: string | null;
          end_date: string | null;
          target_audience: Json | null;
          ad_creatives: Json;
          performance: Json | null;
          babuu_brief: string | null;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["ad_campaigns"]["Row"]> & { brand_id: string; campaign_name: string; platform: string };
        Update: Partial<Database["public"]["Tables"]["ad_campaigns"]["Row"]>;
      };
      video_assets: {
        Row: {
          id: string;
          brand_id: string;
          asset_type: string;
          title: string;
          description: string | null;
          cloudinary_url: string | null;
          cloudinary_public_id: string | null;
          shotstack_template_id: string | null;
          duration_seconds: number | null;
          platform: string | null;
          format: string | null;
          status: string;
          babuu_brief: Json | null;
          tags: string[];
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["video_assets"]["Row"]> & { brand_id: string; asset_type: string; title: string };
        Update: Partial<Database["public"]["Tables"]["video_assets"]["Row"]>;
      };
      weekly_reports: {
        Row: {
          id: string;
          brand_id: string;
          week_of: string;
          report_markdown: string;
          metrics_snapshot: Json;
          content_lab_summary: Json | null;
          top_wins: string[];
          top_leaks: string[];
          babuu_recommendations: Json;
          sent_at: string | null;
          viewed_at: string | null;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["weekly_reports"]["Row"]> & { brand_id: string; week_of: string; report_markdown: string };
        Update: Partial<Database["public"]["Tables"]["weekly_reports"]["Row"]>;
      };
      strategy_embeddings: {
        Row: {
          id: string;
          brand_id: string;
          document_type: string;
          chunk_text: string;
          embedding: number[] | null;
          source_reference: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["strategy_embeddings"]["Row"]> & {
          brand_id: string;
          document_type: string;
          chunk_text: string;
        };
        Update: Partial<Database["public"]["Tables"]["strategy_embeddings"]["Row"]>;
      };
    };
    Functions: {
      match_brand_embeddings: {
        Args: { query_embedding: number[]; target_brand_id: string; match_threshold?: number; match_count?: number };
        Returns: { id: string; chunk_text: string; document_type: string; source_reference: string; similarity: number }[];
      };
    };
  };
}

// Babuu Platform - Brand Type Definitions

export type BrandType = "personal" | "creator" | "corporate" | "ecommerce";
export type GrowthStage = 1 | 2 | 3 | 4 | 5;
export type ContentPillar = "teach" | "connect" | "spark";
export type Confidence = "high" | "medium" | "low";
export type AdPlatform =
  | "google"
  | "meta"
  | "tiktok"
  | "linkedin"
  | "pinterest"
  | "x"
  | "snapchat";
export type SocialPlatform =
  | "instagram"
  | "tiktok"
  | "linkedin"
  | "facebook"
  | "x"
  | "youtube"
  | "pinterest"
  | "threads";
export type EmailPlatform =
  | "mailchimp"
  | "klaviyo"
  | "convertkit"
  | "activecampaign"
  | "other";

// ============================================================
// VOICE AND IDENTITY
// ============================================================

export interface VoiceConfig {
  tone_descriptors: string[];
  forbidden_patterns: string[];
  elevator_pitch: string;
  tone_by_channel: Record<string, string>;
  writing_samples: string[];
}

export interface VisualIdentity {
  primary_colors: string[];
  typography: string;
  logo_url: string;
  asset_folder_url: string;
  do_not_do: string[];
}

// ============================================================
// AUDIENCE
// ============================================================

export interface Persona {
  name: string;
  situation: string;
  problem_statement: string;
  decision_maker: boolean;
  budget_range: string | null;
  buying_cycle: string;
  search_keywords: string[];
  pain_points: string[];
  desired_outcome: string;
}

// ============================================================
// GOALS
// ============================================================

export interface QuarterlyTargets {
  awareness: number;
  consideration: number;
  conversion: number;
  loyalty: number;
  advocacy: number;
}

// ============================================================
// POSITIONING
// ============================================================

export interface Competitor {
  name: string;
  strengths: string[];
  weaknesses: string[];
  estimated_market_position: string;
}

// ============================================================
// CURRENT STATE
// ============================================================

export interface PastWin {
  description: string;
  channel: string;
  metric_moved: string;
  period: string;
}

export interface PastLoss {
  description: string;
  channel: string;
  reason: string;
}

// ============================================================
// ACTIVE CHANNELS
// ============================================================

export interface SocialChannel {
  platform: SocialPlatform;
  handle: string;
  follower_count: number;
  posting_cadence: string;
  content_pillar_ratios: { teach: number; connect: number; spark: number };
}

export interface KeywordTarget {
  keyword: string;
  intent: "see" | "think" | "do" | "care";
  current_rank: number | null;
  target_rank: number;
}

export interface SEOConfig {
  primary_domain: string;
  target_keywords: KeywordTarget[];
}

export interface EmailConfig {
  platform: EmailPlatform;
  list_size: number;
}

export interface PaidAdConfig {
  platform: AdPlatform;
  monthly_budget: number;
  ad_account_id: string;
}

export interface VideoConfig {
  primary_platform: string;
  brand_template_ids: string[];
  cloudinary_folder: string;
  style_guide: string;
}

// ============================================================
// CONTENT HISTORY
// ============================================================

export interface ContentLabResult {
  variable_tested: string;
  test_period: string;
  winner: string;
  metric: string;
  performance_vs_control: string;
}

export interface EvergreenAsset {
  name: string;
  type: "template" | "guide" | "case_study" | "video" | "ad_creative";
  url: string;
  last_updated: string;
}

// ============================================================
// BRAND FULL SCHEMA
// The complete context object Babuu receives at conversation start.
// ============================================================

export interface Brand {
  id: string;
  brand_name: string;
  brand_type: BrandType;
  is_local: boolean;
  archived: boolean;

  voice: VoiceConfig;
  visual_identity: VisualIdentity;

  primary_persona: Persona;
  secondary_personas: Persona[];
  geographic_focus: string | null;
  audience_size_estimate: number;

  primary_goal: string;
  goal_type: "awareness" | "leads" | "sales" | "retention" | "advocacy";
  current_stage_focus: GrowthStage;
  weakest_stage: GrowthStage;
  quarterly_targets: QuarterlyTargets;

  positioning_statement: string;
  core_differentiator: string;
  competitors: Competitor[];
  market_category: string;

  biggest_leak: string;
  past_wins: PastWin[];
  past_losses: PastLoss[];

  social_channels: SocialChannel[];
  seo_config: SEOConfig;
  email_config: EmailConfig | null;
  paid_ads_config: PaidAdConfig[];
  video_config: VideoConfig | null;

  content_lab_results: ContentLabResult[];
  evergreen_assets: EvergreenAsset[];

  babuu_permissions: string[];
  review_cadence: "weekly" | "monthly" | "quarterly";
  contact_email: string;
  timezone: string;

  created_at: string;
  updated_at: string;
  next_quarterly_review: string | null;
  last_context_refresh: string | null;
}

// ============================================================
// ANALYTICS (normalized per stage)
// ============================================================

export interface StageMetrics {
  stage: GrowthStage;
  primary_metric_label: string;
  primary_metric_value: number;
  primary_metric_unit: string;
  trend_wow: number; // week-over-week % change
  trend_mom: number; // month-over-month % change
  status: "on_track" | "leak" | "warning" | "no_data";
  platform_breakdown: Record<string, number>;
}

export interface DashboardData {
  brand_id: string;
  as_of: string;
  stages: StageMetrics[];
  babuu_insight: string | null;
  last_updated: string;
}

// ============================================================
// BABUU AGENT TYPES
// ============================================================

export interface BabuuSource {
  type: "client_data" | "geminel_playbook" | "research";
  reference: string;
  date?: string;
  url?: string;
}

export interface BabuuResponse {
  content: string;
  confidence: Confidence;
  sources: BabuuSource[];
  skills_called: string[];
  if_low_confidence?: string;
  next_step?: string;
}

export interface ConversationMessage {
  id: string;
  session_id: string;
  brand_id: string;
  role: "user" | "assistant";
  content: string;
  skills_called?: string[];
  sources_cited?: BabuuSource[];
  confidence?: Confidence;
  created_at: string;
}

// ============================================================
// CONTENT TYPES
// ============================================================

export interface ContentPost {
  id: string;
  brand_id: string;
  scheduled_for: string | null;
  published_at: string | null;
  platform: SocialPlatform;
  format: "reel" | "carousel" | "text" | "story" | "video" | "static" | "ad";
  pillar: ContentPillar | null;
  hook: string;
  body: string;
  cta: string;
  hashtags: string[];
  status: "draft" | "approved" | "scheduled" | "published" | "archived";
  asset_urls: string[];
  performance: PostPerformance | null;
  babuu_generated: boolean;
  created_at: string;
}

export interface PostPerformance {
  reach: number;
  impressions: number;
  engagement_rate: number;
  saves: number;
  shares: number;
  comments: number;
  clicks: number | null;
  conversions: number | null;
}

// ============================================================
// VIDEO PRODUCTION
// ============================================================

export interface VideoBrief {
  platform: SocialPlatform | "youtube";
  format_ratio: "9:16" | "16:9" | "1:1" | "4:5";
  duration_target: string;
  hook: string;
  hook_visual: string;
  scenes: VideoScene[];
  cta: string;
  music_mood: string;
  tone_notes: string;
  brand_compliance: string[];
}

export interface VideoScene {
  scene_number: number;
  duration_seconds: number;
  visual_description: string;
  text_overlay: string | null;
  voiceover: string | null;
  notes: string;
}

// ============================================================
// PAID ADS
// ============================================================

export interface AdCreative {
  id: string;
  headline: string;
  body: string;
  cta_text: string;
  image_url?: string;
  video_url?: string;
  format: "single_image" | "video" | "carousel" | "collection";
  platform_specific: Record<string, unknown>;
}

export interface AdCampaignBrief {
  objective: "awareness" | "consideration" | "conversion" | "retargeting";
  stage: GrowthStage;
  platform: AdPlatform;
  target_audience_description: string;
  budget_recommendation: number;
  duration_days: number;
  creatives: AdCreative[];
  targeting_notes: string;
  success_metrics: string[];
  source_notes: string;
}

-- Babuu Platform Database Schema
-- Supabase PostgreSQL
-- Enable pgvector extension for semantic search
CREATE EXTENSION IF NOT EXISTS vector;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- BRANDS
-- The core entity. One row per client brand.
-- ============================================================
CREATE TABLE brands (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  brand_name TEXT NOT NULL,
  brand_type TEXT NOT NULL CHECK (brand_type IN ('personal', 'creator', 'corporate', 'ecommerce')),
  is_local BOOLEAN DEFAULT FALSE,
  archived BOOLEAN DEFAULT FALSE,

  -- Identity
  voice JSONB NOT NULL DEFAULT '{}',
  visual_identity JSONB NOT NULL DEFAULT '{}',

  -- Audience
  primary_persona JSONB NOT NULL DEFAULT '{}',
  secondary_personas JSONB NOT NULL DEFAULT '[]',
  geographic_focus TEXT,
  audience_size_estimate INTEGER,

  -- Goals
  primary_goal TEXT,
  goal_type TEXT CHECK (goal_type IN ('awareness', 'leads', 'sales', 'retention', 'advocacy')),
  current_stage_focus INTEGER CHECK (current_stage_focus BETWEEN 1 AND 5),
  weakest_stage INTEGER CHECK (weakest_stage BETWEEN 1 AND 5),
  quarterly_targets JSONB NOT NULL DEFAULT '{}',

  -- Positioning
  positioning_statement TEXT,
  core_differentiator TEXT,
  competitors JSONB NOT NULL DEFAULT '[]',
  market_category TEXT,

  -- Current state
  biggest_leak TEXT,
  past_wins JSONB NOT NULL DEFAULT '[]',
  past_losses JSONB NOT NULL DEFAULT '[]',

  -- Active channels (non-sensitive metadata only; encrypted tokens go in brand_integrations)
  social_channels JSONB NOT NULL DEFAULT '[]',
  seo_config JSONB NOT NULL DEFAULT '{}',
  email_config JSONB NOT NULL DEFAULT '{}',
  paid_ads_config JSONB NOT NULL DEFAULT '[]',
  video_config JSONB,

  -- Content history
  content_lab_results JSONB NOT NULL DEFAULT '[]',
  evergreen_assets JSONB NOT NULL DEFAULT '[]',

  -- Babuu settings
  babuu_permissions TEXT[] NOT NULL DEFAULT ARRAY['read_analytics', 'suggest_strategy', 'draft_content'],
  review_cadence TEXT DEFAULT 'weekly',
  contact_email TEXT,
  timezone TEXT DEFAULT 'UTC',

  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  next_quarterly_review DATE,
  last_context_refresh TIMESTAMPTZ
);

-- ============================================================
-- BRAND INTEGRATIONS
-- Encrypted API tokens stored separately from brand data.
-- Never passed to Claude. Only read server-side.
-- ============================================================
CREATE TABLE brand_integrations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  brand_id UUID NOT NULL REFERENCES brands(id) ON DELETE CASCADE,
  platform TEXT NOT NULL, -- 'ga4', 'gsc', 'instagram', 'tiktok', 'meta_ads', 'google_ads', etc.
  platform_account_id TEXT,
  access_token_encrypted TEXT,
  refresh_token_encrypted TEXT,
  token_expires_at TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}', -- platform-specific IDs, property URLs, etc.
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE(brand_id, platform)
);

-- ============================================================
-- BABUU CONVERSATIONS
-- Every conversation Babuu has, stored per brand.
-- Used for short-term memory (last 7 days context).
-- ============================================================
CREATE TABLE babuu_conversations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  brand_id UUID NOT NULL REFERENCES brands(id) ON DELETE CASCADE,
  session_id UUID NOT NULL DEFAULT uuid_generate_v4(),
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  skills_called TEXT[] DEFAULT '{}',
  sources_cited JSONB DEFAULT '[]',
  confidence TEXT CHECK (confidence IN ('high', 'medium', 'low')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_babuu_conversations_brand_id ON babuu_conversations(brand_id);
CREATE INDEX idx_babuu_conversations_session_id ON babuu_conversations(session_id);
CREATE INDEX idx_babuu_conversations_created_at ON babuu_conversations(created_at DESC);

-- ============================================================
-- STRATEGY EMBEDDINGS
-- Vector embeddings of strategy docs, past recommendations,
-- and content history. Used for semantic search by Babuu.
-- ============================================================
CREATE TABLE strategy_embeddings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  brand_id UUID NOT NULL REFERENCES brands(id) ON DELETE CASCADE,
  document_type TEXT NOT NULL, -- 'strategy_doc', 'recommendation', 'content_spec', 'quarterly_review', 'playbook'
  chunk_text TEXT NOT NULL,
  embedding vector(1024), -- Cohere embed-english-v3.0 dimension
  source_reference TEXT, -- which doc/section this came from
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_strategy_embeddings_brand_id ON strategy_embeddings(brand_id);

-- Cosine similarity search function
CREATE OR REPLACE FUNCTION match_brand_embeddings(
  query_embedding vector(1024),
  target_brand_id UUID,
  match_threshold FLOAT DEFAULT 0.7,
  match_count INT DEFAULT 5
)
RETURNS TABLE (
  id UUID,
  chunk_text TEXT,
  document_type TEXT,
  source_reference TEXT,
  similarity FLOAT
)
LANGUAGE SQL STABLE
AS $$
  SELECT
    se.id,
    se.chunk_text,
    se.document_type,
    se.source_reference,
    1 - (se.embedding <=> query_embedding) AS similarity
  FROM strategy_embeddings se
  WHERE se.brand_id = target_brand_id
    AND 1 - (se.embedding <=> query_embedding) > match_threshold
  ORDER BY se.embedding <=> query_embedding
  LIMIT match_count;
$$;

-- ============================================================
-- ANALYTICS CACHE
-- Normalized metrics from all external APIs.
-- One row per brand per stage per date per platform.
-- ============================================================
CREATE TABLE analytics_cache (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  brand_id UUID NOT NULL REFERENCES brands(id) ON DELETE CASCADE,
  stage INTEGER NOT NULL CHECK (stage BETWEEN 1 AND 5),
  platform TEXT NOT NULL, -- 'ga4', 'instagram', 'meta_ads', 'google_ads', 'semrush', etc.
  metric_date DATE NOT NULL,
  metrics JSONB NOT NULL DEFAULT '{}', -- normalized metric bag per stage
  raw_response JSONB, -- original API response for debugging
  fetched_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE(brand_id, stage, platform, metric_date)
);

CREATE INDEX idx_analytics_cache_brand_stage ON analytics_cache(brand_id, stage);
CREATE INDEX idx_analytics_cache_date ON analytics_cache(metric_date DESC);

-- ============================================================
-- CONTENT CALENDAR
-- Planned and published content across all platforms.
-- ============================================================
CREATE TABLE content_calendar (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  brand_id UUID NOT NULL REFERENCES brands(id) ON DELETE CASCADE,
  scheduled_for TIMESTAMPTZ,
  published_at TIMESTAMPTZ,
  platform TEXT NOT NULL,
  format TEXT NOT NULL, -- 'reel', 'carousel', 'text', 'story', 'video', 'ad'
  pillar TEXT CHECK (pillar IN ('teach', 'connect', 'spark')),
  hook TEXT,
  body TEXT,
  cta TEXT,
  hashtags TEXT[],
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'approved', 'scheduled', 'published', 'archived')),
  asset_urls TEXT[] DEFAULT '{}',
  performance JSONB, -- filled after publish: reach, engagement_rate, clicks, conversions
  content_lab_test_id UUID, -- if part of a Content Lab test
  babuu_generated BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_content_calendar_brand_id ON content_calendar(brand_id);
CREATE INDEX idx_content_calendar_scheduled ON content_calendar(scheduled_for);
CREATE INDEX idx_content_calendar_status ON content_calendar(status);

-- ============================================================
-- CONTENT LAB TESTS
-- Tracking active and completed Content Lab experiments.
-- ============================================================
CREATE TABLE content_lab_tests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  brand_id UUID NOT NULL REFERENCES brands(id) ON DELETE CASCADE,
  variable_tested TEXT NOT NULL,
  hypothesis TEXT NOT NULL,
  success_metric TEXT NOT NULL,
  control_description TEXT,
  variant_description TEXT,
  start_date DATE NOT NULL,
  end_date DATE,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'paused')),
  control_result JSONB,
  variant_result JSONB,
  winner TEXT CHECK (winner IN ('control', 'variant', 'inconclusive')),
  confidence TEXT CHECK (confidence IN ('high', 'medium', 'low')),
  learning TEXT, -- what we concluded
  next_test_suggestion TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_content_lab_tests_brand_id ON content_lab_tests(brand_id);
CREATE INDEX idx_content_lab_tests_status ON content_lab_tests(status);

-- ============================================================
-- AD CAMPAIGNS
-- Paid ad campaign tracking across all platforms.
-- ============================================================
CREATE TABLE ad_campaigns (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  brand_id UUID NOT NULL REFERENCES brands(id) ON DELETE CASCADE,
  platform TEXT NOT NULL,
  platform_campaign_id TEXT, -- external ID from ad platform
  campaign_name TEXT NOT NULL,
  objective TEXT, -- 'awareness', 'consideration', 'conversion', 'retargeting'
  status TEXT NOT NULL DEFAULT 'draft',
  daily_budget DECIMAL(10,2),
  total_budget DECIMAL(10,2),
  start_date DATE,
  end_date DATE,
  target_audience JSONB,
  ad_creatives JSONB DEFAULT '[]',
  performance JSONB, -- spend, impressions, clicks, conversions, ROAS, CPC, CTR, CPM
  babuu_brief TEXT, -- Babuu-generated campaign brief
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_ad_campaigns_brand_id ON ad_campaigns(brand_id);
CREATE INDEX idx_ad_campaigns_platform ON ad_campaigns(platform);
CREATE INDEX idx_ad_campaigns_status ON ad_campaigns(status);

-- ============================================================
-- VIDEO ASSETS
-- Brand video files, templates, and production tracking.
-- ============================================================
CREATE TABLE video_assets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  brand_id UUID NOT NULL REFERENCES brands(id) ON DELETE CASCADE,
  asset_type TEXT NOT NULL, -- 'raw_footage', 'short_clip', 'ad_creative', 'template', 'finished_post'
  title TEXT NOT NULL,
  description TEXT,
  cloudinary_url TEXT,
  cloudinary_public_id TEXT,
  shotstack_template_id TEXT,
  duration_seconds INTEGER,
  platform TEXT, -- where this is intended: 'instagram', 'tiktok', 'youtube', etc.
  format TEXT, -- '9:16', '16:9', '1:1', '4:5'
  status TEXT NOT NULL DEFAULT 'raw' CHECK (status IN ('raw', 'brief_generated', 'in_production', 'ready', 'published', 'archived')),
  babuu_brief JSONB, -- shot list, hook, script, CTA
  tags TEXT[],
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_video_assets_brand_id ON video_assets(brand_id);
CREATE INDEX idx_video_assets_status ON video_assets(status);

-- ============================================================
-- WEEKLY REPORTS
-- Auto-generated weekly summaries per brand.
-- ============================================================
CREATE TABLE weekly_reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  brand_id UUID NOT NULL REFERENCES brands(id) ON DELETE CASCADE,
  week_of DATE NOT NULL,
  report_markdown TEXT NOT NULL,
  metrics_snapshot JSONB NOT NULL DEFAULT '{}',
  content_lab_summary JSONB,
  top_wins TEXT[],
  top_leaks TEXT[],
  babuu_recommendations JSONB DEFAULT '[]',
  sent_at TIMESTAMPTZ,
  viewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE(brand_id, week_of)
);

CREATE INDEX idx_weekly_reports_brand_id ON weekly_reports(brand_id);

-- ============================================================
-- ROW LEVEL SECURITY
-- Enforce per-brand data isolation at database level.
-- ============================================================

-- Enable RLS on all tables
ALTER TABLE brands ENABLE ROW LEVEL SECURITY;
ALTER TABLE brand_integrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE babuu_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE strategy_embeddings ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics_cache ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_calendar ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_lab_tests ENABLE ROW LEVEL SECURITY;
ALTER TABLE ad_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE video_assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE weekly_reports ENABLE ROW LEVEL SECURITY;

-- Service role bypass (for server-side Babuu agent calls)
-- All policies allow service_role to bypass RLS.
-- User-facing policies scoped to authenticated users via session.

-- Brands: user can only see brands they have access to
-- (In MVP: all authenticated users see all brands. Add brand_users table when multi-user needed.)
CREATE POLICY "Authenticated users can access brands"
  ON brands FOR ALL
  TO authenticated
  USING (TRUE);

-- Repeat pattern for all brand-scoped tables
CREATE POLICY "Authenticated users can access brand integrations"
  ON brand_integrations FOR ALL
  TO authenticated
  USING (TRUE);

CREATE POLICY "Authenticated users can access conversations"
  ON babuu_conversations FOR ALL
  TO authenticated
  USING (TRUE);

CREATE POLICY "Authenticated users can access embeddings"
  ON strategy_embeddings FOR ALL
  TO authenticated
  USING (TRUE);

CREATE POLICY "Authenticated users can access analytics"
  ON analytics_cache FOR ALL
  TO authenticated
  USING (TRUE);

CREATE POLICY "Authenticated users can access content calendar"
  ON content_calendar FOR ALL
  TO authenticated
  USING (TRUE);

CREATE POLICY "Authenticated users can access content lab"
  ON content_lab_tests FOR ALL
  TO authenticated
  USING (TRUE);

CREATE POLICY "Authenticated users can access ad campaigns"
  ON ad_campaigns FOR ALL
  TO authenticated
  USING (TRUE);

CREATE POLICY "Authenticated users can access video assets"
  ON video_assets FOR ALL
  TO authenticated
  USING (TRUE);

CREATE POLICY "Authenticated users can access weekly reports"
  ON weekly_reports FOR ALL
  TO authenticated
  USING (TRUE);

-- ============================================================
-- UPDATED_AT TRIGGER
-- Auto-update updated_at on every row change.
-- ============================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_brands_updated_at BEFORE UPDATE ON brands
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_brand_integrations_updated_at BEFORE UPDATE ON brand_integrations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_content_calendar_updated_at BEFORE UPDATE ON content_calendar
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_content_lab_tests_updated_at BEFORE UPDATE ON content_lab_tests
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_ad_campaigns_updated_at BEFORE UPDATE ON ad_campaigns
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_video_assets_updated_at BEFORE UPDATE ON video_assets
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

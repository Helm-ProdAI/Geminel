-- Babuu Platform seed data
-- Run AFTER schema.sql. Creates the Geminel brand as the first brand
-- so the dashboard goes live immediately.

INSERT INTO brands (
  brand_name,
  brand_type,
  is_local,
  voice,
  visual_identity,
  primary_persona,
  geographic_focus,
  primary_goal,
  goal_type,
  current_stage_focus,
  weakest_stage,
  quarterly_targets,
  positioning_statement,
  core_differentiator,
  market_category,
  biggest_leak,
  social_channels,
  seo_config,
  babuu_permissions,
  review_cadence,
  timezone
) VALUES (
  'Geminel',
  'corporate',
  FALSE,
  '{
    "descriptors": ["calm", "certain", "elevated"],
    "tone": "Assured without arrogance. Precise without coldness.",
    "forbidden_patterns": ["em-dashes", "AI tells", "hype language", "exclamation marks in body copy"]
  }',
  '{
    "primary_font": "Fraunces",
    "body_font": "Inter",
    "background": "#070B1C",
    "accent": "#E7C98A",
    "mark": "guiding pair stars"
  }',
  '{
    "name": "The Rising Founder",
    "situation": "Runs a growing brand but marketing is scattered across tools and freelancers",
    "problem": "No unified strategy. Data lives everywhere. Decisions are gut-driven.",
    "desired_outcome": "One system that knows the brand and drives strategy with evidence"
  }',
  'Global, English-speaking markets',
  'Establish Geminel as the marketing intelligence studio for rising brands',
  'leads',
  2,
  2,
  '{
    "awareness": "10,000 monthly organic reach",
    "consideration": "5% engagement rate",
    "conversion": "8 discovery calls per month",
    "loyalty": "90% client retention",
    "advocacy": "3 client referrals per quarter"
  }',
  'Geminel is the studio where brands rise: strategy, content, and intelligence unified in one engine.',
  'Babuu — an AI strategist grounded in real data, not guesses.',
  'Marketing intelligence studio',
  'Consideration stage: strong reach but profile-to-follower conversion lags',
  '[
    {"platform": "instagram", "handle": "@geminel.studio"},
    {"platform": "linkedin", "handle": "geminel"}
  ]',
  '{
    "domain": "geminel.studio",
    "target_keywords": ["brand strategy agency", "marketing intelligence tool", "what is brand positioning"]
  }',
  ARRAY['read_analytics', 'suggest_strategy', 'draft_content'],
  'weekly',
  'UTC'
);

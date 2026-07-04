// Analytics Skill
// Fetches normalized metrics from GA4, GSC, social APIs, and ad platforms.
// Returns data Babuu uses to answer performance questions.
// Real API calls happen here. Claude receives the result, not the raw API.

import { createServiceSupabaseClient } from "@/lib/supabase-server";
import type { SkillResult } from "@/agent/babuu";

const STALE_THRESHOLD_HOURS = 4;

export async function fetchAnalytics(
  brandId: string,
  stage: number,
  platform: string,
  dateRange: string
): Promise<SkillResult> {
  const supabase = createServiceSupabaseClient();

  // Check cache first
  const { data: cached } = await supabase
    .from("analytics_cache")
    .select("*")
    .eq("brand_id", brandId)
    .eq("platform", platform)
    .gte(
      "fetched_at",
      new Date(
        Date.now() - STALE_THRESHOLD_HOURS * 60 * 60 * 1000
      ).toISOString()
    )
    .order("fetched_at", { ascending: false })
    .limit(10);

  if (cached && cached.length > 0) {
    const metrics = cached.reduce(
      (acc, row) => {
        acc[`stage_${row.stage}`] = row.metrics;
        return acc;
      },
      {} as Record<string, unknown>
    );

    return {
      data: {
        metrics,
        as_of: cached[0].fetched_at,
        from_cache: true,
      },
      confidence: "high",
      sources: [
        {
          type: "client_data",
          reference: `${platform} analytics`,
          date: cached[0].fetched_at,
        },
      ],
    };
  }

  // Cache miss: would normally call external APIs here.
  // Each platform has its own fetcher in /lib/integrations/
  // For now, return the cached state if it exists (even if stale) with a warning.
  const { data: staleData } = await supabase
    .from("analytics_cache")
    .select("*")
    .eq("brand_id", brandId)
    .eq("platform", platform)
    .order("fetched_at", { ascending: false })
    .limit(1);

  if (staleData && staleData.length > 0) {
    return {
      data: {
        metrics: staleData[0].metrics,
        as_of: staleData[0].fetched_at,
        from_cache: true,
        stale: true,
      },
      confidence: "medium",
      stale: true,
      stale_since: staleData[0].fetched_at,
      sources: [
        {
          type: "client_data",
          reference: `${platform} analytics (stale)`,
          date: staleData[0].fetched_at,
        },
      ],
    };
  }

  return {
    data: {
      error: "No analytics data available. Connect the integration to start pulling data.",
      platform,
      date_range: dateRange,
    },
    confidence: "low",
    error: "No data. Integration not connected or no data has been fetched yet.",
  };
}

// Normalize stage-to-metric mapping
// Each stage has a primary metric and secondary metrics.
export function getStageMetrics(stage: number): {
  primary_metric: string;
  secondary_metrics: string[];
  platforms: string[];
} {
  const stageMap: Record<
    number,
    { primary_metric: string; secondary_metrics: string[]; platforms: string[] }
  > = {
    1: {
      primary_metric: "reach",
      secondary_metrics: ["impressions", "new_visitors", "organic_clicks"],
      platforms: ["ga4", "instagram", "tiktok", "linkedin", "semrush"],
    },
    2: {
      primary_metric: "engagement_rate",
      secondary_metrics: ["saves", "follows", "profile_visits", "email_signups"],
      platforms: ["ga4", "instagram", "tiktok", "linkedin"],
    },
    3: {
      primary_metric: "conversion_rate",
      secondary_metrics: ["leads", "sales", "bookings", "cpa", "roas"],
      platforms: ["ga4", "meta_ads", "google_ads", "tiktok_ads"],
    },
    4: {
      primary_metric: "retention_rate",
      secondary_metrics: ["repeat_rate", "ltv", "email_open_rate", "churn"],
      platforms: ["ga4", "email"],
    },
    5: {
      primary_metric: "referrals",
      secondary_metrics: ["ugc_count", "review_count", "brand_mentions"],
      platforms: ["ga4", "instagram", "tiktok"],
    },
  };

  return stageMap[stage] ?? stageMap[1];
}

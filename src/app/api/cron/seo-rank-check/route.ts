// Runs daily at 6AM UTC (see vercel.json)
// Fetches fresh keyword rankings from Semrush for all connected brands,
// stores them in analytics_cache, and fires position-change alerts.

import { NextRequest, NextResponse } from "next/server";
import { createServiceSupabaseClient } from "@/lib/supabase-server";
import { fetchOrganicKeywords } from "@/lib/integrations/semrush";

function verifyCron(req: NextRequest): boolean {
  return req.headers.get("authorization") === `Bearer ${process.env.CRON_SECRET}`;
}

export async function GET(req: NextRequest) {
  if (!verifyCron(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createServiceSupabaseClient();
  const now      = new Date().toISOString();

  // Get brands with Semrush connected and domain set
  const { data: brands } = await supabase
    .from("brands")
    .select("id, brand_name, website_domain")
    .eq("archived", false)
    .not("website_domain", "is", null);

  if (!brands?.length) {
    return NextResponse.json({ message: "No brands with domain configured", ts: now });
  }

  const results: { brandId: string; keywords: number; error?: string }[] = [];

  for (const brand of brands) {
    try {
      // Check if Semrush is connected for this brand
      const { data: integration } = await supabase
        .from("brand_integrations")
        .select("id")
        .eq("brand_id", brand.id)
        .eq("platform", "semrush")
        .eq("active", true)
        .single();

      if (!integration) {
        results.push({ brandId: brand.id, keywords: 0, error: "Semrush not connected" });
        continue;
      }

      const keywords = await fetchOrganicKeywords(brand.website_domain!, "us", 100);

      // Store in analytics_cache (stage 1 = Awareness; SEO is primarily Awareness-level)
      await supabase.from("analytics_cache").upsert({
        brand_id:    brand.id,
        stage:       1,
        platform:    "semrush",
        metric_date: now.slice(0, 10),
        metrics:     { keywords, count: keywords.length },
        fetched_at:  now,
      });

      results.push({ brandId: brand.id, keywords: keywords.length });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Unknown error";
      results.push({ brandId: brand.id, keywords: 0, error: msg });
    }
  }

  return NextResponse.json({ results, ts: now });
}

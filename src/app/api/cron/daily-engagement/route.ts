// Runs twice daily at 6AM and 6PM UTC (see vercel.json)
// Checks engagement metrics across all brands and fires alerts if a brand drops
// below its expected engagement rate threshold.

import { NextRequest, NextResponse } from "next/server";
import { createServiceSupabaseClient } from "@/lib/supabase-server";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY ?? "re_not_configured");
const ALERT_THRESHOLD_DROP_PCT = 20; // alert if engagement drops >20% WoW

function verifyCron(req: NextRequest): boolean {
  const auth = req.headers.get("authorization");
  return auth === `Bearer ${process.env.CRON_SECRET}`;
}

export async function GET(req: NextRequest) {
  if (!verifyCron(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createServiceSupabaseClient();
  const now      = new Date().toISOString();

  // Fetch all active brands
  const { data: brands } = await supabase
    .from("brands")
    .select("id, brand_name, contact_email, growth_targets")
    .eq("archived", false);

  if (!brands?.length) {
    return NextResponse.json({ message: "No brands to check", ts: now });
  }

  const alerts: { brandId: string; brandName: string; drop: number }[] = [];

  for (const brand of brands) {
    // Pull latest analytics cache entries (this week vs last week)
    const { data: cache } = await supabase
      .from("analytics_cache")
      .select("metrics, cached_at")
      .eq("brand_id", brand.id)
      .in("platform", ["instagram", "tiktok", "facebook"])
      .order("cached_at", { ascending: false })
      .limit(2);

    if (!cache || cache.length < 2) continue;

    const latest = cache[0]?.metrics as Record<string, number>;
    const prev   = cache[1]?.metrics as Record<string, number>;

    const latestEng = latest?.engagement_rate ?? 0;
    const prevEng   = prev?.engagement_rate ?? 0;

    if (prevEng > 0) {
      const drop = ((prevEng - latestEng) / prevEng) * 100;
      if (drop >= ALERT_THRESHOLD_DROP_PCT) {
        alerts.push({ brandId: brand.id, brandName: brand.brand_name, drop });
      }
    }
  }

  // Send alert emails
  for (const alert of alerts) {
    const brand = brands.find((b) => b.id === alert.brandId);
    if (!brand?.contact_email) continue;

    await resend.emails.send({
      from:    "Babuu <alerts@geminel.studio>",
      to:      brand.contact_email,
      subject: `Engagement alert: ${brand.brand_name} dropped ${alert.drop.toFixed(1)}%`,
      html: `
        <p>Babuu detected a significant engagement drop for <strong>${brand.brand_name}</strong>.</p>
        <p>Engagement rate fell <strong>${alert.drop.toFixed(1)}%</strong> compared to the previous period.</p>
        <p>Log in to Babuu to diagnose the Consideration stage.</p>
      `,
    }).catch((e: Error) => console.error("Email send error:", e.message));
  }

  return NextResponse.json({
    checked: brands.length,
    alerts:  alerts.length,
    ts:      now,
  });
}

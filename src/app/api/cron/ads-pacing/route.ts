// Runs 3x daily: 8AM, 2PM, 8PM UTC (see vercel.json)
// Checks ad spend pacing for all brands with Meta Ads or Google Ads connected.
// Flags over-pacing (>20% over daily target) or under-pacing (>30% under) campaigns.

import { NextRequest, NextResponse } from "next/server";
import { createServiceSupabaseClient } from "@/lib/supabase-server";
import { fetchMetaAdCampaigns } from "@/lib/integrations/meta";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY ?? "re_not_configured");

function verifyCron(req: NextRequest): boolean {
  return req.headers.get("authorization") === `Bearer ${process.env.CRON_SECRET}`;
}

interface PacingAlert {
  campaign: string;
  type:     "over" | "under";
  pct:      number;
  spend:    number;
  budget:   number;
}

export async function GET(req: NextRequest) {
  if (!verifyCron(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase   = createServiceSupabaseClient();
  const now        = new Date();
  const hourOfDay  = now.getUTCHours();
  const dayFraction = (hourOfDay + 1) / 24; // expected portion of daily budget spent by now
  const nowISO      = now.toISOString();

  const { data: brands } = await supabase
    .from("brands")
    .select("id, brand_name, contact_email")
    .eq("archived", false);

  if (!brands?.length) {
    return NextResponse.json({ message: "No brands", ts: nowISO });
  }

  const report: { brandId: string; alerts: PacingAlert[] }[] = [];

  for (const brand of brands) {
    // Get active Meta Ads campaigns from DB (stored by previous cron or manual fetch)
    const { data: campaigns } = await supabase
      .from("ad_campaigns")
      .select("campaign_name, daily_budget, performance")
      .eq("brand_id", brand.id)
      .eq("status", "active")
      .eq("platform", "meta");

    if (!campaigns?.length) continue;

    const alerts: PacingAlert[] = [];

    for (const campaign of campaigns) {
      const budget: number = campaign.daily_budget ?? 0;
      const todaySpend: number = (campaign.performance as Record<string, number>)?.spend_today ?? 0;
      if (!budget) continue;

      const expected  = budget * dayFraction;
      const overpacing  = todaySpend / expected;

      if (overpacing > 1.2) {
        alerts.push({ campaign: campaign.campaign_name, type: "over",  pct: (overpacing - 1) * 100, spend: todaySpend, budget });
      } else if (overpacing < 0.7 && dayFraction > 0.5) {
        alerts.push({ campaign: campaign.campaign_name, type: "under", pct: (1 - overpacing) * 100, spend: todaySpend, budget });
      }
    }

    if (alerts.length) {
      report.push({ brandId: brand.id, alerts });

      const bContact = (brand as { contact_email?: string | null }).contact_email;
      const bName    = (brand as { brand_name: string }).brand_name;

      if (bContact && process.env.RESEND_API_KEY) {
        const lines = alerts.map((a) =>
          `${a.campaign}: ${a.type === "over" ? "over-pacing" : "under-pacing"} by ${a.pct.toFixed(0)}% (spent $${a.spend.toFixed(2)} of $${a.budget}/day)`
        ).join("<br/>");

        await resend.emails.send({
          from:    "Babuu <alerts@geminel.studio>",
          to:      bContact,
          subject: `Ad pacing alert — ${bName}`,
          html:    `<p>Babuu detected pacing issues for ${bName}:</p><p>${lines}</p>`,
        }).catch((e: Error) => console.error("Email error:", e.message));
      }
    }
  }

  return NextResponse.json({ report, dayFraction: dayFraction.toFixed(2), ts: nowISO });
}

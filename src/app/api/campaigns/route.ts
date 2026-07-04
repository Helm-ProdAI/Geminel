// GET  /api/campaigns?brand_id=... — list ad campaigns
// POST /api/campaigns               — create a campaign record

import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase-server";

function supabaseConfigured(): boolean {
  return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
}

export async function GET(req: NextRequest) {
  if (!supabaseConfigured()) {
    return NextResponse.json({ campaigns: [], mode: "demo" });
  }

  const brandId = req.nextUrl.searchParams.get("brand_id");
  if (!brandId) {
    return NextResponse.json({ error: "brand_id is required" }, { status: 400 });
  }

  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from("ad_campaigns")
    .select("*")
    .eq("brand_id", brandId)
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ campaigns: data, mode: "live" });
}

export async function POST(req: NextRequest) {
  if (!supabaseConfigured()) {
    return NextResponse.json({ error: "Supabase not configured. Add credentials to .env.local first." }, { status: 503 });
  }

  const body = await req.json();
  if (!body.brand_id || !body.campaign_name || !body.platform) {
    return NextResponse.json({ error: "brand_id, campaign_name, and platform are required" }, { status: 400 });
  }

  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from("ad_campaigns")
    .insert({
      brand_id:        body.brand_id,
      platform:        body.platform,
      campaign_name:   body.campaign_name,
      objective:       body.objective ?? null,
      status:          body.status ?? "draft",
      daily_budget:    body.daily_budget ?? null,
      total_budget:    body.total_budget ?? null,
      start_date:      body.start_date ?? null,
      end_date:        body.end_date ?? null,
      target_audience: body.target_audience ?? null,
      ad_creatives:    body.ad_creatives ?? [],
      babuu_brief:     body.babuu_brief ?? null,
      notes:           body.notes ?? null,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data, { status: 201 });
}

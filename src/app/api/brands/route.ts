// POST /api/brands — create a new brand
// GET  /api/brands — list all brands for this user

import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase-server";

function supabaseConfigured(): boolean {
  return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
}

export async function POST(req: NextRequest) {
  if (!supabaseConfigured()) {
    return NextResponse.json(
      { error: "Supabase not configured. Add credentials to .env.local first — see Settings > API Keys." },
      { status: 503 }
    );
  }

  const supabase = await createServerSupabaseClient();
  const { data: { session } } = await supabase.auth.getSession();

  // In MVP: allow unauthenticated creation so we can test without auth set up.
  // Swap this for a real auth check before going live with clients.
  // if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();

  if (!body.brand_name || !body.brand_type) {
    return NextResponse.json({ error: "brand_name and brand_type are required" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("brands")
    .insert({
      brand_name:           body.brand_name,
      brand_type:           body.brand_type,
      is_local:             body.is_local ?? false,
      voice:                body.voice ?? {},
      visual_identity:      body.visual_identity ?? {},
      primary_persona:      body.primary_persona ?? {},
      secondary_personas:   body.secondary_personas ?? [],
      geographic_focus:     body.geographic_focus ?? null,
      primary_goal:         body.primary_goal ?? null,
      goal_type:            body.goal_type ?? null,
      current_stage_focus:  body.current_stage_focus ?? 1,
      weakest_stage:        body.weakest_stage ?? 2,
      quarterly_targets:    body.quarterly_targets ?? {},
      positioning_statement: body.positioning_statement ?? null,
      core_differentiator:  body.core_differentiator ?? null,
      market_category:      body.market_category ?? null,
      biggest_leak:         body.biggest_leak ?? null,
      competitors:          body.competitors ?? [],
      past_wins:            body.past_wins ?? [],
      past_losses:          body.past_losses ?? [],
      social_channels:      body.social_channels ?? [],
      seo_config:           body.seo_config ?? {},
      email_config:         body.email_config ?? null,
      paid_ads_config:      body.paid_ads_config ?? [],
      video_config:         body.video_config ?? null,
      content_lab_results:  body.content_lab_results ?? [],
      evergreen_assets:     body.evergreen_assets ?? [],
      babuu_permissions:    body.babuu_permissions ?? ["read_analytics", "suggest_strategy", "draft_content"],
      review_cadence:       body.review_cadence ?? "weekly",
      contact_email:        body.contact_email ?? null,
      timezone:             body.timezone ?? "UTC",
    })
    .select("id")
    .single();

  if (error) {
    console.error("Brand creation error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ id: data.id }, { status: 201 });
}

export async function GET() {
  if (!supabaseConfigured()) {
    return NextResponse.json([]);
  }

  const supabase = await createServerSupabaseClient();

  const { data, error } = await supabase
    .from("brands")
    .select("id, brand_name, brand_type, current_stage_focus, weakest_stage, updated_at")
    .eq("archived", false)
    .order("brand_name");

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

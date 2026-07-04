// GET  /api/content?brand_id=...&from=...&to=...  — list calendar posts
// POST /api/content                                — create a post

import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase-server";

function supabaseConfigured(): boolean {
  return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
}

export async function GET(req: NextRequest) {
  if (!supabaseConfigured()) {
    return NextResponse.json({ posts: [], mode: "demo" });
  }

  const brandId = req.nextUrl.searchParams.get("brand_id");
  if (!brandId) {
    return NextResponse.json({ error: "brand_id is required" }, { status: 400 });
  }

  const from = req.nextUrl.searchParams.get("from");
  const to   = req.nextUrl.searchParams.get("to");

  const supabase = await createServerSupabaseClient();
  let query = supabase
    .from("content_calendar")
    .select("*")
    .eq("brand_id", brandId)
    .order("scheduled_for", { ascending: true });

  if (from) query = query.gte("scheduled_for", from);
  if (to)   query = query.lte("scheduled_for", to);

  const { data, error } = await query;
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ posts: data, mode: "live" });
}

export async function POST(req: NextRequest) {
  if (!supabaseConfigured()) {
    return NextResponse.json({ error: "Supabase not configured. Add credentials to .env.local first." }, { status: 503 });
  }

  const body = await req.json();
  if (!body.brand_id || !body.platform || !body.format) {
    return NextResponse.json({ error: "brand_id, platform, and format are required" }, { status: 400 });
  }

  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from("content_calendar")
    .insert({
      brand_id:       body.brand_id,
      scheduled_for:  body.scheduled_for ?? null,
      platform:       body.platform,
      format:         body.format,
      pillar:         body.pillar ?? null,
      hook:           body.hook ?? null,
      body:           body.body ?? null,
      cta:            body.cta ?? null,
      hashtags:       body.hashtags ?? [],
      status:         body.status ?? "draft",
      asset_urls:     body.asset_urls ?? [],
      babuu_generated: body.babuu_generated ?? false,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data, { status: 201 });
}

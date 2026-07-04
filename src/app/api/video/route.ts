// GET  /api/video?brand_id=... — list video assets
// POST /api/video               — register a new asset

import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase-server";

function supabaseConfigured(): boolean {
  return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
}

export async function GET(req: NextRequest) {
  if (!supabaseConfigured()) {
    return NextResponse.json({ assets: [], mode: "demo" });
  }

  const brandId = req.nextUrl.searchParams.get("brand_id");
  if (!brandId) {
    return NextResponse.json({ error: "brand_id is required" }, { status: 400 });
  }

  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from("video_assets")
    .select("*")
    .eq("brand_id", brandId)
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ assets: data, mode: "live" });
}

export async function POST(req: NextRequest) {
  if (!supabaseConfigured()) {
    return NextResponse.json({ error: "Supabase not configured. Add credentials to .env.local first." }, { status: 503 });
  }

  const body = await req.json();
  if (!body.brand_id || !body.title || !body.asset_type) {
    return NextResponse.json({ error: "brand_id, title, and asset_type are required" }, { status: 400 });
  }

  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from("video_assets")
    .insert({
      brand_id:         body.brand_id,
      asset_type:       body.asset_type,
      title:            body.title,
      description:      body.description ?? null,
      cloudinary_url:   body.cloudinary_url ?? null,
      duration_seconds: body.duration_seconds ?? null,
      platform:         body.platform ?? null,
      format:           body.format ?? null,
      status:           body.status ?? "raw",
      babuu_brief:      body.babuu_brief ?? null,
      tags:             body.tags ?? [],
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data, { status: 201 });
}

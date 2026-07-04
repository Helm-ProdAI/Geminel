// GET  /api/swipes?brand_id=...&competitor=...&platform=... — list swipe file
// POST /api/swipes                                            — save a swipe (with optional Babuu analysis)

import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import Anthropic from "@anthropic-ai/sdk";

function supabaseConfigured(): boolean {
  return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
}

export async function GET(req: NextRequest) {
  if (!supabaseConfigured()) {
    return NextResponse.json({ swipes: [], mode: "demo" });
  }

  const brandId = req.nextUrl.searchParams.get("brand_id");
  if (!brandId) {
    return NextResponse.json({ error: "brand_id is required" }, { status: 400 });
  }

  const competitor = req.nextUrl.searchParams.get("competitor");
  const platform   = req.nextUrl.searchParams.get("platform");
  const swipeType  = req.nextUrl.searchParams.get("type");

  const supabase = await createServerSupabaseClient();
  let query = supabase
    .from("competitor_swipes")
    .select("*")
    .eq("brand_id", brandId)
    .order("last_seen", { ascending: false });

  if (competitor) query = query.eq("competitor_name", competitor);
  if (platform)   query = query.eq("platform", platform);
  if (swipeType)  query = query.eq("swipe_type", swipeType);

  const { data, error } = await query;
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ swipes: data, mode: "live" });
}

async function analyzeSwipe(swipe: {
  competitor_name: string;
  platform: string;
  swipe_type: string;
  headline?: string;
  body_copy?: string;
  cta?: string;
  format?: string;
}): Promise<string> {
  if (!process.env.ANTHROPIC_API_KEY) return "";

  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  const response = await anthropic.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 400,
    messages: [{
      role: "user",
      content: `You are a senior marketing strategist analyzing a competitor's ${swipe.swipe_type.replace("_", " ")} for a swipe file.

Competitor: ${swipe.competitor_name}
Platform: ${swipe.platform}
Format: ${swipe.format ?? "unknown"}
Headline: ${swipe.headline ?? "n/a"}
Copy: ${swipe.body_copy ?? "n/a"}
CTA: ${swipe.cta ?? "n/a"}

In 3-4 sentences: why this likely works, what specific technique it uses (hook style, proof structure, offer framing), and what to adapt (not copy) for our own brands. Be specific and decisive. No hedging, no bullet points.`,
    }],
  });

  return response.content[0].type === "text" ? response.content[0].text : "";
}

export async function POST(req: NextRequest) {
  if (!supabaseConfigured()) {
    return NextResponse.json({ error: "Supabase not configured. Add credentials to .env.local first." }, { status: 503 });
  }

  const body = await req.json();
  if (!body.brand_id || !body.competitor_name || !body.platform || !body.swipe_type) {
    return NextResponse.json(
      { error: "brand_id, competitor_name, platform, and swipe_type are required" },
      { status: 400 }
    );
  }

  // Auto-analyze on save (graceful: empty if no API key)
  let analysis = body.babuu_analysis ?? "";
  if (!analysis) {
    try {
      analysis = await analyzeSwipe(body);
    } catch (err) {
      console.error("Swipe analysis failed:", err instanceof Error ? err.message : err);
    }
  }

  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from("competitor_swipes")
    .insert({
      brand_id:            body.brand_id,
      competitor_name:     body.competitor_name,
      competitor_handle:   body.competitor_handle ?? null,
      platform:            body.platform,
      swipe_type:          body.swipe_type,
      content_url:         body.content_url ?? null,
      media_url:           body.media_url ?? null,
      headline:            body.headline ?? null,
      body_copy:           body.body_copy ?? null,
      cta:                 body.cta ?? null,
      format:              body.format ?? null,
      engagement_snapshot: body.engagement_snapshot ?? null,
      babuu_analysis:      analysis || null,
      tags:                body.tags ?? [],
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data, { status: 201 });
}

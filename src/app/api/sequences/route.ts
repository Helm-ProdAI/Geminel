// GET  /api/sequences?brand_id=... — list email/SMS sequences
// POST /api/sequences               — create a sequence (optionally Babuu-drafted)

import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import Anthropic from "@anthropic-ai/sdk";

function supabaseConfigured(): boolean {
  return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
}

export async function GET(req: NextRequest) {
  if (!supabaseConfigured()) {
    return NextResponse.json({ sequences: [], mode: "demo" });
  }

  const brandId = req.nextUrl.searchParams.get("brand_id");
  if (!brandId) {
    return NextResponse.json({ error: "brand_id is required" }, { status: 400 });
  }

  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from("message_sequences")
    .select("*")
    .eq("brand_id", brandId)
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ sequences: data, mode: "live" });
}

interface SequenceMessage {
  step: number;
  delay_days: number;
  subject: string;
  body: string;
  cta: string;
}

async function draftSequence(params: {
  brandVoice: string;
  channel: string;
  sequenceType: string;
  goal: string;
  steps: number;
}): Promise<SequenceMessage[]> {
  if (!process.env.ANTHROPIC_API_KEY) return [];

  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  const response = await anthropic.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 3000,
    messages: [{
      role: "user",
      content: `You are Babuu, senior strategist. Draft a ${params.steps}-step ${params.channel} ${params.sequenceType} sequence.

Goal: ${params.goal}
Brand voice: ${params.brandVoice}

Rules:
- No em-dashes, no AI-sounding phrases, no hype. Calm, certain, human.
- ${params.channel === "sms" ? "SMS: max 160 characters per message, no subject lines (leave subject empty)" : "Email: subject lines under 50 characters, bodies 80-150 words"}
- Each step must earn the next open. Front-load value, ask late.
- One CTA per message, stated plainly.

Return strict JSON array only:
[{"step": 1, "delay_days": 0, "subject": "...", "body": "...", "cta": "..."}]`,
    }],
  });

  const raw = response.content[0].type === "text" ? response.content[0].text : "[]";
  try {
    return JSON.parse(raw.replace(/```json?|```/g, "").trim());
  } catch {
    return [];
  }
}

export async function POST(req: NextRequest) {
  if (!supabaseConfigured()) {
    return NextResponse.json({ error: "Supabase not configured. Add credentials to .env.local first." }, { status: 503 });
  }

  const body = await req.json();
  if (!body.brand_id || !body.name || !body.channel || !body.sequence_type) {
    return NextResponse.json(
      { error: "brand_id, name, channel, and sequence_type are required" },
      { status: 400 }
    );
  }

  const supabase = await createServerSupabaseClient();

  // Babuu drafts the messages when asked and none are provided
  let messages: SequenceMessage[] = body.messages ?? [];
  let babuuGenerated = false;
  if (messages.length === 0 && body.draft_with_babuu) {
    const { data: brand } = await supabase
      .from("brands")
      .select("voice")
      .eq("id", body.brand_id)
      .single();

    messages = await draftSequence({
      brandVoice:   JSON.stringify(brand?.voice ?? {}),
      channel:      body.channel,
      sequenceType: body.sequence_type,
      goal:         body.goal ?? "nurture subscribers toward a discovery call",
      steps:        body.steps ?? 5,
    });
    babuuGenerated = messages.length > 0;
  }

  const { data, error } = await supabase
    .from("message_sequences")
    .insert({
      brand_id:        body.brand_id,
      name:            body.name,
      channel:         body.channel,
      sequence_type:   body.sequence_type,
      status:          "draft",
      messages,
      babuu_generated: babuuGenerated,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data, { status: 201 });
}

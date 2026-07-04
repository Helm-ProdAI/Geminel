// GET /api/news — latest AI news digests (most recent first)

import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase-server";

export async function GET() {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    return NextResponse.json({ digests: [], mode: "demo" });
  }

  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from("ai_news_digests")
    .select("*")
    .order("digest_date", { ascending: false })
    .limit(7);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ digests: data, mode: "live" });
}

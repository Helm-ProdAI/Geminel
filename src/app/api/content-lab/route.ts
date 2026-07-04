// GET  /api/content-lab?brand_id=...&status=... — list tests
// POST /api/content-lab                          — create a test

import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase-server";

function supabaseConfigured(): boolean {
  return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
}

export async function GET(req: NextRequest) {
  if (!supabaseConfigured()) {
    return NextResponse.json({ tests: [], mode: "demo" });
  }

  const brandId = req.nextUrl.searchParams.get("brand_id");
  if (!brandId) {
    return NextResponse.json({ error: "brand_id is required" }, { status: 400 });
  }

  const status = req.nextUrl.searchParams.get("status");

  const supabase = await createServerSupabaseClient();
  let query = supabase
    .from("content_lab_tests")
    .select("*")
    .eq("brand_id", brandId)
    .order("start_date", { ascending: false });

  if (status && status !== "all") query = query.eq("status", status);

  const { data, error } = await query;
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ tests: data, mode: "live" });
}

export async function POST(req: NextRequest) {
  if (!supabaseConfigured()) {
    return NextResponse.json({ error: "Supabase not configured. Add credentials to .env.local first." }, { status: 503 });
  }

  const body = await req.json();
  const required = ["brand_id", "variable_tested", "hypothesis", "success_metric"];
  for (const field of required) {
    if (!body[field]) {
      return NextResponse.json({ error: `${field} is required` }, { status: 400 });
    }
  }

  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from("content_lab_tests")
    .insert({
      brand_id:            body.brand_id,
      variable_tested:     body.variable_tested,
      hypothesis:          body.hypothesis,
      success_metric:      body.success_metric,
      control_description: body.control_description ?? null,
      variant_description: body.variant_description ?? null,
      start_date:          body.start_date ?? new Date().toISOString().slice(0, 10),
      status:              "active",
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data, { status: 201 });
}

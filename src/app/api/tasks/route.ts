// GET  /api/tasks?brand_id=...&status=... — list tasks
// POST /api/tasks                          — create a task

import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase-server";

function supabaseConfigured(): boolean {
  return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
}

export async function GET(req: NextRequest) {
  if (!supabaseConfigured()) {
    return NextResponse.json({ tasks: [], mode: "demo" });
  }

  const brandId = req.nextUrl.searchParams.get("brand_id");
  if (!brandId) {
    return NextResponse.json({ error: "brand_id is required" }, { status: 400 });
  }

  const status = req.nextUrl.searchParams.get("status");

  const supabase = await createServerSupabaseClient();
  let query = supabase
    .from("tasks")
    .select("*")
    .eq("brand_id", brandId)
    .order("due_date", { ascending: true, nullsFirst: false });

  if (status && status !== "all") query = query.eq("status", status);

  const { data, error } = await query;
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ tasks: data, mode: "live" });
}

export async function POST(req: NextRequest) {
  if (!supabaseConfigured()) {
    return NextResponse.json({ error: "Supabase not configured. Add credentials to .env.local first." }, { status: 503 });
  }

  const body = await req.json();
  if (!body.brand_id || !body.title) {
    return NextResponse.json({ error: "brand_id and title are required" }, { status: 400 });
  }

  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from("tasks")
    .insert({
      brand_id:           body.brand_id,
      title:              body.title,
      description:        body.description ?? null,
      status:             body.status ?? "todo",
      priority:           body.priority ?? "medium",
      owner:              body.owner ?? null,
      due_date:           body.due_date ?? null,
      category:           body.category ?? null,
      linked_entity_type: body.linked_entity_type ?? null,
      linked_entity_id:   body.linked_entity_id ?? null,
      created_by:         body.created_by ?? "user",
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data, { status: 201 });
}

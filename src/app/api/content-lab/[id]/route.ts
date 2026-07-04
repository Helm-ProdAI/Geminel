// PATCH /api/content-lab/[id] — update a test (record results, complete, pause)

import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase-server";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await req.json();
  const { id: _id, brand_id: _b, created_at: _c, ...updates } = body;

  // Completing a test requires a learning — this is the whole point of the Lab
  if (updates.status === "completed" && !updates.learning) {
    return NextResponse.json(
      { error: "A completed test must include a learning. What did this test prove?" },
      { status: 400 }
    );
  }

  if (updates.status === "completed" && !updates.end_date) {
    updates.end_date = new Date().toISOString().slice(0, 10);
  }

  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from("content_lab_tests")
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

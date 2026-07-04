// GET  /api/knowledge?brand_id=...  — list knowledge documents (brand_id optional; omit for studio-wide)
// POST /api/knowledge                — ingest a document: extract text, summarize, embed into master memory
//
// Accepts multipart/form-data (file upload) or JSON ({ title, text, source_type }).
// Supported files: .pdf, .docx, .txt, .md

import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import { embedAndStore } from "@/lib/brand-context";
import Anthropic from "@anthropic-ai/sdk";

function supabaseConfigured(): boolean {
  return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
}

export async function GET(req: NextRequest) {
  if (!supabaseConfigured()) {
    return NextResponse.json({ documents: [], mode: "demo" });
  }

  const brandId = req.nextUrl.searchParams.get("brand_id");
  const supabase = await createServerSupabaseClient();

  let query = supabase
    .from("knowledge_documents")
    .select("id, brand_id, title, source_type, babuu_summary, key_takeaways, embedded, created_at")
    .order("created_at", { ascending: false });

  if (brandId) query = query.eq("brand_id", brandId);

  const { data, error } = await query;
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ documents: data, mode: "live" });
}

async function extractText(file: File): Promise<string> {
  const buffer = Buffer.from(await file.arrayBuffer());
  const name = file.name.toLowerCase();

  if (name.endsWith(".pdf")) {
    const { PDFParse } = await import("pdf-parse");
    const parser = new PDFParse({ data: new Uint8Array(buffer) });
    const result = await parser.getText();
    await parser.destroy();
    return result.text;
  }
  if (name.endsWith(".docx")) {
    const mammoth = await import("mammoth");
    const result = await mammoth.extractRawText({ buffer });
    return result.value;
  }
  // .txt, .md, anything text-based
  return buffer.toString("utf-8");
}

async function summarize(title: string, text: string): Promise<{ summary: string; takeaways: string[] }> {
  if (!process.env.ANTHROPIC_API_KEY) {
    return { summary: "", takeaways: [] };
  }

  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  const truncated = text.slice(0, 100_000); // stay well within context

  const response = await anthropic.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 1500,
    messages: [{
      role: "user",
      content: `Summarize this document for a marketing studio's knowledge base. It is titled "${title}".

Return exactly this format:
SUMMARY: (3-5 sentences: what this document teaches and when to use it)
TAKEAWAYS:
- (actionable point 1)
- (actionable point 2)
- (up to 7 total, each one specific enough to act on)

Document:
${truncated}`,
    }],
  });

  const raw = response.content[0].type === "text" ? response.content[0].text : "";
  const summaryMatch = raw.match(/SUMMARY:\s*([\s\S]*?)(?=TAKEAWAYS:|$)/);
  const takeaways = [...raw.matchAll(/^-\s+(.+)$/gm)].map((m) => m[1].trim());

  return {
    summary: summaryMatch?.[1]?.trim() ?? raw.slice(0, 500),
    takeaways,
  };
}

export async function POST(req: NextRequest) {
  if (!supabaseConfigured()) {
    return NextResponse.json({ error: "Supabase not configured. Add credentials to .env.local first." }, { status: 503 });
  }

  const contentType = req.headers.get("content-type") ?? "";
  let title = "";
  let text = "";
  let sourceType = "other";
  let brandId: string | null = null;
  let originalFilename: string | null = null;

  if (contentType.includes("multipart/form-data")) {
    const form = await req.formData();
    const file = form.get("file") as File | null;
    title      = (form.get("title") as string) || file?.name || "Untitled";
    sourceType = (form.get("source_type") as string) || "other";
    brandId    = (form.get("brand_id") as string) || null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }
    originalFilename = file.name;
    try {
      text = await extractText(file);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "extraction failed";
      return NextResponse.json({ error: `Could not extract text from ${file.name}: ${msg}` }, { status: 422 });
    }
  } else {
    const body = await req.json();
    title      = body.title ?? "Untitled";
    text       = body.text ?? "";
    sourceType = body.source_type ?? "other";
    brandId    = body.brand_id ?? null;
  }

  if (!text.trim()) {
    return NextResponse.json({ error: "Document contains no extractable text" }, { status: 422 });
  }

  // Summarize (graceful: empty summary if no Anthropic key)
  let summary = "";
  let takeaways: string[] = [];
  try {
    const result = await summarize(title, text);
    summary = result.summary;
    takeaways = result.takeaways;
  } catch (err) {
    console.error("Summarization failed:", err instanceof Error ? err.message : err);
  }

  const supabase = await createServerSupabaseClient();
  const { data: doc, error } = await supabase
    .from("knowledge_documents")
    .insert({
      brand_id:          brandId,
      title,
      source_type:       sourceType,
      original_filename: originalFilename,
      raw_text:          text.slice(0, 500_000),
      babuu_summary:     summary || null,
      key_takeaways:     takeaways,
      embedded:          false,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Embed into master memory (per-brand or studio-wide via a shared brand id)
  let embedded = false;
  if (brandId && process.env.COHERE_API_KEY) {
    try {
      await embedAndStore(brandId, text.slice(0, 50_000), "knowledge_document", title);
      await supabase.from("knowledge_documents").update({ embedded: true }).eq("id", doc.id);
      embedded = true;
    } catch (err) {
      console.error("Embedding failed:", err instanceof Error ? err.message : err);
    }
  }

  return NextResponse.json({ ...doc, embedded }, { status: 201 });
}

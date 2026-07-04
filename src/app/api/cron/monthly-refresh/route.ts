// Runs on the 1st of each month at 3AM UTC (see vercel.json)
// Re-embeds all brand strategy documents so the vector index stays current.
// Also generates a quarterly review on end-of-quarter months.

import { NextRequest, NextResponse } from "next/server";
import { createServiceSupabaseClient } from "@/lib/supabase-server";
import { embedAndStore, loadBrandContext } from "@/lib/brand-context";
import { generateQuarterlyReview } from "@/agent/babuu";
import { Resend } from "resend";
import type { BabuuToolHandlers } from "@/agent/babuu";

const resend = new Resend(process.env.RESEND_API_KEY ?? "re_not_configured");

function verifyCron(req: NextRequest): boolean {
  return req.headers.get("authorization") === `Bearer ${process.env.CRON_SECRET}`;
}

// Minimal tool handlers for the quarterly review — uses only Supabase data
function makeToolHandlers(brandId: string, supabase: ReturnType<typeof createServiceSupabaseClient>): BabuuToolHandlers {
  return {
    fetchAnalytics: async (_brandId, stage, platform, _dateRange) => {
      const { data } = await supabase
        .from("analytics_cache")
        .select("metrics, fetched_at")
        .eq("brand_id", brandId)
        .eq("stage", stage || 1)
        .order("fetched_at", { ascending: false })
        .limit(1)
        .single();
      return { data: data?.metrics ?? {}, confidence: "medium", sources: [] };
    },
    searchPastContent: async (_brandId, _query) => ({ data: [], confidence: "medium", sources: [] }),
    getContentLabStatus: async (_brandId, _status) => {
      const { data } = await supabase
        .from("content_lab_tests")
        .select("*")
        .eq("brand_id", brandId)
        .eq("status", "completed");
      return { data: data ?? [], confidence: "high", sources: [] };
    },
    getSEOSnapshot:     async () => ({ data: {}, confidence: "low", sources: [] }),
    getAdsPerformance:  async () => ({ data: {}, confidence: "low", sources: [] }),
    getVideoAssets:     async () => ({ data: [], confidence: "high", sources: [] }),
    diagnoseStage:      async () => ({ data: {}, confidence: "medium", sources: [] }),
    generateContentDraft: async () => ({ data: {}, confidence: "medium", sources: [] }),
  };
}

export async function GET(req: NextRequest) {
  if (!verifyCron(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createServiceSupabaseClient();
  const now      = new Date();
  const nowISO   = now.toISOString();
  const month    = now.getMonth(); // 0-indexed
  const isQ      = [2, 5, 8, 11].includes(month); // March, June, Sep, Dec = end of quarter

  const { data: brands } = await supabase
    .from("brands")
    .select("id, brand_name, contact_email")
    .eq("archived", false);

  if (!brands?.length) {
    return NextResponse.json({ message: "No brands to refresh", ts: nowISO });
  }

  const results: { brandId: string; embedded: number; quarterly?: boolean; error?: string }[] = [];

  for (const brand of brands) {
    try {
      // Re-embed all strategy documents
      const { data: docs } = await supabase
        .from("strategy_embeddings")
        .select("chunk_text, document_type, source_reference")
        .eq("brand_id", brand.id)
        .order("created_at", { ascending: false })
        .limit(50);

      let embedded = 0;
      for (const doc of docs ?? []) {
        await embedAndStore(brand.id, doc.chunk_text, doc.document_type, doc.source_reference ?? "");
        embedded++;
      }

      let quarterly = false;
      if (isQ) {
        const context = await loadBrandContext(brand.id);
        if (context) {
          const handlers = makeToolHandlers(brand.id, supabase);
          const review   = await generateQuarterlyReview(context, handlers);

          const weekOf = nowISO.slice(0, 10);
          await supabase.from("weekly_reports").upsert({
            brand_id:             brand.id,
            week_of:              weekOf,
            report_markdown:      review,
            metrics_snapshot:     {},
            top_wins:             [],
            top_leaks:            [],
            babuu_recommendations: [],
          });

          if (brand.contact_email && process.env.RESEND_API_KEY) {
            await resend.emails.send({
              from:    "Babuu <reports@geminel.studio>",
              to:      brand.contact_email,
              subject: `Q${Math.ceil((month + 1) / 3)} review — ${brand.brand_name}`,
              html:    `<pre style="font-family:sans-serif;white-space:pre-wrap">${review}</pre>`,
            }).catch((e: Error) => console.error("Quarterly email error:", e.message));
          }

          quarterly = true;
        }
      }

      results.push({ brandId: brand.id, embedded, quarterly });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Unknown error";
      results.push({ brandId: brand.id, embedded: 0, error: msg });
    }
  }

  return NextResponse.json({ results, ts: nowISO });
}

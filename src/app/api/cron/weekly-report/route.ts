// GET /api/cron/weekly-report
// Runs every Monday 9 AM UTC via Vercel Cron.
// Generates and sends weekly reports for all active brands.
// Protected by CRON_SECRET env var.

import { NextRequest, NextResponse } from "next/server";
import { createServiceSupabaseClient } from "@/lib/supabase-server";
import { loadBrandContext } from "@/lib/brand-context";
import { generateWeeklyReport } from "@/agent/babuu";
import { Resend } from "resend";
import { fetchAnalytics } from "@/lib/skills/analytics";

const resend = new Resend(process.env.RESEND_API_KEY ?? "re_not_configured");

export async function GET(req: NextRequest) {
  // Verify cron secret
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const db = createServiceSupabaseClient();
  const weekOf = getMonday(new Date()).toISOString().split("T")[0];

  // Fetch all active brands
  const { data: brands, error } = await db
    .from("brands")
    .select("id, brand_name, contact_email, review_cadence, timezone")
    .eq("archived", false);

  if (error || !brands) {
    return NextResponse.json({ error: "Failed to load brands" }, { status: 500 });
  }

  const results = await Promise.allSettled(
    brands
      .filter((b) => b.review_cadence === "weekly" || b.review_cadence === "monthly")
      .map(async (brandRow) => {
        const brand = await loadBrandContext(brandRow.id);
        if (!brand) return { brand_id: brandRow.id, status: "skipped" };

        // Pull metrics snapshot
        const metricsSnapshot = await fetchAnalytics(
          brandRow.id,
          0,
          "all",
          "last_7_days"
        );

        // Get content lab summary
        const { data: labData } = await db
          .from("content_lab_tests")
          .select("variable_tested, status, learning, winner")
          .eq("brand_id", brandRow.id)
          .eq("status", "active");

        // Generate report via Babuu
        const toolHandlers = buildMinimalHandlers(brandRow.id, db);
        const reportMarkdown = await generateWeeklyReport(
          brand,
          metricsSnapshot.data as Record<string, unknown>,
          { active_tests: labData ?? [] },
          toolHandlers
        );

        // Store report
        await db.from("weekly_reports").upsert({
          brand_id: brandRow.id,
          week_of: weekOf,
          report_markdown: reportMarkdown,
          metrics_snapshot: metricsSnapshot.data as Record<string, unknown>,
          content_lab_summary: { active_tests: labData ?? [] },
        });

        // Send email if contact email is set
        if (brandRow.contact_email) {
          await resend.emails.send({
            from: "Babuu by Geminel <babuu@geminel.co>",
            to: brandRow.contact_email,
            subject: `${brandRow.brand_name}: Weekly Marketing Report`,
            text: reportMarkdown,
          });
        }

        return { brand_id: brandRow.id, status: "sent", week_of: weekOf };
      })
  );

  const successful = results.filter((r) => r.status === "fulfilled").length;
  const failed = results.filter((r) => r.status === "rejected").length;

  return NextResponse.json({
    processed: brands.length,
    successful,
    failed,
    week_of: weekOf,
  });
}

function getMonday(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

// Minimal tool handlers for cron context (no user session)
function buildMinimalHandlers(brandId: string, db: ReturnType<typeof createServiceSupabaseClient>) {
  return {
    fetchAnalytics: (bid: string, stage: number, platform: string, dateRange: string) =>
      fetchAnalytics(bid, stage, platform, dateRange),
    searchPastContent: async () => ({ data: [], confidence: "high" as const }),
    getContentLabStatus: async () => ({ data: [], confidence: "high" as const }),
    getSEOSnapshot: async () => ({ data: {}, confidence: "low" as const }),
    getAdsPerformance: async () => ({ data: [], confidence: "low" as const }),
    getVideoAssets: async () => ({ data: [], confidence: "high" as const }),
    diagnoseStage: async () => ({ data: {}, confidence: "medium" as const }),
    generateContentDraft: async () => ({ data: {}, confidence: "medium" as const }),
  };
}

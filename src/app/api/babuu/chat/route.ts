// POST /api/babuu/chat
// Main endpoint for Babuu conversation.
// Loads brand context, runs agentic loop, returns response.

import { NextRequest, NextResponse } from "next/server";
import { askBabuu, type BabuuToolHandlers } from "@/agent/babuu";
import { loadBrandContext } from "@/lib/brand-context";
import { fetchAnalytics } from "@/lib/skills/analytics";
import { createServiceSupabaseClient } from "@/lib/supabase-server";
import { createServerSupabaseClient } from "@/lib/supabase-server";

export async function POST(req: NextRequest) {
  // Environment guard — return a clear message instead of a crash
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    return NextResponse.json(
      { error: "Babuu is not connected yet. Add Supabase credentials to .env.local to bring me online." },
      { status: 503 }
    );
  }
  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json(
      { error: "Babuu's brain is missing. Add ANTHROPIC_API_KEY to .env.local." },
      { status: 503 }
    );
  }

  // MVP: session check disabled so the chat works before auth is set up.
  // Re-enable before onboarding external clients.
  const supabase = await createServerSupabaseClient();
  // const { data: { session } } = await supabase.auth.getSession();
  // if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  void supabase;

  const body = await req.json();
  const { brand_id, message, session_id, conversation_history } = body;

  if (!brand_id || !message) {
    return NextResponse.json(
      { error: "brand_id and message are required" },
      { status: 400 }
    );
  }

  // Load full brand context
  const brand = await loadBrandContext(brand_id);
  if (!brand) {
    return NextResponse.json(
      { error: "Brand not found or access denied" },
      { status: 404 }
    );
  }

  // Wire up tool handlers
  // These call real data sources. Claude only receives results.
  const db = createServiceSupabaseClient();

  const toolHandlers: BabuuToolHandlers = {
    fetchAnalytics: (brandId, stage, platform, dateRange) =>
      fetchAnalytics(brandId, stage, platform, dateRange),

    searchPastContent: async (brandId, query, limit = 5) => {
      const { data } = await db
        .from("content_calendar")
        .select("platform, format, pillar, hook, body, performance, published_at")
        .eq("brand_id", brandId)
        .eq("status", "published")
        .order("published_at", { ascending: false })
        .limit(50);

      // Simple text search on hook and body (semantic search would use embeddings)
      const results = (data ?? [])
        .filter(
          (post) =>
            post.hook?.toLowerCase().includes(query.toLowerCase()) ||
            post.body?.toLowerCase().includes(query.toLowerCase()) ||
            post.pillar?.toLowerCase().includes(query.toLowerCase())
        )
        .slice(0, limit);

      return {
        data: results,
        confidence: "high",
        sources: [{ type: "client_data", reference: "content calendar", date: new Date().toISOString() }],
      };
    },

    getContentLabStatus: async (brandId, status) => {
      const query = db
        .from("content_lab_tests")
        .select("*")
        .eq("brand_id", brandId);

      if (status !== "all") {
        query.eq("status", status);
      }

      const { data } = await query.order("created_at", { ascending: false });

      return {
        data: data ?? [],
        confidence: "high",
        sources: [{ type: "client_data", reference: "content lab tests", date: new Date().toISOString() }],
      };
    },

    getSEOSnapshot: async (brandId) => {
      // Returns cached SEO data from analytics_cache
      const { data } = await db
        .from("analytics_cache")
        .select("metrics, fetched_at")
        .eq("brand_id", brandId)
        .eq("platform", "semrush")
        .order("fetched_at", { ascending: false })
        .limit(1);

      if (!data || data.length === 0) {
        return {
          data: { error: "No SEO data. Connect Semrush and GSC integrations." },
          confidence: "low",
          error: "No SEO data available",
        };
      }

      return {
        data: data[0].metrics,
        confidence: "high",
        stale: new Date(data[0].fetched_at) < new Date(Date.now() - 24 * 60 * 60 * 1000),
        stale_since: data[0].fetched_at,
        sources: [{ type: "client_data", reference: "Semrush + GSC", date: data[0].fetched_at }],
      };
    },

    getAdsPerformance: async (brandId, platform, dateRange) => {
      const platformFilter = platform === "all" ? undefined : platform;
      const query = db
        .from("ad_campaigns")
        .select("platform, campaign_name, status, performance, daily_budget")
        .eq("brand_id", brandId)
        .eq("status", "active");

      if (platformFilter) {
        query.eq("platform", platformFilter);
      }

      const { data } = await query;

      return {
        data: data ?? [],
        confidence: data && data.length > 0 ? "high" : "low",
        sources: data && data.length > 0
          ? [{ type: "client_data", reference: `${platform} ads`, date: new Date().toISOString() }]
          : undefined,
        error: !data || data.length === 0 ? "No active campaigns or integration not connected." : undefined,
      };
    },

    getVideoAssets: async (brandId, status) => {
      const query = db
        .from("video_assets")
        .select("*")
        .eq("brand_id", brandId);

      if (status !== "all") {
        query.eq("status", status);
      }

      const { data } = await query.order("created_at", { ascending: false });

      return {
        data: data ?? [],
        confidence: "high",
        sources: [{ type: "client_data", reference: "video asset library", date: new Date().toISOString() }],
      };
    },

    diagnoseStage: async (brandId, stage) => {
      // Pull analytics for the stage and compare against targets
      const analyticsResult = await fetchAnalytics(brandId, stage, "all", "last_30_days");
      const brand = await loadBrandContext(brandId);

      return {
        data: {
          stage,
          analytics: analyticsResult.data,
          quarterly_target: brand?.quarterly_targets,
          biggest_leak: brand?.biggest_leak,
          past_losses_relevant: brand?.past_losses.filter((l) =>
            l.description.toLowerCase().includes(`stage ${stage}`)
          ),
        },
        confidence: analyticsResult.confidence,
        sources: analyticsResult.sources,
      };
    },

    generateContentDraft: async (brandId, params) => {
      // This is handled by Babuu itself with the full brand context loaded.
      // Return metadata so Babuu knows what it's drafting.
      return {
        data: {
          brand_id: brandId,
          content_type: params.content_type,
          platform: params.platform,
          pillar: params.pillar,
          goal: params.goal,
          stage: params.stage,
          status: "draft_requested",
          requires_approval: true,
        },
        confidence: "medium",
        sources: [
          { type: "geminel_playbook" as const, reference: "Content Lab", date: new Date().toISOString() },
        ],
      };
    },

    manageTasks: async (brandId, params) => {
      const action = params.action as string;
      const nowISO = new Date().toISOString();

      if (action === "list") {
        let q = db.from("tasks").select("*").eq("brand_id", brandId)
          .order("due_date", { ascending: true });
        const filter = params.status_filter as string | undefined;
        if (filter && filter !== "all") q = q.eq("status", filter);
        const { data } = await q;
        return {
          data: data ?? [],
          confidence: "high",
          sources: [{ type: "client_data" as const, reference: "task board", date: nowISO }],
        };
      }

      if (action === "create") {
        const { data, error } = await db.from("tasks").insert({
          brand_id:    brandId,
          title:       params.title as string,
          description: (params.description as string) ?? null,
          owner:       (params.owner as string) ?? null,
          due_date:    (params.due_date as string) ?? null,
          priority:    (params.priority as string) ?? "medium",
          category:    (params.category as string) ?? null,
          created_by:  "babuu",
        }).select().single();
        return {
          data: error ? { error: error.message } : { created: true, task: data },
          confidence: "high",
          sources: [{ type: "client_data" as const, reference: "task board", date: nowISO }],
        };
      }

      if (action === "update" || action === "complete") {
        const updates: Record<string, unknown> = { updated_at: nowISO };
        if (action === "complete") {
          updates.status = "done";
          updates.completed_at = nowISO;
          updates.auto_completed = true;
        } else {
          if (params.title)     updates.title = params.title;
          if (params.owner)     updates.owner = params.owner;
          if (params.due_date)  updates.due_date = params.due_date;
          if (params.priority)  updates.priority = params.priority;
        }
        const { data, error } = await db.from("tasks")
          .update(updates)
          .eq("id", params.task_id as string)
          .eq("brand_id", brandId)
          .select().single();
        return {
          data: error ? { error: error.message } : { updated: true, task: data },
          confidence: "high",
          sources: [{ type: "client_data" as const, reference: "task board", date: nowISO }],
        };
      }

      return { data: { error: `Unknown action: ${action}` }, confidence: "low" };
    },
  };

  try {
    const response = await askBabuu(
      brand,
      conversation_history ?? [],
      message,
      toolHandlers
    );

    // Persist to conversation history
    const sessionId = session_id ?? crypto.randomUUID();
    await db.from("babuu_conversations").insert([
      {
        brand_id,
        session_id:    sessionId,
        role:          "user" as const,
        content:       message,
        skills_called: [],
        sources_cited: [],
        confidence:    null,
      },
      {
        brand_id,
        session_id:    sessionId,
        role:          "assistant" as const,
        content:       response.content,
        skills_called: response.skills_called,
        sources_cited: response.sources as unknown as import("@/types/database").Json,
        confidence:    response.confidence,
      },
    ]);

    return NextResponse.json({
      session_id: sessionId,
      response,
    });
  } catch (error) {
    console.error("Babuu error:", error);
    return NextResponse.json(
      { error: "Babuu encountered an error. Please try again." },
      { status: 500 }
    );
  }
}

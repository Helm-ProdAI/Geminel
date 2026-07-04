// Runs every 15 minutes (see vercel.json)
// Publishes approved, scheduled content whose time has arrived.
// Publisher backends (checked in order):
//   1. Postiz (self-hosted)  — POSTIZ_API_URL + POSTIZ_API_KEY
//   2. Ayrshare              — AYRSHARE_API_KEY
// With neither configured, posts stay in 'scheduled' with a clear error note,
// so nothing is silently lost.
// After a successful publish, any task linked to the post auto-completes.

import { NextRequest, NextResponse } from "next/server";
import { createServiceSupabaseClient } from "@/lib/supabase-server";

function verifyCron(req: NextRequest): boolean {
  return req.headers.get("authorization") === `Bearer ${process.env.CRON_SECRET}`;
}

interface PublishResult {
  ok: boolean;
  platform_post_id?: string;
  error?: string;
}

async function publishViaAyrshare(post: {
  platform: string;
  body: string | null;
  hook: string | null;
  asset_urls: string[];
}): Promise<PublishResult> {
  const key = process.env.AYRSHARE_API_KEY;
  if (!key) return { ok: false, error: "no publisher" };

  const platformMap: Record<string, string> = {
    instagram: "instagram", facebook: "facebook", tiktok: "tiktok",
    youtube: "youtube", x: "twitter", twitter: "twitter", threads: "threads",
    linkedin: "linkedin",
  };
  const target = platformMap[post.platform];
  if (!target) return { ok: false, error: `Ayrshare does not map platform: ${post.platform}` };

  const res = await fetch("https://app.ayrshare.com/api/post", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      post: [post.hook, post.body].filter(Boolean).join("\n\n"),
      platforms: [target],
      mediaUrls: post.asset_urls?.length ? post.asset_urls : undefined,
    }),
  });

  const data = await res.json().catch(() => null);
  if (!res.ok || data?.status === "error") {
    return { ok: false, error: data?.message ?? `Ayrshare ${res.status}` };
  }
  return { ok: true, platform_post_id: data?.id ?? data?.postIds?.[0]?.id };
}

async function publishViaPostiz(post: {
  platform: string;
  body: string | null;
  hook: string | null;
  asset_urls: string[];
}): Promise<PublishResult> {
  const url = process.env.POSTIZ_API_URL;
  const key = process.env.POSTIZ_API_KEY;
  if (!url || !key) return { ok: false, error: "no publisher" };

  const res = await fetch(`${url.replace(/\/$/, "")}/api/public/v1/posts`, {
    method: "POST",
    headers: { Authorization: key, "Content-Type": "application/json" },
    body: JSON.stringify({
      type: "now",
      content: [post.hook, post.body].filter(Boolean).join("\n\n"),
      platform: post.platform,
      media: post.asset_urls ?? [],
    }),
  });

  const data = await res.json().catch(() => null);
  if (!res.ok) return { ok: false, error: data?.message ?? `Postiz ${res.status}` };
  return { ok: true, platform_post_id: data?.id };
}

export async function GET(req: NextRequest) {
  if (!verifyCron(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createServiceSupabaseClient();
  const nowISO = new Date().toISOString();

  // Due posts: approved-and-scheduled, time has passed, fewer than 3 failed attempts
  const { data: due } = await supabase
    .from("content_calendar")
    .select("id, brand_id, platform, hook, body, asset_urls, publish_attempts")
    .eq("status", "scheduled")
    .lte("scheduled_for", nowISO)
    .lt("publish_attempts", 3);

  if (!due?.length) {
    return NextResponse.json({ published: 0, message: "Nothing due", ts: nowISO });
  }

  let published = 0;
  const failures: { id: string; error: string }[] = [];

  for (const post of due) {
    // Try Postiz first (self-hosted preference), then Ayrshare
    let result = await publishViaPostiz(post);
    if (!result.ok && result.error === "no publisher") {
      result = await publishViaAyrshare(post);
    }

    if (result.ok) {
      await supabase.from("content_calendar").update({
        status: "published",
        published_at: nowISO,
        platform_post_id: result.platform_post_id ?? null,
        last_publish_error: null,
        updated_at: nowISO,
      }).eq("id", post.id);

      // Auto-complete any task linked to this post
      await supabase.from("tasks").update({
        status: "done",
        completed_at: nowISO,
        auto_completed: true,
        updated_at: nowISO,
      })
        .eq("linked_entity_type", "content_calendar")
        .eq("linked_entity_id", post.id)
        .neq("status", "done");

      published++;
    } else {
      const errMsg = result.error === "no publisher"
        ? "No publisher configured. Set POSTIZ_API_URL + POSTIZ_API_KEY or AYRSHARE_API_KEY."
        : result.error ?? "Unknown publish error";

      await supabase.from("content_calendar").update({
        publish_attempts: (post.publish_attempts ?? 0) + 1,
        last_publish_error: errMsg,
        updated_at: nowISO,
      }).eq("id", post.id);

      failures.push({ id: post.id, error: errMsg });
    }
  }

  return NextResponse.json({ published, failed: failures.length, failures, ts: nowISO });
}

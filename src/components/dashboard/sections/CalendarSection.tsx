"use client";

import { useState } from "react";
import { CalendarDays, Plus, Clock, CheckCircle2, Circle, AlertCircle, Pencil } from "lucide-react";

type PostStatus = "draft" | "scheduled" | "published" | "missed";
type Platform = "instagram" | "tiktok" | "linkedin" | "twitter" | "facebook" | "email";
type ContentPillar = "teach" | "trust" | "connect" | "convert" | "celebrate";

interface ContentPost {
  id: string;
  title: string;
  caption_draft?: string;
  platform: Platform;
  pillar: ContentPillar;
  growth_stage: 1 | 2 | 3 | 4 | 5;
  scheduled_for: string; // ISO datetime
  status: PostStatus;
  format?: string;
  ai_generated?: boolean;
}

const PLATFORM_COLORS: Record<Platform, string> = {
  instagram: "#E1306C", tiktok: "#FF0050", linkedin: "#0A66C2",
  twitter: "#1DA1F2",   facebook: "#1877F2", email: "#6EC4A0",
};

const PILLAR_COLORS: Record<ContentPillar, string> = {
  teach:     "#7C82D4",
  trust:     "#6FB8D4",
  connect:   "#6EC4A0",
  convert:   "#D4B86E",
  celebrate: "#D47CAA",
};

const STATUS_CONFIG: Record<PostStatus, { icon: React.ElementType; color: string; label: string }> = {
  draft:     { icon: Circle,       color: "#AEB6D4", label: "Draft" },
  scheduled: { icon: Clock,        color: "#D8B779", label: "Scheduled" },
  published: { icon: CheckCircle2, color: "#6EC4A0", label: "Published" },
  missed:    { icon: AlertCircle,  color: "#E07878", label: "Missed" },
};

const STAGE_NAMES = ["", "Awareness", "Consideration", "Conversion", "Loyalty", "Advocacy"];

// Today + 14-day window for calendar
const NOW_DATE  = new Date("2026-06-29");

function addDays(d: Date, n: number): Date {
  const r = new Date(d); r.setDate(r.getDate() + n); return r;
}

function dateKey(d: Date): string {
  return d.toISOString().slice(0, 10);
}

const CALENDAR_DAYS: Date[] = Array.from({ length: 14 }, (_, i) => addDays(NOW_DATE, i - 2));

const PLACEHOLDER_POSTS: ContentPost[] = [
  {
    id: "1", title: "3 brand mistakes that cost you clients",
    caption_draft: "Most founders skip the Consideration stage. Here's what that actually costs you...",
    platform: "instagram", pillar: "teach", growth_stage: 1,
    scheduled_for: "2026-06-29T09:00:00", status: "scheduled", format: "Reel", ai_generated: true,
  },
  {
    id: "2", title: "Behind the scenes — strategy day",
    platform: "instagram", pillar: "connect", growth_stage: 1,
    scheduled_for: "2026-06-30T11:00:00", status: "draft", format: "Carousel",
  },
  {
    id: "3", title: "New client case study — 3x email revenue",
    caption_draft: "Six months ago they had 800 subscribers and 12% open rate. Today...",
    platform: "linkedin", pillar: "trust", growth_stage: 2,
    scheduled_for: "2026-07-01T08:00:00", status: "scheduled", format: "Article", ai_generated: true,
  },
  {
    id: "4", title: "What's brand positioning (and why most get it wrong)",
    platform: "tiktok", pillar: "teach", growth_stage: 1,
    scheduled_for: "2026-07-02T18:00:00", status: "draft", format: "Short video",
  },
  {
    id: "5", title: "Free brand audit — DM 'AUDIT'",
    platform: "instagram", pillar: "convert", growth_stage: 3,
    scheduled_for: "2026-07-03T10:00:00", status: "scheduled", format: "Story", ai_generated: true,
  },
  {
    id: "6", title: "Weekly marketing roundup — June 29",
    platform: "email", pillar: "teach", growth_stage: 2,
    scheduled_for: "2026-06-29T06:00:00", status: "published", format: "Email",
  },
  {
    id: "7", title: "Client win spotlight — @clienthandle",
    platform: "instagram", pillar: "celebrate", growth_stage: 4,
    scheduled_for: "2026-07-05T12:00:00", status: "draft", format: "Story",
  },
];

export function CalendarSection({ brandId }: { brandId: string }) {
  const [posts, setPosts]           = useState<ContentPost[]>(PLACEHOLDER_POSTS);
  const [selectedDate, setSelected] = useState<string>(dateKey(NOW_DATE));
  const [editPost, setEditPost]     = useState<ContentPost | null>(null);
  const [showNew, setShowNew]       = useState(false);

  const postsByDate: Record<string, ContentPost[]> = {};
  posts.forEach((p) => {
    const day = p.scheduled_for.slice(0, 10);
    if (!postsByDate[day]) postsByDate[day] = [];
    postsByDate[day].push(p);
  });

  const todayPosts     = postsByDate[selectedDate] ?? [];
  const allDrafts      = posts.filter((p) => p.status === "draft");
  const scheduledCount = posts.filter((p) => p.status === "scheduled").length;
  const publishedCount = posts.filter((p) => p.status === "published").length;

  return (
    <div className="flex h-full overflow-hidden">

      {/* Left: calendar strip */}
      <div
        className="flex w-56 shrink-0 flex-col overflow-y-auto"
        style={{ borderRight: "1px solid rgba(174,182,212,0.1)" }}
      >
        <div className="p-5" style={{ borderBottom: "1px solid rgba(174,182,212,0.1)" }}>
          <div className="eyebrow mb-1">Calendar</div>
          <p style={{ fontFamily: "Fraunces, Georgia, serif", fontWeight: 300, fontSize: 14, color: "#EDEFF7" }}>
            Content pipeline
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-1 p-3" style={{ borderBottom: "1px solid rgba(174,182,212,0.08)" }}>
          {[
            { label: "Sched.",   value: scheduledCount, color: "#D8B779" },
            { label: "Published",value: publishedCount, color: "#6EC4A0" },
            { label: "Drafts",   value: allDrafts.length, color: "#AEB6D4" },
          ].map((s) => (
            <div key={s.label} className="text-center p-2 rounded" style={{ background: "rgba(7,11,28,0.4)" }}>
              <p style={{ fontFamily: "Fraunces, Georgia, serif", fontSize: 16, color: s.color, fontWeight: 300 }}>{s.value}</p>
              <p className="text-xs mt-0.5" style={{ color: "rgba(174,182,212,0.5)", lineHeight: 1.2 }}>{s.label}</p>
            </div>
          ))}
        </div>

        {/* Day list */}
        <div className="flex-1 overflow-y-auto px-2 py-2">
          {CALENDAR_DAYS.map((day) => {
            const key     = dateKey(day);
            const dayPosts = postsByDate[key] ?? [];
            const isToday = key === dateKey(NOW_DATE);
            const isSel   = key === selectedDate;

            return (
              <button
                key={key}
                onClick={() => setSelected(key)}
                className="flex w-full items-center justify-between rounded-md px-3 py-2 text-left text-xs mb-0.5 transition-all"
                style={{
                  background: isSel ? "rgba(231,201,138,0.08)" : "transparent",
                  border: `1px solid ${isSel ? "rgba(216,183,121,0.28)" : "transparent"}`,
                }}
              >
                <div>
                  <span style={{ color: isSel ? "#E7C98A" : isToday ? "#E7C98A" : "#AEB6D4" }}>
                    {day.toLocaleDateString("en-US", { weekday: "short" })}
                  </span>
                  <span className="ml-1.5" style={{ color: isSel ? "#EDEFF7" : "#AEB6D4" }}>
                    {day.getDate()}
                  </span>
                  {isToday && <span className="ml-1 text-xs" style={{ color: "rgba(231,201,138,0.5)" }}>Today</span>}
                </div>
                {dayPosts.length > 0 && (
                  <div className="flex gap-0.5">
                    {dayPosts.slice(0, 3).map((p) => (
                      <span
                        key={p.id}
                        className="h-1.5 w-1.5 rounded-full"
                        style={{ background: PLATFORM_COLORS[p.platform] }}
                      />
                    ))}
                  </div>
                )}
              </button>
            );
          })}
        </div>

        {/* Add post button */}
        <div className="p-3">
          <button
            onClick={() => setShowNew(true)}
            className="flex w-full items-center justify-center gap-1.5 rounded-md py-2 text-xs transition-all"
            style={{ background: "rgba(231,201,138,0.08)", border: "1px solid rgba(216,183,121,0.25)", color: "#E7C98A" }}
          >
            <Plus className="h-3.5 w-3.5" />
            Add post
          </button>
        </div>
      </div>

      {/* Right: day detail */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="mb-5 flex items-center justify-between">
          <div>
            <h2 style={{ fontFamily: "Fraunces, Georgia, serif", fontWeight: 300, fontSize: 20, color: "#EDEFF7" }}>
              {new Date(selectedDate + "T12:00:00").toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
            </h2>
            <p className="text-xs mt-0.5" style={{ color: "#AEB6D4" }}>
              {todayPosts.length === 0 ? "Nothing scheduled" : `${todayPosts.length} piece${todayPosts.length !== 1 ? "s" : ""} scheduled`}
            </p>
          </div>
        </div>

        {todayPosts.length === 0 ? (
          <div
            className="rounded-md p-6 text-center"
            style={{ background: "#0E1530", border: "1px dashed rgba(174,182,212,0.15)" }}
          >
            <CalendarDays className="h-8 w-8 mx-auto mb-3" style={{ color: "rgba(216,183,121,0.2)" }} />
            <p style={{ fontFamily: "Fraunces, Georgia, serif", fontWeight: 300, color: "#EDEFF7" }}>Nothing scheduled</p>
            <p className="text-xs mt-1" style={{ color: "#AEB6D4" }}>Add a post for this date or ask Babuu to draft one.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {todayPosts.map((post) => <PostCard key={post.id} post={post} onEdit={() => setEditPost(post)} />)}
          </div>
        )}

        {/* Draft queue */}
        {allDrafts.length > 0 && (
          <div className="mt-8">
            <div className="eyebrow mb-3" style={{ letterSpacing: "0.28em" }}>Unscheduled drafts</div>
            <div className="flex flex-col gap-2">
              {allDrafts.map((post) => <PostCard key={post.id} post={post} onEdit={() => setEditPost(post)} compact />)}
            </div>
          </div>
        )}
      </div>

      {/* Post editor panel */}
      {editPost && (
        <PostEditor post={editPost} onClose={() => setEditPost(null)} />
      )}
    </div>
  );
}

function PostCard({ post, onEdit, compact = false }: { post: ContentPost; onEdit: () => void; compact?: boolean }) {
  const status = STATUS_CONFIG[post.status];
  const StatusIcon = status.icon;
  const pillarColor = PILLAR_COLORS[post.pillar];

  return (
    <div
      className="rounded-md p-4"
      style={{ background: "#0E1530", border: `1px solid rgba(174,182,212,${compact ? "0.06" : "0.1"})` }}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          {/* Platform + pillar */}
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            <span
              className="rounded-full px-2 py-0.5 text-xs"
              style={{
                background: `${PLATFORM_COLORS[post.platform]}12`,
                color: PLATFORM_COLORS[post.platform],
                border: `1px solid ${PLATFORM_COLORS[post.platform]}30`,
              }}
            >
              {post.platform.charAt(0).toUpperCase() + post.platform.slice(1)}
            </span>
            <span
              className="rounded-full px-2 py-0.5 text-xs capitalize"
              style={{ background: `${pillarColor}10`, color: pillarColor, border: `1px solid ${pillarColor}30` }}
            >
              {post.pillar}
            </span>
            <span className="text-xs capitalize" style={{ color: "rgba(174,182,212,0.5)" }}>
              Stage {post.growth_stage} — {STAGE_NAMES[post.growth_stage]}
            </span>
            {post.ai_generated && (
              <span className="text-xs" style={{ color: "rgba(216,183,121,0.5)" }}>AI-drafted</span>
            )}
          </div>

          <p className="text-sm font-medium" style={{ color: "#EDEFF7" }}>{post.title}</p>

          {post.caption_draft && !compact && (
            <p className="text-xs mt-1.5 line-clamp-2" style={{ color: "#AEB6D4", fontWeight: 300 }}>
              {post.caption_draft}
            </p>
          )}

          <div className="flex items-center gap-3 mt-2">
            <div className="flex items-center gap-1">
              <StatusIcon className="h-3 w-3" style={{ color: status.color }} />
              <span className="text-xs" style={{ color: status.color }}>{status.label}</span>
            </div>
            {post.format && (
              <span className="text-xs" style={{ color: "rgba(174,182,212,0.5)" }}>{post.format}</span>
            )}
            {!compact && (
              <span className="text-xs" style={{ color: "rgba(174,182,212,0.4)" }}>
                {new Date(post.scheduled_for).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}
              </span>
            )}
          </div>
        </div>

        <button
          onClick={onEdit}
          className="shrink-0 p-1.5 rounded transition-all"
          style={{ color: "#AEB6D4" }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = "#E7C98A"; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = "#AEB6D4"; }}
        >
          <Pencil className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}

function PostEditor({ post, onClose }: { post: ContentPost; onClose: () => void }) {
  const [caption, setCaption] = useState(post.caption_draft ?? "");

  return (
    <div
      className="flex w-80 shrink-0 flex-col"
      style={{ borderLeft: "1px solid rgba(174,182,212,0.1)", background: "#070B1C" }}
    >
      <div className="flex items-center justify-between p-5" style={{ borderBottom: "1px solid rgba(174,182,212,0.1)" }}>
        <div>
          <div className="eyebrow mb-0.5">Editing post</div>
          <p className="text-xs" style={{ color: "#AEB6D4" }}>{post.platform}</p>
        </div>
        <button onClick={onClose} className="text-xs" style={{ color: "#AEB6D4" }}>Close</button>
      </div>

      <div className="flex-1 overflow-y-auto p-5">
        <div className="mb-4">
          <label className="mb-1.5 block text-xs" style={{ color: "#AEB6D4" }}>Title</label>
          <p className="text-sm" style={{ color: "#EDEFF7" }}>{post.title}</p>
        </div>

        <div className="mb-4">
          <label className="mb-1.5 block text-xs" style={{ color: "#AEB6D4" }}>Caption / Copy</label>
          <textarea
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            rows={8}
            className="w-full rounded border px-3 py-2 text-sm outline-none resize-none"
            style={{
              background: "rgba(14,21,48,0.8)",
              borderColor: "rgba(174,182,212,0.2)",
              color: "#EDEFF7",
              lineHeight: 1.6,
            }}
          />
        </div>

        <div className="mb-4">
          <label className="mb-1.5 block text-xs" style={{ color: "#AEB6D4" }}>Scheduled for</label>
          <input
            type="datetime-local"
            defaultValue={post.scheduled_for.slice(0, 16)}
            className="w-full rounded border px-3 py-2 text-sm outline-none"
            style={{ background: "rgba(14,21,48,0.8)", borderColor: "rgba(174,182,212,0.2)", color: "#EDEFF7" }}
          />
        </div>

        {/* Babuu caption refine */}
        <div className="rounded-md p-3 mb-4" style={{ background: "rgba(231,201,138,0.04)", border: "1px solid rgba(216,183,121,0.18)" }}>
          <p className="text-xs mb-2" style={{ color: "#D8B779" }}>Ask Babuu to refine this caption</p>
          <input
            placeholder="e.g. Make it punchier, shorter hook"
            className="w-full rounded border px-3 py-2 text-xs outline-none"
            style={{ background: "rgba(7,11,28,0.6)", borderColor: "rgba(174,182,212,0.15)", color: "#EDEFF7" }}
          />
        </div>

        <div className="flex gap-2">
          <button
            className="flex-1 rounded-md py-2 text-sm"
            style={{ background: "#E7C98A", color: "#070B1C" }}
          >
            Save
          </button>
          <button
            className="flex-1 rounded-md py-2 text-sm"
            style={{ background: "rgba(174,182,212,0.08)", color: "#AEB6D4", border: "1px solid rgba(174,182,212,0.15)" }}
            onClick={onClose}
          >
            Discard
          </button>
        </div>
      </div>
    </div>
  );
}

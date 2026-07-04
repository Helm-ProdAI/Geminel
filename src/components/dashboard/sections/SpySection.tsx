"use client";

import { useEffect, useState } from "react";
import { Eye, Plus, ExternalLink, Flame } from "lucide-react";

interface Swipe {
  id: string;
  competitor_name: string;
  competitor_handle?: string | null;
  platform: string;
  swipe_type: string;
  content_url?: string | null;
  headline?: string | null;
  body_copy?: string | null;
  cta?: string | null;
  format?: string | null;
  first_seen: string;
  still_running?: boolean;
  babuu_analysis?: string | null;
  tags: string[];
}

const SWIPE_TYPES = [
  { id: "organic_post", label: "Organic post" },
  { id: "paid_ad",      label: "Paid ad" },
  { id: "landing_page", label: "Landing page" },
  { id: "email",        label: "Email" },
  { id: "funnel",       label: "Funnel" },
];

const PLATFORMS = ["instagram", "facebook", "tiktok", "youtube", "x", "threads", "meta_ads", "google_ads"];

const DEMO_SWIPES: Swipe[] = [
  {
    id: "s1", competitor_name: "StudioNorth", competitor_handle: "@studionorth", platform: "instagram",
    swipe_type: "organic_post", format: "carousel", first_seen: "2026-06-20",
    headline: "We audited 100 brand bios. 90 made the same mistake.",
    body_copy: "Slide-by-slide breakdown of the bio formula: who you help + what changes + proof + one CTA.",
    cta: "Save this for your next bio rewrite",
    babuu_analysis: "This works because it opens with earned authority (100 audits) and a curiosity gap (the same mistake). The carousel format forces engagement through swipes, which the algorithm rewards. Adapt the audit-driven authority angle for our Consideration content: we have real client data to draw the same kind of pattern claims from.",
    tags: ["hook", "carousel", "authority"],
  },
  {
    id: "s2", competitor_name: "GrowthCraft", platform: "meta_ads",
    swipe_type: "paid_ad", format: "video", first_seen: "2026-04-12", still_running: true,
    headline: "Your marketing isn't broken. Your sequence is.",
    body_copy: "15-second talking head, pattern interrupt open, one clear promise, social proof overlay at second 8.",
    cta: "Book a free teardown",
    babuu_analysis: "Running since April, which means it converts. The one-line reframe headline does the heavy lifting: it absolves the viewer of blame then names a fixable villain. The free teardown offer is low-friction and qualifies leads by effort. Worth testing a reframe-headline ad for Geminel's own funnel.",
    tags: ["long-running", "reframe", "offer"],
  },
];

export function SpySection({ brandId }: { brandId: string }) {
  const [swipes, setSwipes] = useState<Swipe[]>(DEMO_SWIPES);
  const [isDemo, setIsDemo] = useState(true);
  const [filter, setFilter] = useState<string>("all");
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [draft, setDraft] = useState({
    competitor_name: "", competitor_handle: "", platform: "instagram",
    swipe_type: "organic_post", content_url: "", headline: "", body_copy: "", cta: "", format: "",
  });

  useEffect(() => {
    fetch(`/api/swipes?brand_id=${brandId}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.mode === "live") { setSwipes(data.swipes); setIsDemo(false); }
      })
      .catch(() => {});
  }, [brandId]);

  const competitors = [...new Set(swipes.map((s) => s.competitor_name))];
  const visible = filter === "all" ? swipes : swipes.filter((s) => s.competitor_name === filter);

  async function saveSwipe() {
    if (!draft.competitor_name || !draft.headline) return;
    setSaving(true);

    if (isDemo) {
      setSwipes((prev) => [{
        id: `tmp-${Math.random().toString(36).slice(2)}`,
        ...draft,
        first_seen: new Date().toISOString().slice(0, 10),
        tags: [],
        babuu_analysis: "Analysis available once Supabase and the Anthropic key are connected.",
      }, ...prev]);
    } else {
      const res = await fetch("/api/swipes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ brand_id: brandId, ...draft }),
      }).catch(() => null);
      if (res?.ok) {
        const saved = await res.json();
        setSwipes((prev) => [saved, ...prev]);
      }
    }

    setSaving(false);
    setShowForm(false);
    setDraft({ competitor_name: "", competitor_handle: "", platform: "instagram", swipe_type: "organic_post", content_url: "", headline: "", body_copy: "", cta: "", format: "" });
  }

  return (
    <div className="h-full overflow-y-auto px-8 py-8">
      <div className="mx-auto max-w-3xl">

        {/* Header */}
        <div className="mb-8 flex items-start justify-between">
          <div>
            <div className="eyebrow mb-2">Competitor Spy</div>
            <h1 style={{ fontFamily: "Fraunces, Georgia, serif", fontWeight: 300, fontSize: 28, color: "#EDEFF7" }}>
              The swipe file.
            </h1>
            <p className="mt-1 text-sm" style={{ color: "#AEB6D4", fontWeight: 300 }}>
              Every swipe gets a Babuu breakdown: why it works and what to adapt. Long-running ads are flagged — nobody keeps paying for losers.
            </p>
          </div>
          <button
            onClick={() => setShowForm((v) => !v)}
            className="flex items-center gap-2 rounded-md px-4 py-2 text-sm shrink-0"
            style={{ background: "rgba(231,201,138,0.1)", border: "1px solid rgba(216,183,121,0.28)", color: "#E7C98A" }}
          >
            <Plus className="h-4 w-4" />
            Save swipe
          </button>
        </div>

        {/* Add swipe form */}
        {showForm && (
          <div className="mb-8 rounded-md p-5" style={{ background: "#0E1530", border: "1px solid rgba(216,183,121,0.28)" }}>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Competitor name">
                <input value={draft.competitor_name} onChange={(e) => setDraft((p) => ({ ...p, competitor_name: e.target.value }))} className="inp" style={inpStyle} placeholder="StudioNorth" />
              </Field>
              <Field label="Handle (optional)">
                <input value={draft.competitor_handle} onChange={(e) => setDraft((p) => ({ ...p, competitor_handle: e.target.value }))} className="inp" style={inpStyle} placeholder="@studionorth" />
              </Field>
              <Field label="Platform">
                <select value={draft.platform} onChange={(e) => setDraft((p) => ({ ...p, platform: e.target.value }))} className="inp" style={inpStyle}>
                  {PLATFORMS.map((p) => <option key={p} value={p}>{p}</option>)}
                </select>
              </Field>
              <Field label="Type">
                <select value={draft.swipe_type} onChange={(e) => setDraft((p) => ({ ...p, swipe_type: e.target.value }))} className="inp" style={inpStyle}>
                  {SWIPE_TYPES.map((t) => <option key={t.id} value={t.id}>{t.label}</option>)}
                </select>
              </Field>
              <div className="col-span-2">
                <Field label="Headline / hook">
                  <input value={draft.headline} onChange={(e) => setDraft((p) => ({ ...p, headline: e.target.value }))} className="inp w-full" style={inpStyle} placeholder="The opening line that stops the scroll" />
                </Field>
              </div>
              <div className="col-span-2">
                <Field label="Body copy / description">
                  <textarea value={draft.body_copy} onChange={(e) => setDraft((p) => ({ ...p, body_copy: e.target.value }))} rows={2} className="inp w-full resize-none" style={inpStyle} placeholder="What the post or ad says and how it's structured" />
                </Field>
              </div>
              <Field label="CTA">
                <input value={draft.cta} onChange={(e) => setDraft((p) => ({ ...p, cta: e.target.value }))} className="inp" style={inpStyle} placeholder="Book a call" />
              </Field>
              <Field label="Link (optional)">
                <input value={draft.content_url} onChange={(e) => setDraft((p) => ({ ...p, content_url: e.target.value }))} className="inp" style={inpStyle} placeholder="https://..." />
              </Field>
            </div>
            <div className="mt-4 flex gap-2">
              <button onClick={saveSwipe} disabled={saving} className="rounded px-4 py-2 text-sm" style={{ background: "#E7C98A", color: "#070B1C" }}>
                {saving ? "Saving + analyzing..." : "Save to swipe file"}
              </button>
              <button onClick={() => setShowForm(false)} className="rounded px-4 py-2 text-sm" style={{ color: "#AEB6D4" }}>Cancel</button>
            </div>
          </div>
        )}

        {/* Competitor filter */}
        <div className="mb-6 flex flex-wrap gap-1.5">
          <FilterChip active={filter === "all"} onClick={() => setFilter("all")} label={`All (${swipes.length})`} />
          {competitors.map((c) => (
            <FilterChip key={c} active={filter === c} onClick={() => setFilter(c)} label={c} />
          ))}
        </div>

        {/* Swipe cards */}
        <div className="flex flex-col gap-4">
          {visible.map((swipe) => (
            <div key={swipe.id} className="rounded-md p-5" style={{ background: "#0E1530", border: "1px solid rgba(174,182,212,0.1)" }}>
              <div className="mb-2 flex items-center gap-2 flex-wrap">
                <span className="text-sm font-medium" style={{ color: "#EDEFF7" }}>{swipe.competitor_name}</span>
                {swipe.competitor_handle && <span className="text-xs" style={{ color: "#AEB6D4" }}>{swipe.competitor_handle}</span>}
                <span className="rounded-full px-2 py-0.5 text-xs capitalize" style={{ background: "rgba(174,182,212,0.08)", color: "#AEB6D4" }}>
                  {swipe.platform.replace("_", " ")}
                </span>
                <span className="rounded-full px-2 py-0.5 text-xs capitalize" style={{ background: "rgba(124,130,212,0.1)", color: "#7C82D4" }}>
                  {swipe.swipe_type.replace("_", " ")}
                </span>
                {swipe.still_running && (
                  <span className="flex items-center gap-1 rounded-full px-2 py-0.5 text-xs" style={{ background: "rgba(224,120,120,0.08)", color: "#E07878", border: "1px solid rgba(224,120,120,0.2)" }}>
                    <Flame className="h-3 w-3" /> Long-running
                  </span>
                )}
                {swipe.content_url && (
                  <a href={swipe.content_url} target="_blank" rel="noreferrer" className="ml-auto" style={{ color: "#AEB6D4" }}>
                    <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                )}
              </div>

              {swipe.headline && (
                <p className="text-sm mb-1" style={{ color: "#EDEFF7", fontStyle: "italic" }}>"{swipe.headline}"</p>
              )}
              {swipe.body_copy && (
                <p className="text-xs mb-1" style={{ color: "#AEB6D4", fontWeight: 300 }}>{swipe.body_copy}</p>
              )}
              {swipe.cta && (
                <p className="text-xs" style={{ color: "rgba(174,182,212,0.6)" }}>CTA: {swipe.cta}</p>
              )}

              {swipe.babuu_analysis && (
                <div className="mt-3 rounded px-3 py-2.5" style={{ background: "rgba(231,201,138,0.04)", border: "1px solid rgba(216,183,121,0.18)" }}>
                  <p className="eyebrow mb-1.5" style={{ letterSpacing: "0.24em", fontSize: 9 }}>Babuu breakdown</p>
                  <p className="text-xs leading-relaxed" style={{ color: "#AEB6D4", fontWeight: 300 }}>{swipe.babuu_analysis}</p>
                </div>
              )}

              <p className="mt-2 text-xs" style={{ color: "rgba(174,182,212,0.35)" }}>First seen {swipe.first_seen}</p>
            </div>
          ))}

          {visible.length === 0 && (
            <div className="py-16 text-center">
              <Eye className="h-10 w-10 mx-auto mb-3" style={{ color: "rgba(216,183,121,0.25)" }} />
              <p style={{ fontFamily: "Fraunces, Georgia, serif", fontWeight: 300, color: "#EDEFF7" }}>Empty swipe file</p>
              <p className="mt-1 text-sm" style={{ color: "#AEB6D4" }}>Save the first competitor post or ad above.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

const inpStyle: React.CSSProperties = {
  background: "rgba(7,11,28,0.6)",
  border: "1px solid rgba(174,182,212,0.2)",
  color: "#EDEFF7",
  borderRadius: 4,
  padding: "8px 12px",
  fontSize: 13,
  outline: "none",
  width: "100%",
};

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-1 block text-xs" style={{ color: "#AEB6D4" }}>{label}</label>
      {children}
    </div>
  );
}

function FilterChip({ active, onClick, label }: { active: boolean; onClick: () => void; label: string }) {
  return (
    <button
      onClick={onClick}
      className="rounded-full px-3 py-1 text-xs"
      style={{
        background: active ? "rgba(231,201,138,0.1)" : "rgba(174,182,212,0.05)",
        border: `1px solid ${active ? "rgba(216,183,121,0.35)" : "rgba(174,182,212,0.12)"}`,
        color: active ? "#E7C98A" : "#AEB6D4",
      }}
    >
      {label}
    </button>
  );
}

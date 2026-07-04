"use client";

import { useState } from "react";
import { Search, TrendingUp, TrendingDown, Minus, Globe, Sparkles, ExternalLink } from "lucide-react";

type Trend = "up" | "down" | "flat";

interface Keyword {
  id: string;
  keyword: string;
  position: number;
  previous_position: number;
  search_volume: number;
  difficulty: number;
  url: string;
  type: "seo" | "aeo";
  ai_overview_visible?: boolean;
}

interface AEOTopic {
  id: string;
  topic: string;
  query: string;
  brand_mentioned: boolean;
  position_in_overview?: number;
  last_checked: string;
}

const PLACEHOLDER_KEYWORDS: Keyword[] = [
  { id: "1", keyword: "brand strategy agency",       position: 8,  previous_position: 12, search_volume: 2400, difficulty: 42, url: "/services",     type: "seo" },
  { id: "2", keyword: "marketing intelligence tool",  position: 14, previous_position: 11, search_volume: 880,  difficulty: 51, url: "/platform",     type: "seo" },
  { id: "3", keyword: "what is brand positioning",    position: 6,  previous_position: 8,  search_volume: 5400, difficulty: 38, url: "/learn/brand",  type: "seo", ai_overview_visible: true },
  { id: "4", keyword: "geminel studio",               position: 1,  previous_position: 1,  search_volume: 210,  difficulty: 5,  url: "/",             type: "seo" },
  { id: "5", keyword: "content strategy for startups",position: 22, previous_position: 28, search_volume: 1600, difficulty: 47, url: "/blog",         type: "seo" },
];

const PLACEHOLDER_AEO: AEOTopic[] = [
  { id: "1", topic: "What is brand positioning", query: "what is brand positioning for small business", brand_mentioned: true,  position_in_overview: 2, last_checked: "2026-06-28" },
  { id: "2", topic: "Content pillar strategy",   query: "what are content pillars",                     brand_mentioned: false, last_checked: "2026-06-28" },
  { id: "3", topic: "Geminel Growth Engine",     query: "geminel growth engine marketing framework",    brand_mentioned: true,  position_in_overview: 1, last_checked: "2026-06-28" },
  { id: "4", topic: "Marketing funnel stages",   query: "how many stages in marketing funnel",          brand_mentioned: false, last_checked: "2026-06-28" },
];

function getTrend(current: number, prev: number): Trend {
  if (current < prev) return "up";
  if (current > prev) return "down";
  return "flat";
}

const TREND_CONFIG = {
  up:   { icon: TrendingUp,   color: "#6EC4A0", label: "Improving" },
  down: { icon: TrendingDown, color: "#E07878",  label: "Dropping" },
  flat: { icon: Minus,        color: "#AEB6D4",  label: "Stable" },
};

function difficultyLabel(d: number): { label: string; color: string } {
  if (d < 30) return { label: "Easy",   color: "#6EC4A0" };
  if (d < 60) return { label: "Medium", color: "#D8B779" };
  return             { label: "Hard",   color: "#E07878" };
}

export function SEOSection({ brandId }: { brandId: string }) {
  const [tab, setTab] = useState<"seo" | "aeo">("seo");

  const seoKeywords = PLACEHOLDER_KEYWORDS.filter((k) => k.type === "seo");
  const top10       = seoKeywords.filter((k) => k.position <= 10).length;
  const avg         = Math.round(seoKeywords.reduce((s, k) => s + k.position, 0) / seoKeywords.length);
  const aiVisible   = seoKeywords.filter((k) => k.ai_overview_visible).length;

  return (
    <div className="h-full overflow-y-auto px-8 py-8">
      <div className="mx-auto max-w-4xl">

        {/* Header */}
        <div className="mb-8">
          <div className="eyebrow mb-2">SEO + AEO</div>
          <h1 style={{ fontFamily: "Fraunces, Georgia, serif", fontWeight: 300, fontSize: 28, color: "#EDEFF7" }}>
            Search and AI visibility.
          </h1>
          <p className="mt-1 text-sm" style={{ color: "#AEB6D4", fontWeight: 300 }}>
            Rank where humans search. Appear where AI answers. Both matter now.
          </p>
        </div>

        {/* Tab switcher */}
        <div className="mb-6 flex gap-0" style={{ borderBottom: "1px solid rgba(174,182,212,0.1)" }}>
          {(["seo", "aeo"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className="px-5 py-2.5 text-sm transition-colors"
              style={{
                color: tab === t ? "#E7C98A" : "#AEB6D4",
                borderBottom: tab === t ? "2px solid #E7C98A" : "2px solid transparent",
                marginBottom: -1,
                background: "transparent",
              }}
            >
              {t === "seo" ? "Keyword rankings" : "AI Overview (AEO)"}
            </button>
          ))}
        </div>

        {tab === "seo" && (
          <>
            {/* Summary tiles */}
            <div className="mb-6 grid grid-cols-3 gap-3">
              {[
                { label: "Keywords tracked",   value: seoKeywords.length.toString(), sub: "via Semrush" },
                { label: "In top 10",          value: top10.toString(),             sub: "page one results" },
                { label: "Avg. position",      value: avg.toString(),               sub: "across all keywords" },
              ].map((t) => (
                <div key={t.label} className="rounded-md p-4" style={{ background: "#0E1530", border: "1px solid rgba(174,182,212,0.1)" }}>
                  <p className="text-xs mb-2" style={{ color: "#AEB6D4" }}>{t.label}</p>
                  <p style={{ fontFamily: "Fraunces, Georgia, serif", fontWeight: 300, fontSize: 26, color: "#EDEFF7" }}>{t.value}</p>
                  <p className="mt-0.5 text-xs" style={{ color: "rgba(174,182,212,0.5)" }}>{t.sub}</p>
                </div>
              ))}
            </div>

            {/* Keywords table */}
            <div className="rounded-md overflow-hidden" style={{ border: "1px solid rgba(174,182,212,0.1)" }}>
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ background: "rgba(14,21,48,0.6)", borderBottom: "1px solid rgba(174,182,212,0.1)" }}>
                    {["Keyword", "Position", "Change", "Volume", "KD", "AI"].map((h) => (
                      <th key={h} className="px-4 py-3 text-left text-xs font-medium" style={{ color: "#AEB6D4" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {seoKeywords.map((kw, i) => {
                    const trend = getTrend(kw.position, kw.previous_position);
                    const tc    = TREND_CONFIG[trend];
                    const diff  = difficultyLabel(kw.difficulty);
                    const delta = kw.previous_position - kw.position;
                    const TrendIcon = tc.icon;

                    return (
                      <tr
                        key={kw.id}
                        style={{ borderBottom: i < seoKeywords.length - 1 ? "1px solid rgba(174,182,212,0.06)" : "none", background: "#0E1530" }}
                      >
                        <td className="px-4 py-3">
                          <p style={{ color: "#EDEFF7" }}>{kw.keyword}</p>
                          <a href={kw.url} className="text-xs flex items-center gap-1 mt-0.5" style={{ color: "#AEB6D4" }}>
                            <Globe className="h-3 w-3" />{kw.url}
                          </a>
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className="rounded px-2 py-0.5 text-xs font-medium"
                            style={{
                              background: kw.position <= 3 ? "rgba(110,196,160,0.1)" : kw.position <= 10 ? "rgba(216,183,121,0.1)" : "rgba(174,182,212,0.08)",
                              color:      kw.position <= 3 ? "#6EC4A0"               : kw.position <= 10 ? "#D8B779"               : "#AEB6D4",
                            }}
                          >
                            #{kw.position}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1">
                            <TrendIcon className="h-3.5 w-3.5" style={{ color: tc.color }} />
                            <span className="text-xs" style={{ color: tc.color }}>
                              {delta > 0 ? `+${delta}` : delta < 0 ? delta : "—"}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-xs" style={{ color: "#AEB6D4" }}>
                          {kw.search_volume >= 1000 ? `${(kw.search_volume / 1000).toFixed(1)}K` : kw.search_volume}/mo
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-xs" style={{ color: diff.color }}>{diff.label} {kw.difficulty}</span>
                        </td>
                        <td className="px-4 py-3">
                          {kw.ai_overview_visible ? (
                            <span className="flex items-center gap-1 text-xs" style={{ color: "#D8B779" }}>
                              <Sparkles className="h-3 w-3" /> Yes
                            </span>
                          ) : (
                            <span className="text-xs" style={{ color: "rgba(174,182,212,0.3)" }}>No</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {aiVisible > 0 && (
              <div className="mt-4 rounded-md p-4" style={{ background: "rgba(216,183,121,0.04)", border: "1px solid rgba(216,183,121,0.2)" }}>
                <div className="flex items-start gap-2">
                  <Sparkles className="h-4 w-4 mt-0.5 shrink-0" style={{ color: "#D8B779" }} />
                  <p className="text-sm" style={{ color: "#AEB6D4", fontWeight: 300 }}>
                    {aiVisible} keyword{aiVisible > 1 ? "s" : ""} trigger an AI Overview in Google. This is an AEO opportunity. Switch to the AEO tab to track your inclusion status.
                  </p>
                </div>
              </div>
            )}
          </>
        )}

        {tab === "aeo" && (
          <>
            <div className="mb-6 rounded-md p-4" style={{ background: "rgba(124,130,212,0.06)", border: "1px solid rgba(124,130,212,0.2)" }}>
              <p className="text-sm" style={{ color: "#AEB6D4", fontWeight: 300 }}>
                AI Engine Optimization (AEO) tracks whether your brand appears inside Google's AI Overviews, ChatGPT, Perplexity, and similar. Track the queries that matter — not just rankings.
              </p>
            </div>

            {/* AEO Summary */}
            <div className="mb-6 grid grid-cols-2 gap-3">
              {[
                { label: "Topics monitored",  value: PLACEHOLDER_AEO.length.toString() },
                { label: "Brand mentioned",   value: PLACEHOLDER_AEO.filter((a) => a.brand_mentioned).length.toString() },
              ].map((t) => (
                <div key={t.label} className="rounded-md p-4" style={{ background: "#0E1530", border: "1px solid rgba(174,182,212,0.1)" }}>
                  <p className="text-xs mb-1" style={{ color: "#AEB6D4" }}>{t.label}</p>
                  <p style={{ fontFamily: "Fraunces, Georgia, serif", fontWeight: 300, fontSize: 26, color: "#EDEFF7" }}>{t.value}</p>
                </div>
              ))}
            </div>

            {/* AEO Topics */}
            <div className="flex flex-col gap-3">
              {PLACEHOLDER_AEO.map((topic) => (
                <div key={topic.id} className="rounded-md p-4" style={{ background: "#0E1530", border: "1px solid rgba(174,182,212,0.1)" }}>
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span
                          className="rounded-full px-2 py-0.5 text-xs"
                          style={{
                            background: topic.brand_mentioned ? "rgba(110,196,160,0.1)" : "rgba(174,182,212,0.07)",
                            color:      topic.brand_mentioned ? "#6EC4A0"               : "#AEB6D4",
                            border:     `1px solid ${topic.brand_mentioned ? "rgba(110,196,160,0.25)" : "rgba(174,182,212,0.15)"}`,
                          }}
                        >
                          {topic.brand_mentioned ? "Brand included" : "Not mentioned"}
                        </span>
                        {topic.position_in_overview && (
                          <span className="text-xs" style={{ color: "#D8B779" }}>
                            Position {topic.position_in_overview} in AI Overview
                          </span>
                        )}
                      </div>
                      <p className="font-medium" style={{ color: "#EDEFF7", fontSize: 14 }}>{topic.topic}</p>
                      <p className="mt-1 text-xs italic" style={{ color: "#AEB6D4" }}>Query: "{topic.query}"</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-xs" style={{ color: "rgba(174,182,212,0.5)" }}>Checked</p>
                      <p className="text-xs" style={{ color: "#AEB6D4" }}>{topic.last_checked}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Babuu insight */}
            <div className="mt-6 rounded-md p-4" style={{ background: "rgba(231,201,138,0.04)", border: "1px solid rgba(216,183,121,0.2)" }}>
              <div className="flex items-start gap-2">
                <GuidingPairMark size={16} />
                <p className="text-sm" style={{ color: "#AEB6D4", fontWeight: 300 }}>
                  Two out of four AEO topics mention this brand. The two gaps are high-volume queries where competitors are likely included. Recommend publishing a 1,200-word FAQ page directly answering "what are content pillars" with structured markup. This is the most direct path to AI Overview inclusion for that query.
                </p>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function GuidingPairMark({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" aria-hidden="true" style={{ flexShrink: 0, marginTop: 2 }}>
      <g fill="none" stroke="#E7C98A" strokeWidth="1.4" strokeLinejoin="round">
        <path d="M38 30 L41.5 44 L55 47.5 L41.5 51 L38 65 L34.5 51 L21 47.5 L34.5 44 Z" />
      </g>
      <g fill="#E7C98A" opacity="0.95">
        <path d="M66 44 L68.4 53 L77 55.4 L68.4 57.8 L66 67 L63.6 57.8 L55 55.4 L63.6 53 Z" />
      </g>
    </svg>
  );
}

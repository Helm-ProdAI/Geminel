"use client";

import { useState } from "react";
import { StageCard } from "@/components/dashboard/StageCard";

const STAGE_DATA = [
  { stage: 1 as const, primaryMetricLabel: "Total reach",      primaryMetricValue: 142000, primaryMetricUnit: "",  trendWow:  12.4, status: "on_track" as const },
  { stage: 2 as const, primaryMetricLabel: "Engagement rate",  primaryMetricValue: 4.2,    primaryMetricUnit: "%", trendWow:  -0.4, status: "leak"     as const },
  { stage: 3 as const, primaryMetricLabel: "Conversion rate",  primaryMetricValue: 2.1,    primaryMetricUnit: "%", trendWow:   0.0, status: "on_track" as const },
  { stage: 4 as const, primaryMetricLabel: "Retention rate",   primaryMetricValue: 68,     primaryMetricUnit: "%", trendWow:   3.1, status: "on_track" as const },
  { stage: 5 as const, primaryMetricLabel: "Referrals",        primaryMetricValue: 34,     primaryMetricUnit: "",  trendWow:   8.2, status: "on_track" as const },
];

const STAGE_DETAIL: Record<number, {
  question: string;
  brandJob: string;
  channels: string[];
  metrics: { label: string; value: string; trend?: number }[];
  actions: string[];
}> = {
  1: {
    question: "Does this exist? Is it for me?",
    brandJob: "Get seen by the right person, more than once.",
    channels: ["Instagram", "TikTok", "LinkedIn", "SEO", "Paid Ads"],
    metrics: [
      { label: "Organic reach", value: "142,000", trend: 12.4 },
      { label: "Impressions",   value: "389,000", trend: 8.1 },
      { label: "New visitors",  value: "3,240",   trend: 5.2 },
      { label: "New followers", value: "428",      trend: -2.1 },
    ],
    actions: ["Maintain 4x/week posting cadence", "Test Reel hook variation this week", "Expand to TikTok if Instagram reach plateaus"],
  },
  2: {
    question: "Can I trust them? Is this the one?",
    brandJob: "Earn evaluation. Profile, site, proof, positioning.",
    channels: ["Instagram profile", "Website", "Email opt-in", "LinkedIn"],
    metrics: [
      { label: "Engagement rate", value: "4.2%",  trend: -0.4 },
      { label: "Profile visits",  value: "9,140", trend: -1.8 },
      { label: "Follow rate",     value: "4.7%",  trend: -0.9 },
      { label: "Email opt-ins",   value: "88",    trend: 12.0 },
    ],
    actions: [
      "Audit bio — does it clearly say what you do, who you help, and what to do next?",
      "Update Pin 2 with current offer or proof",
      "Run link-in-bio test: single CTA vs. multiple links",
    ],
  },
  3: {
    question: "Should I act now?",
    brandJob: "Make the yes easy. Remove friction.",
    channels: ["DMs", "Website", "Email sequences", "Discovery calls"],
    metrics: [
      { label: "Conversion rate",   value: "2.1%",  trend: 0.0 },
      { label: "Discovery calls",   value: "12",    trend: 4.2 },
      { label: "Call-to-close %",   value: "58%",   trend: 3.1 },
      { label: "Avg deal value",    value: "$1,400", trend: 8.0 },
    ],
    actions: [
      "Map the conversion path end-to-end and click every link",
      "Add one case study to the inquiry landing page",
      "Follow up within 24h of every discovery call",
    ],
  },
  4: {
    question: "Was it worth it? Do I stay?",
    brandJob: "Deliver, deepen, retain.",
    channels: ["Email", "Direct", "Community", "Onboarding"],
    metrics: [
      { label: "Retention rate",  value: "68%",  trend: 3.1 },
      { label: "Repeat rate",     value: "34%",  trend: 1.8 },
      { label: "Email open rate", value: "42.1%", trend: 2.4 },
      { label: "NPS score",       value: "61",   trend: 5.0 },
    ],
    actions: [
      "Run 30-day post-onboarding check-in call with every new client",
      "Set up win-back email at 60 days inactive",
      "Add one referral prompt to the onboarding email sequence",
    ],
  },
  5: {
    question: "Do I tell others?",
    brandJob: "Turn customers into marketers.",
    channels: ["UGC", "Reviews", "Referrals", "Affiliate program"],
    metrics: [
      { label: "Referrals",         value: "34",    trend: 8.2 },
      { label: "UGC pieces",        value: "12",    trend: 20.0 },
      { label: "New reviews",       value: "8",     trend: 14.0 },
      { label: "Referral conv. rate", value: "44%", trend: 3.0 },
    ],
    actions: [
      "Identify top 5 clients and activate personally via DM",
      "Send asset kit (graphics, caption template, hashtag set) to advocates",
      "Repost all UGC within 24h with permission",
    ],
  },
};

const STAGE_NAMES = ["", "Awareness", "Consideration", "Conversion", "Loyalty", "Advocacy"];

export function GrowthSection({ brandId }: { brandId: string }) {
  const [activeStage, setActiveStage] = useState<number>(2);
  const detail = STAGE_DETAIL[activeStage];

  return (
    <div className="h-full overflow-y-auto px-8 py-8">
      <div className="mx-auto max-w-4xl">

        {/* Header */}
        <div className="mb-8">
          <div className="eyebrow mb-2">Growth Engine</div>
          <h1 style={{ fontFamily: "Fraunces, Georgia, serif", fontWeight: 300, fontSize: 28, color: "#EDEFF7" }}>
            Five stages. One sequence.
          </h1>
          <p className="mt-1 text-sm" style={{ color: "#AEB6D4", fontWeight: 300 }}>
            You cannot skip a stage. A brand that nails Awareness but skips Consideration leaks conversions every time.
          </p>
        </div>

        {/* Stage cards */}
        <div className="mb-8 grid grid-cols-5 gap-3">
          {STAGE_DATA.map((s) => (
            <StageCard key={s.stage} {...s} onClick={() => setActiveStage(s.stage)} />
          ))}
        </div>

        {/* Stage detail */}
        <div
          className="rounded-md p-6"
          style={{ background: "#0E1530", border: "1px solid rgba(216,183,121,0.28)" }}
        >
          {/* Detail header */}
          <div className="mb-6 flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs" style={{ color: "#D8B779", letterSpacing: "0.28em", textTransform: "uppercase" }}>
                  Stage {activeStage}
                </span>
                <span className="text-xs" style={{ color: "rgba(174,182,212,0.4)" }}>of 5</span>
              </div>
              <h2 style={{ fontFamily: "Fraunces, Georgia, serif", fontWeight: 300, fontSize: 22, color: "#EDEFF7" }}>
                {STAGE_NAMES[activeStage]}
              </h2>
              <p className="mt-1 text-sm" style={{ color: "#AEB6D4", fontStyle: "italic" }}>"{detail.question}"</p>
            </div>
            <div
              className="rounded px-3 py-1.5 text-xs shrink-0"
              style={{ background: "rgba(231,201,138,0.06)", border: "1px solid rgba(216,183,121,0.2)", color: "#AEB6D4" }}
            >
              Brand's job: {detail.brandJob}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-8">
            {/* Metrics */}
            <div>
              <p className="eyebrow mb-4" style={{ letterSpacing: "0.28em" }}>This stage</p>
              <div className="grid grid-cols-2 gap-3">
                {detail.metrics.map((m) => (
                  <div key={m.label} className="rounded-md p-3" style={{ background: "rgba(7,11,28,0.5)", border: "1px solid rgba(174,182,212,0.08)" }}>
                    <p className="text-xs mb-1" style={{ color: "#AEB6D4" }}>{m.label}</p>
                    <p style={{ fontFamily: "Fraunces, Georgia, serif", fontWeight: 300, fontSize: 18, color: "#EDEFF7" }}>
                      {m.value}
                    </p>
                    {m.trend !== undefined && (
                      <p className="text-xs mt-0.5" style={{ color: m.trend > 0 ? "#6EC4A0" : m.trend < 0 ? "#E07878" : "#AEB6D4" }}>
                        {m.trend > 0 ? "+" : ""}{m.trend.toFixed(1)}% WoW
                      </p>
                    )}
                  </div>
                ))}
              </div>

              {/* Channels */}
              <div className="mt-4">
                <p className="text-xs mb-2" style={{ color: "#AEB6D4" }}>Strongest channels here</p>
                <div className="flex flex-wrap gap-1.5">
                  {detail.channels.map((c) => (
                    <span key={c} className="rounded-full px-2 py-0.5 text-xs" style={{ background: "rgba(174,182,212,0.07)", color: "#AEB6D4", border: "1px solid rgba(174,182,212,0.12)" }}>
                      {c}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Actions */}
            <div>
              <p className="eyebrow mb-4" style={{ letterSpacing: "0.28em" }}>This week</p>
              <div className="flex flex-col gap-2">
                {detail.actions.map((action, i) => (
                  <div key={i} className="flex items-start gap-2.5 rounded-md p-3" style={{ background: "rgba(7,11,28,0.4)", border: "1px solid rgba(174,182,212,0.08)" }}>
                    <span
                      className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-xs mt-0.5"
                      style={{ background: "rgba(216,183,121,0.12)", color: "#D8B779", fontWeight: 500 }}
                    >
                      {i + 1}
                    </span>
                    <p className="text-sm" style={{ color: "#EDEFF7", fontWeight: 300, lineHeight: 1.5 }}>{action}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Stage nav */}
          <div className="mt-6 flex gap-1.5 pt-5" style={{ borderTop: "1px solid rgba(174,182,212,0.08)" }}>
            {[1, 2, 3, 4, 5].map((s) => (
              <button
                key={s}
                onClick={() => setActiveStage(s)}
                className="rounded px-3 py-1.5 text-xs transition-all"
                style={{
                  background: s === activeStage ? "rgba(231,201,138,0.12)" : "transparent",
                  color: s === activeStage ? "#E7C98A" : "#AEB6D4",
                  border: `1px solid ${s === activeStage ? "rgba(216,183,121,0.3)" : "transparent"}`,
                }}
              >
                {STAGE_NAMES[s]}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

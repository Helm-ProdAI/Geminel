"use client";

import { Megaphone, TrendingUp, TrendingDown, DollarSign, MousePointerClick, Eye, ShoppingCart } from "lucide-react";

interface AdCampaign {
  id: string;
  platform: string;
  campaign_name: string;
  objective: string;
  status: string;
  daily_budget: number;
  performance: {
    spend: number;
    impressions: number;
    clicks: number;
    conversions: number;
    ctr: number;
    cpc: number;
    roas?: number;
    cpm: number;
  } | null;
}

const PLATFORM_COLORS: Record<string, string> = {
  meta:     "#1877F2",
  google:   "#4285F4",
  tiktok:   "#FF0050",
  linkedin: "#0A66C2",
  pinterest:"#E60023",
  x:        "#000000",
  snapchat: "#FFFC00",
};

const PLATFORM_LABELS: Record<string, string> = {
  meta: "Meta (FB + IG)", google: "Google Ads", tiktok: "TikTok Ads",
  linkedin: "LinkedIn Ads", pinterest: "Pinterest Ads", x: "X Ads", snapchat: "Snapchat",
};

// Placeholder — replaced by live API data when integrations are connected
const PLACEHOLDER_CAMPAIGNS: AdCampaign[] = [
  {
    id: "1", platform: "meta", campaign_name: "Awareness — Reels", objective: "awareness", status: "active",
    daily_budget: 25,
    performance: { spend: 312.50, impressions: 89400, clicks: 1240, conversions: 18, ctr: 1.39, cpc: 0.25, cpm: 3.50, roas: undefined },
  },
  {
    id: "2", platform: "google", campaign_name: "Search — Brand", objective: "conversion", status: "active",
    daily_budget: 30,
    performance: { spend: 420.00, impressions: 12300, clicks: 890, conversions: 34, ctr: 7.24, cpc: 0.47, cpm: 34.15, roas: 3.8 },
  },
];

const CONNECTED_PLATFORMS = ["meta", "google"];

export function AdsSection({ brandId }: { brandId: string }) {
  const totalSpend = PLACEHOLDER_CAMPAIGNS.reduce((s, c) => s + (c.performance?.spend ?? 0), 0);
  const totalImpressions = PLACEHOLDER_CAMPAIGNS.reduce((s, c) => s + (c.performance?.impressions ?? 0), 0);
  const totalClicks = PLACEHOLDER_CAMPAIGNS.reduce((s, c) => s + (c.performance?.clicks ?? 0), 0);
  const totalConversions = PLACEHOLDER_CAMPAIGNS.reduce((s, c) => s + (c.performance?.conversions ?? 0), 0);
  const blendedCTR = totalImpressions > 0 ? (totalClicks / totalImpressions) * 100 : 0;
  const blendedCPC = totalClicks > 0 ? totalSpend / totalClicks : 0;

  const ALL_PLATFORMS = ["meta", "google", "tiktok", "linkedin", "pinterest", "x", "snapchat"];

  return (
    <div className="h-full overflow-y-auto px-8 py-8">
      <div className="mx-auto max-w-4xl">

        {/* Header */}
        <div className="mb-8">
          <div className="eyebrow mb-2">Paid Ads</div>
          <h1 style={{ fontFamily: "Fraunces, Georgia, serif", fontWeight: 300, fontSize: 28, color: "#EDEFF7" }}>
            All platforms, one view.
          </h1>
          <p className="mt-1 text-sm" style={{ color: "#AEB6D4", fontWeight: 300 }}>
            Babuu monitors pacing, flags underperformance, and drafts new ad copy on request.
          </p>
        </div>

        {/* Platform connection status */}
        <div className="mb-8">
          <div className="eyebrow mb-3" style={{ letterSpacing: "0.28em" }}>Connected platforms</div>
          <div className="flex flex-wrap gap-2">
            {ALL_PLATFORMS.map((p) => {
              const connected = CONNECTED_PLATFORMS.includes(p);
              return (
                <div
                  key={p}
                  className="flex items-center gap-2 rounded-full px-3 py-1.5 text-xs"
                  style={{
                    background: connected ? "rgba(231,201,138,0.08)" : "rgba(174,182,212,0.05)",
                    border: `1px solid ${connected ? "rgba(216,183,121,0.35)" : "rgba(174,182,212,0.15)"}`,
                    color: connected ? "#E7C98A" : "#AEB6D4",
                  }}
                >
                  <span className="h-1.5 w-1.5 rounded-full" style={{ background: connected ? "#6EC4A0" : "rgba(174,182,212,0.3)" }} />
                  {PLATFORM_LABELS[p]}
                </div>
              );
            })}
          </div>
        </div>

        {/* Blended KPIs */}
        <div className="mb-8 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {[
            { label: "Total spend",   value: `$${totalSpend.toFixed(0)}`,          icon: DollarSign },
            { label: "Impressions",   value: `${(totalImpressions/1000).toFixed(1)}K`, icon: Eye },
            { label: "Clicks",        value: totalClicks.toLocaleString(),          icon: MousePointerClick },
            { label: "Conversions",   value: totalConversions.toString(),           icon: ShoppingCart },
            { label: "Blended CTR",   value: `${blendedCTR.toFixed(2)}%`,          icon: TrendingUp },
            { label: "Blended CPC",   value: `$${blendedCPC.toFixed(2)}`,          icon: DollarSign },
          ].map((kpi) => {
            const Icon = kpi.icon;
            return (
              <div key={kpi.label} className="rounded-md p-3" style={{ background: "#0E1530", border: "1px solid rgba(174,182,212,0.1)" }}>
                <Icon className="h-3.5 w-3.5 mb-2" style={{ color: "#D8B779" }} />
                <p style={{ fontFamily: "Fraunces, Georgia, serif", fontWeight: 300, fontSize: 20, color: "#EDEFF7" }}>
                  {kpi.value}
                </p>
                <p className="mt-0.5 text-xs" style={{ color: "#AEB6D4" }}>{kpi.label}</p>
              </div>
            );
          })}
        </div>

        {/* Campaign table */}
        <div>
          <div className="eyebrow mb-4" style={{ letterSpacing: "0.28em" }}>Active campaigns</div>
          <div
            className="rounded-md overflow-hidden"
            style={{ border: "1px solid rgba(174,182,212,0.1)" }}
          >
            <table className="w-full text-sm">
              <thead>
                <tr style={{ borderBottom: "1px solid rgba(174,182,212,0.1)", background: "rgba(14,21,48,0.6)" }}>
                  {["Campaign", "Platform", "Objective", "Spend", "Impressions", "CTR", "CPC", "Conv.", "ROAS"].map((h) => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-medium" style={{ color: "#AEB6D4" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {PLACEHOLDER_CAMPAIGNS.map((c, i) => (
                  <tr
                    key={c.id}
                    style={{ borderBottom: i < PLACEHOLDER_CAMPAIGNS.length - 1 ? "1px solid rgba(174,182,212,0.06)" : "none", background: "#0E1530" }}
                  >
                    <td className="px-4 py-3">
                      <p style={{ color: "#EDEFF7", fontWeight: 400 }}>{c.campaign_name}</p>
                      <p className="text-xs" style={{ color: "#AEB6D4", textTransform: "capitalize" }}>{c.status}</p>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className="rounded-full px-2 py-0.5 text-xs font-medium"
                        style={{
                          background: `${PLATFORM_COLORS[c.platform]}15`,
                          color: PLATFORM_COLORS[c.platform] === "#000000" ? "#EDEFF7" : PLATFORM_COLORS[c.platform],
                          border: `1px solid ${PLATFORM_COLORS[c.platform]}40`,
                        }}
                      >
                        {PLATFORM_LABELS[c.platform]}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs capitalize" style={{ color: "#AEB6D4" }}>{c.objective}</td>
                    <td className="px-4 py-3" style={{ color: "#EDEFF7" }}>${c.performance?.spend.toFixed(0)}</td>
                    <td className="px-4 py-3" style={{ color: "#EDEFF7" }}>{((c.performance?.impressions ?? 0) / 1000).toFixed(1)}K</td>
                    <td className="px-4 py-3" style={{ color: (c.performance?.ctr ?? 0) > 2 ? "#6EC4A0" : "#EDEFF7" }}>
                      {c.performance?.ctr.toFixed(2)}%
                    </td>
                    <td className="px-4 py-3" style={{ color: "#EDEFF7" }}>${c.performance?.cpc.toFixed(2)}</td>
                    <td className="px-4 py-3" style={{ color: "#EDEFF7" }}>{c.performance?.conversions}</td>
                    <td className="px-4 py-3" style={{ color: c.performance?.roas ? "#6EC4A0" : "#AEB6D4" }}>
                      {c.performance?.roas ? `${c.performance.roas}x` : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Babuu insight */}
        <div className="mt-6 rounded-md p-4" style={{ background: "rgba(231,201,138,0.04)", border: "1px solid rgba(216,183,121,0.2)" }}>
          <div className="flex items-start gap-2">
            <GuidingPairMark size={16} />
            <div>
              <p className="eyebrow mb-1.5" style={{ letterSpacing: "0.24em" }}>Babuu</p>
              <p className="text-sm" style={{ color: "#AEB6D4", fontWeight: 300 }}>
                Google Search — Brand has a 7.24% CTR and $0.47 CPC at 3.8x ROAS. Meta Awareness has 89K impressions but no conversion objective. Recommend a Meta retargeting campaign for the Awareness audience — users who saw the Reels but did not click. Budget: $15/day. Expected ROAS: 2.5x-4x based on industry benchmark for warm audiences.
              </p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}

function GuidingPairMark({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" aria-hidden="true" style={{ flexShrink: 0, marginTop: 1 }}>
      <g fill="none" stroke="#E7C98A" strokeWidth="1.4" strokeLinejoin="round">
        <path d="M38 30 L41.5 44 L55 47.5 L41.5 51 L38 65 L34.5 51 L21 47.5 L34.5 44 Z" />
      </g>
      <g fill="#E7C98A" opacity="0.95">
        <path d="M66 44 L68.4 53 L77 55.4 L68.4 57.8 L66 67 L63.6 57.8 L55 55.4 L63.6 53 Z" />
      </g>
    </svg>
  );
}

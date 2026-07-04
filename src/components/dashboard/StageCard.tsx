"use client";

import { cn, formatNumber, formatPercent } from "@/lib/utils";
import { TrendingUp, TrendingDown, Minus, AlertTriangle } from "lucide-react";

interface StageCardProps {
  stage: 1 | 2 | 3 | 4 | 5;
  primaryMetricLabel: string;
  primaryMetricValue: number;
  primaryMetricUnit?: string;
  trendWow: number;
  status: "on_track" | "leak" | "warning" | "no_data";
  onClick?: () => void;
}

const STAGE_META = {
  1: { name: "Awareness",     question: "Does this exist?" },
  2: { name: "Consideration", question: "Can I trust them?" },
  3: { name: "Conversion",    question: "Should I act now?" },
  4: { name: "Loyalty",       question: "Was it worth it?" },
  5: { name: "Advocacy",      question: "Do I tell others?" },
};

const STATUS_CONFIG = {
  on_track: { label: "On track", dotColor: "#6EC4A0" },
  leak:     { label: "Leak",     dotColor: "#E07878" },
  warning:  { label: "Watch",    dotColor: "#D4B86E" },
  no_data:  { label: "No data",  dotColor: "#AEB6D4" },
};

export function StageCard({
  stage,
  primaryMetricLabel,
  primaryMetricValue,
  primaryMetricUnit = "",
  trendWow,
  status,
  onClick,
}: StageCardProps) {
  const meta = STAGE_META[stage];
  const statusCfg = STATUS_CONFIG[status];
  const isLeak = status === "leak";

  return (
    <button
      onClick={onClick}
      style={{
        background: isLeak
          ? "radial-gradient(120% 120% at 50% 0%, #2a0e0e 0%, #0E1530 70%)"
          : "radial-gradient(120% 120% at 50% 0%, #141d40 0%, #0E1530 70%)",
        borderColor: isLeak ? "rgba(224,120,120,0.25)" : "rgba(216,183,121,0.28)",
      }}
      className="relative flex flex-col gap-3 rounded-md border p-4 text-left transition-all hover:brightness-110 focus:outline-none"
    >
      {/* Stage name */}
      <div className="flex items-center justify-between">
        <span
          className="eyebrow"
          style={{ color: isLeak ? "#E07878" : "#D8B779", letterSpacing: "0.28em" }}
        >
          {meta.name}
        </span>
        {isLeak && <AlertTriangle className="h-3.5 w-3.5" style={{ color: "#E07878" }} />}
      </div>

      {/* Primary metric */}
      <div>
        <p className="text-2xl tabular-nums" style={{ color: "#EDEFF7", fontFamily: "Fraunces, Georgia, serif", fontWeight: 300 }}>
          {formatNumber(primaryMetricValue)}
          {primaryMetricUnit && (
            <span className="ml-0.5 text-base" style={{ color: "#AEB6D4" }}>{primaryMetricUnit}</span>
          )}
        </p>
        <p className="mt-0.5 text-xs" style={{ color: "#AEB6D4" }}>{primaryMetricLabel}</p>
      </div>

      {/* Trend */}
      <div className="flex items-center gap-1.5">
        {trendWow > 0 ? (
          <TrendingUp className="h-3 w-3" style={{ color: "#6EC4A0" }} />
        ) : trendWow < 0 ? (
          <TrendingDown className="h-3 w-3" style={{ color: "#E07878" }} />
        ) : (
          <Minus className="h-3 w-3" style={{ color: "#AEB6D4" }} />
        )}
        <span
          className="text-xs font-medium"
          style={{ color: trendWow > 0 ? "#6EC4A0" : trendWow < 0 ? "#E07878" : "#AEB6D4" }}
        >
          {formatPercent(trendWow)} WoW
        </span>
      </div>

      {/* Status */}
      <div className="flex items-center gap-1.5 pt-1 border-t" style={{ borderColor: "rgba(174,182,212,0.1)" }}>
        <span
          className="h-1.5 w-1.5 rounded-full"
          style={{ backgroundColor: statusCfg.dotColor }}
        />
        <span className="text-xs" style={{ color: statusCfg.dotColor }}>{statusCfg.label}</span>
      </div>
    </button>
  );
}

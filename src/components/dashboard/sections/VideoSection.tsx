"use client";

import { useState } from "react";
import { Video, Upload, Wand2, FileText, Play, Image as ImageIcon } from "lucide-react";

type AssetType = "raw_footage" | "short_clip" | "ad_creative" | "template" | "finished_post";
type AssetStatus = "raw" | "brief_generated" | "in_production" | "ready" | "published";

interface VideoAsset {
  id: string;
  title: string;
  asset_type: AssetType;
  platform?: string;
  format?: string;
  status: AssetStatus;
  duration_seconds?: number;
  babuu_brief?: {
    hook: string;
    cta: string;
    scenes: { scene_number: number; visual_description: string; duration_seconds: number }[];
  };
  tags: string[];
  cloudinary_url?: string;
}

const STATUS_CONFIG: Record<AssetStatus, { label: string; color: string }> = {
  raw:             { label: "Raw",            color: "#AEB6D4" },
  brief_generated: { label: "Brief ready",    color: "#D8B779" },
  in_production:   { label: "In production",  color: "#7C82D4" },
  ready:           { label: "Ready to post",  color: "#6EC4A0" },
  published:       { label: "Published",      color: "#AEB6D4" },
};

const TYPE_ICON: Record<AssetType, React.ElementType> = {
  raw_footage:  Video,
  short_clip:   Play,
  ad_creative:  ImageIcon,
  template:     FileText,
  finished_post: Play,
};

const PLACEHOLDER_ASSETS: VideoAsset[] = [
  {
    id: "1", title: "Brand intro — 60s talking head", asset_type: "finished_post",
    platform: "instagram", format: "9:16", status: "ready", duration_seconds: 58,
    tags: ["connect", "brand"],
    babuu_brief: {
      hook: "Most marketing shouts. This is different.",
      cta: "Follow for weekly brand strategy.",
      scenes: [
        { scene_number: 1, visual_description: "Founder on camera, natural light, plain background", duration_seconds: 5 },
        { scene_number: 2, visual_description: "Cut to B-roll of desk/work", duration_seconds: 8 },
        { scene_number: 3, visual_description: "Return to face, direct address", duration_seconds: 15 },
      ],
    },
  },
  {
    id: "2", title: "5 mistakes founders make — Reel", asset_type: "short_clip",
    platform: "tiktok", format: "9:16", status: "brief_generated", duration_seconds: 45,
    tags: ["teach"],
    babuu_brief: {
      hook: "5 marketing mistakes that cost me 6 months.",
      cta: "Save this — you will need it.",
      scenes: [
        { scene_number: 1, visual_description: "Quick cut to text overlay on dark background", duration_seconds: 3 },
        { scene_number: 2, visual_description: "Talking head, rapid-cut between each mistake", duration_seconds: 35 },
        { scene_number: 3, visual_description: "CTA screen with brand mark", duration_seconds: 7 },
      ],
    },
  },
  {
    id: "3", title: "Raw — Q&A session recording", asset_type: "raw_footage",
    status: "raw", duration_seconds: 3600,
    tags: ["raw", "q&a"],
  },
];

export function VideoSection({ brandId }: { brandId: string }) {
  const [assets] = useState<VideoAsset[]>(PLACEHOLDER_ASSETS);
  const [selectedAsset, setSelectedAsset] = useState<VideoAsset | null>(null);
  const [briefLoading, setBriefLoading] = useState(false);

  const ready   = assets.filter((a) => a.status === "ready" || a.status === "published");
  const wip     = assets.filter((a) => a.status === "brief_generated" || a.status === "in_production");
  const raw     = assets.filter((a) => a.status === "raw");

  async function generateBrief(asset: VideoAsset) {
    setBriefLoading(true);
    await new Promise((r) => setTimeout(r, 1200)); // placeholder
    setBriefLoading(false);
  }

  return (
    <div className="flex h-full overflow-hidden">

      {/* Asset list */}
      <div className="flex w-72 shrink-0 flex-col overflow-y-auto" style={{ borderRight: "1px solid rgba(174,182,212,0.1)" }}>
        <div className="p-5" style={{ borderBottom: "1px solid rgba(174,182,212,0.1)" }}>
          <div className="eyebrow mb-1">Video</div>
          <p style={{ fontFamily: "Fraunces, Georgia, serif", fontWeight: 300, fontSize: 16, color: "#EDEFF7" }}>Asset library</p>
        </div>

        {/* Upload button */}
        <div className="p-3">
          <button
            className="flex w-full items-center justify-center gap-2 rounded-md py-2 text-sm transition-all"
            style={{ border: "1px dashed rgba(216,183,121,0.28)", color: "#AEB6D4", background: "transparent" }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = "#E7C98A"; (e.currentTarget as HTMLElement).style.borderColor = "rgba(216,183,121,0.55)"; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = "#AEB6D4"; (e.currentTarget as HTMLElement).style.borderColor = "rgba(216,183,121,0.28)"; }}
          >
            <Upload className="h-4 w-4" />
            Upload footage
          </button>
        </div>

        {/* Asset groups */}
        <div className="flex-1 overflow-y-auto px-3 pb-4">
          {[
            { label: "Ready", items: ready },
            { label: "In progress", items: wip },
            { label: "Raw footage", items: raw },
          ].map((group) => group.items.length > 0 && (
            <div key={group.label} className="mb-4">
              <p className="mb-2 px-1 text-xs" style={{ color: "rgba(174,182,212,0.5)", letterSpacing: "0.2em", textTransform: "uppercase" }}>
                {group.label}
              </p>
              {group.items.map((asset) => {
                const Icon = TYPE_ICON[asset.asset_type];
                const status = STATUS_CONFIG[asset.status];
                const isSelected = selectedAsset?.id === asset.id;

                return (
                  <button
                    key={asset.id}
                    onClick={() => setSelectedAsset(isSelected ? null : asset)}
                    className="flex w-full items-start gap-2.5 rounded-md p-2.5 text-left text-sm mb-1 transition-all"
                    style={{
                      background: isSelected ? "rgba(231,201,138,0.08)" : "transparent",
                      border: `1px solid ${isSelected ? "rgba(216,183,121,0.28)" : "transparent"}`,
                    }}
                  >
                    <Icon className="h-4 w-4 mt-0.5 shrink-0" style={{ color: isSelected ? "#E7C98A" : "#AEB6D4" }} />
                    <div className="flex-1 min-w-0">
                      <p className="truncate text-xs" style={{ color: "#EDEFF7", fontWeight: 400 }}>{asset.title}</p>
                      <p className="mt-0.5 text-xs" style={{ color: status.color }}>{status.label}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {/* Detail panel */}
      <div className="flex-1 overflow-y-auto p-8">
        {selectedAsset ? (
          <AssetDetail asset={selectedAsset} onGenerateBrief={generateBrief} loading={briefLoading} />
        ) : (
          <div className="flex h-full items-center justify-center">
            <div className="text-center">
              <Video className="h-12 w-12 mx-auto mb-4" style={{ color: "rgba(216,183,121,0.2)" }} />
              <p style={{ fontFamily: "Fraunces, Georgia, serif", fontWeight: 300, color: "#EDEFF7" }}>Select an asset</p>
              <p className="mt-1 text-sm" style={{ color: "#AEB6D4" }}>
                Or upload raw footage to get started.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function AssetDetail({ asset, onGenerateBrief, loading }: { asset: VideoAsset; onGenerateBrief: (a: VideoAsset) => void; loading: boolean }) {
  const status = STATUS_CONFIG[asset.status];

  return (
    <div className="max-w-xl">
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: `${status.color}15`, color: status.color, border: `1px solid ${status.color}30` }}>
            {status.label}
          </span>
          {asset.platform && (
            <span className="text-xs capitalize" style={{ color: "#AEB6D4" }}>{asset.platform}</span>
          )}
          {asset.format && (
            <span className="text-xs" style={{ color: "#AEB6D4" }}>{asset.format}</span>
          )}
          {asset.duration_seconds && (
            <span className="text-xs" style={{ color: "#AEB6D4" }}>
              {Math.floor(asset.duration_seconds / 60)}:{String(asset.duration_seconds % 60).padStart(2, "0")}
            </span>
          )}
        </div>
        <h2 style={{ fontFamily: "Fraunces, Georgia, serif", fontWeight: 300, fontSize: 22, color: "#EDEFF7" }}>
          {asset.title}
        </h2>
        {asset.tags.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1.5">
            {asset.tags.map((tag) => (
              <span key={tag} className="rounded-full px-2 py-0.5 text-xs" style={{ background: "rgba(174,182,212,0.08)", color: "#AEB6D4", border: "1px solid rgba(174,182,212,0.15)" }}>
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Babuu brief */}
      {asset.babuu_brief ? (
        <div className="rounded-md p-5 mb-4" style={{ background: "#0E1530", border: "1px solid rgba(216,183,121,0.28)" }}>
          <div className="flex items-center gap-2 mb-4">
            <GuidingPairMark size={16} />
            <p className="eyebrow" style={{ letterSpacing: "0.24em" }}>Babuu brief</p>
          </div>

          <div className="mb-4">
            <p className="text-xs mb-1" style={{ color: "#D8B779" }}>Hook</p>
            <p className="text-sm" style={{ color: "#EDEFF7", fontStyle: "italic" }}>"{asset.babuu_brief.hook}"</p>
          </div>

          <div className="mb-4">
            <p className="text-xs mb-2" style={{ color: "#D8B779" }}>Scene breakdown</p>
            <div className="flex flex-col gap-2">
              {asset.babuu_brief.scenes.map((scene) => (
                <div key={scene.scene_number} className="flex gap-3">
                  <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-xs" style={{ background: "rgba(216,183,121,0.15)", color: "#D8B779" }}>
                    {scene.scene_number}
                  </div>
                  <div>
                    <p className="text-sm" style={{ color: "#EDEFF7", fontWeight: 300 }}>{scene.visual_description}</p>
                    <p className="text-xs mt-0.5" style={{ color: "#AEB6D4" }}>{scene.duration_seconds}s</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div>
            <p className="text-xs mb-1" style={{ color: "#D8B779" }}>CTA</p>
            <p className="text-sm" style={{ color: "#EDEFF7" }}>{asset.babuu_brief.cta}</p>
          </div>
        </div>
      ) : (
        <button
          onClick={() => onGenerateBrief(asset)}
          disabled={loading}
          className="flex items-center gap-2 rounded-md px-4 py-2.5 text-sm transition-all"
          style={{ background: "rgba(231,201,138,0.1)", border: "1px solid rgba(216,183,121,0.28)", color: loading ? "#AEB6D4" : "#E7C98A" }}
        >
          <Wand2 className="h-4 w-4" />
          {loading ? "Generating brief..." : "Generate Babuu brief"}
        </button>
      )}
    </div>
  );
}

function GuidingPairMark({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" aria-hidden="true" style={{ flexShrink: 0 }}>
      <g fill="none" stroke="#E7C98A" strokeWidth="1.4" strokeLinejoin="round">
        <path d="M38 30 L41.5 44 L55 47.5 L41.5 51 L38 65 L34.5 51 L21 47.5 L34.5 44 Z" />
      </g>
      <g fill="#E7C98A" opacity="0.95">
        <path d="M66 44 L68.4 53 L77 55.4 L68.4 57.8 L66 67 L63.6 57.8 L55 55.4 L63.6 53 Z" />
      </g>
    </svg>
  );
}

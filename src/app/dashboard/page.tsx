"use client";

import { useEffect, useState } from "react";
import { BrandSwitcher } from "@/components/dashboard/BrandSwitcher";
import { StageCard } from "@/components/dashboard/StageCard";
import { BabuuChat } from "@/components/babuu/BabuuChat";
import {
  LayoutDashboard, MessageSquare, TrendingUp,
  Megaphone, Video, FlaskConical, Settings, Search, CalendarDays, ListChecks,
  Eye, BookOpen, Mail, Newspaper,
} from "lucide-react";
import Link from "next/link";
import { GrowthSection }     from "@/components/dashboard/sections/GrowthSection";
import { AdsSection }        from "@/components/dashboard/sections/AdsSection";
import { VideoSection }      from "@/components/dashboard/sections/VideoSection";
import { ContentLabSection } from "@/components/dashboard/sections/ContentLabSection";
import { SEOSection }        from "@/components/dashboard/sections/SEOSection";
import { CalendarSection }   from "@/components/dashboard/sections/CalendarSection";
import { TasksSection }      from "@/components/dashboard/sections/TasksSection";
import { SpySection }        from "@/components/dashboard/sections/SpySection";
import { KnowledgeSection }  from "@/components/dashboard/sections/KnowledgeSection";
import { SequencesSection }  from "@/components/dashboard/sections/SequencesSection";
import { NewsSection }       from "@/components/dashboard/sections/NewsSection";

const MOCK_BRANDS = [
  {
    id: "brand-1",
    brand_name: "Geminel",
    brand_type: "corporate" as const,
    current_stage_focus: 2 as const,
    weakest_stage: 2 as const,
  },
];

const MOCK_STAGES = [
  { stage: 1 as const, primaryMetricLabel: "Total reach",      primaryMetricValue: 142000, primaryMetricUnit: "",  trendWow:  12.4, status: "on_track" as const },
  { stage: 2 as const, primaryMetricLabel: "Engagement rate",  primaryMetricValue: 4.2,    primaryMetricUnit: "%", trendWow:  -0.4, status: "leak"     as const },
  { stage: 3 as const, primaryMetricLabel: "Conversion rate",  primaryMetricValue: 2.1,    primaryMetricUnit: "%", trendWow:   0.0, status: "on_track" as const },
  { stage: 4 as const, primaryMetricLabel: "Retention rate",   primaryMetricValue: 68,     primaryMetricUnit: "%", trendWow:   3.1, status: "on_track" as const },
  { stage: 5 as const, primaryMetricLabel: "Referrals",        primaryMetricValue: 34,     primaryMetricUnit: "",  trendWow:   8.2, status: "on_track" as const },
];

const NAV = [
  { id: "overview",     label: "Overview",    icon: LayoutDashboard },
  { id: "babuu",        label: "Babuu",       icon: MessageSquare },
  { id: "growth",       label: "Growth",      icon: TrendingUp },
  { id: "calendar",     label: "Calendar",    icon: CalendarDays },
  { id: "tasks",        label: "Tasks",       icon: ListChecks },
  { id: "ads",          label: "Paid Ads",    icon: Megaphone },
  { id: "seo",          label: "SEO + AEO",   icon: Search },
  { id: "video",        label: "Video",       icon: Video },
  { id: "content-lab",  label: "Content Lab", icon: FlaskConical },
  { id: "sequences",    label: "Sequences",   icon: Mail },
  { id: "spy",          label: "Spy",         icon: Eye },
  { id: "knowledge",    label: "Knowledge",   icon: BookOpen },
  { id: "news",         label: "AI News",     icon: Newspaper },
];

type BrandListItem = {
  id: string;
  brand_name: string;
  brand_type: "personal" | "creator" | "corporate" | "ecommerce";
  current_stage_focus: 1 | 2 | 3 | 4 | 5;
  weakest_stage: 1 | 2 | 3 | 4 | 5;
};

export default function DashboardPage() {
  const [brands, setBrands] = useState<BrandListItem[]>(MOCK_BRANDS);
  const [isDemo, setIsDemo] = useState(true);
  const [currentBrandId, setCurrentBrandId] = useState(MOCK_BRANDS[0].id);
  const [activeTab, setActiveTab] = useState("overview");

  // Load real brands when Supabase is connected; keep demo data otherwise
  useEffect(() => {
    fetch("/api/brands")
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((data: BrandListItem[]) => {
        if (Array.isArray(data) && data.length > 0) {
          setBrands(data);
          setCurrentBrandId(data[0].id);
          setIsDemo(false);
        }
      })
      .catch(() => {
        // Supabase not connected yet — stay in demo mode
      });
  }, []);

  const currentBrand = brands.find((b) => b.id === currentBrandId) ?? brands[0];
  const leaks = MOCK_STAGES.filter((s) => s.status === "leak");

  return (
    <div className="flex h-screen flex-col" style={{ background: "#070B1C", color: "#EDEFF7" }}>

      {/* ── Top bar ── */}
      <header
        className="flex h-14 shrink-0 items-center justify-between px-6"
        style={{ borderBottom: "1px solid rgba(174,182,212,0.1)" }}
      >
        <div className="flex items-center gap-5">
          {/* Wordmark */}
          <div className="flex items-center gap-2.5">
            <GuidingPairMark size={28} />
            <span style={{ fontFamily: "Fraunces, Georgia, serif", fontWeight: 300, fontSize: 18, letterSpacing: "0.04em", color: "#EDEFF7" }}>
              Gemin<b style={{ fontWeight: 400 }}>el</b>
            </span>
          </div>

          {/* Divider */}
          <div style={{ width: 1, height: 18, background: "rgba(174,182,212,0.2)" }} />

          <BrandSwitcher
            brands={brands}
            currentBrandId={currentBrandId}
            onSwitch={setCurrentBrandId}
          />
        </div>

        <div className="flex items-center gap-3">
          {isDemo && (
            <div
              className="flex items-center gap-2 rounded-full px-3 py-1 text-xs"
              style={{
                background: "rgba(216,183,121,0.06)",
                border: "1px solid rgba(216,183,121,0.25)",
                color: "#D8B779",
              }}
            >
              <span className="h-1.5 w-1.5 rounded-full" style={{ background: "#D8B779" }} />
              Demo data — connect Supabase to go live
            </div>
          )}
          {leaks.length > 0 && (
            <div
              className="flex items-center gap-2 rounded-full px-3 py-1 text-xs"
              style={{
                background: "rgba(224,120,120,0.08)",
                border: "1px solid rgba(224,120,120,0.25)",
                color: "#E07878",
              }}
            >
              <span className="h-1.5 w-1.5 rounded-full" style={{ background: "#E07878" }} />
              {leaks.length} leak{leaks.length > 1 ? "s" : ""} detected
            </div>
          )}
          <Link
            href="/settings"
            className="flex h-8 w-8 items-center justify-center rounded-md transition-colors"
            style={{ color: "#AEB6D4" }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = "#EDEFF7"; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = "#AEB6D4"; }}
          >
            <Settings className="h-4 w-4" />
          </Link>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">

        {/* ── Sidebar ── */}
        <nav
          className="flex w-48 shrink-0 flex-col px-2 py-4"
          style={{ borderRight: "1px solid rgba(174,182,212,0.1)" }}
        >
          <div className="flex flex-col gap-0.5">
            {NAV.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;

              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className="flex items-center gap-2.5 rounded px-3 py-2 text-sm text-left transition-colors"
                  style={{
                    background: isActive ? "rgba(231,201,138,0.08)" : "transparent",
                    color: isActive ? "#E7C98A" : "#AEB6D4",
                    fontWeight: isActive ? 400 : 300,
                  }}
                  onMouseEnter={(e) => {
                    if (!isActive) {
                      (e.currentTarget as HTMLElement).style.background = "rgba(174,182,212,0.05)";
                      (e.currentTarget as HTMLElement).style.color = "#EDEFF7";
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isActive) {
                      (e.currentTarget as HTMLElement).style.background = "transparent";
                      (e.currentTarget as HTMLElement).style.color = "#AEB6D4";
                    }
                  }}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  {item.label}
                </button>
              );
            })}
          </div>

          {/* Bottom hint */}
          <div className="mt-auto px-3 pb-2">
            <p className="eyebrow" style={{ letterSpacing: "0.28em" }}>Where brands rise.</p>
          </div>
        </nav>

        {/* ── Main content ── */}
        <main className="flex-1 overflow-hidden">

          {/* Overview */}
          {activeTab === "overview" && (
            <div className="h-full overflow-y-auto px-8 py-8">
              <div className="mx-auto max-w-4xl">

                {/* Page header */}
                <div className="mb-8">
                  <div className="eyebrow mb-2">Brand overview</div>
                  <h1 style={{ fontFamily: "Fraunces, Georgia, serif", fontWeight: 300, fontSize: 28, color: "#EDEFF7" }}>
                    {currentBrand.brand_name}
                  </h1>
                  <p className="mt-1 text-sm capitalize" style={{ color: "#AEB6D4" }}>
                    {currentBrand.brand_type} brand
                  </p>
                </div>

                {/* Growth Engine */}
                <div className="mb-8">
                  <div className="eyebrow mb-4">Growth Engine</div>
                  <div className="grid grid-cols-5 gap-3">
                    {MOCK_STAGES.map((stage) => (
                      <StageCard key={stage.stage} {...stage} onClick={() => setActiveTab("growth")} />
                    ))}
                  </div>
                </div>

                {/* Babuu insight */}
                <div
                  className="mb-8 rounded-md p-5"
                  style={{
                    background: "radial-gradient(120% 120% at 0% 0%, rgba(231,201,138,0.06) 0%, rgba(14,21,48,0) 70%)",
                    border: "1px solid rgba(216,183,121,0.28)",
                  }}
                >
                  <div className="flex items-start gap-3">
                    <GuidingPairMark size={20} />
                    <div>
                      <p className="eyebrow mb-2" style={{ letterSpacing: "0.24em" }}>Babuu</p>
                      <p className="text-sm leading-relaxed" style={{ color: "#AEB6D4", fontWeight: 300 }}>
                        Consideration is the current leak. Engagement rate dropped 0.4% week-over-week while reach grew 12.4% in the same period. The most common cause is a profile bio or highlight setup that isn't converting visitors to followers. Recommend a profile audit before adjusting content.
                      </p>
                      <button
                        onClick={() => setActiveTab("babuu")}
                        className="mt-3 text-xs transition-colors"
                        style={{ color: "#E7C98A" }}
                        onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = "#D8B779"; }}
                        onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = "#E7C98A"; }}
                      >
                        Ask Babuu to diagnose this
                      </button>
                    </div>
                  </div>
                </div>

                {/* Metric tiles */}
                <div className="grid grid-cols-3 gap-4">
                  {[
                    { label: "Active Ad Campaigns", value: "—", sub: "Connect an ad platform to track" },
                    { label: "Content Lab Tests",   value: "—", sub: "No active tests" },
                    { label: "SEO Keywords Tracked",value: "—", sub: "Connect Semrush to track" },
                  ].map((card) => (
                    <div
                      key={card.label}
                      className="rounded-md p-4"
                      style={{ background: "#0E1530", border: "1px solid rgba(174,182,212,0.1)" }}
                    >
                      <p className="text-xs" style={{ color: "#AEB6D4" }}>{card.label}</p>
                      <p
                        className="mt-2 text-2xl"
                        style={{ fontFamily: "Fraunces, Georgia, serif", fontWeight: 300, color: "#EDEFF7" }}
                      >
                        {card.value}
                      </p>
                      <p className="mt-1 text-xs" style={{ color: "#AEB6D4", opacity: 0.6 }}>{card.sub}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Babuu */}
          {activeTab === "babuu" && (
            <BabuuChat brandId={currentBrandId} brandName={currentBrand.brand_name} />
          )}

          {activeTab === "growth"      && <GrowthSection     brandId={currentBrandId} />}
          {activeTab === "calendar"    && <CalendarSection   brandId={currentBrandId} />}
          {activeTab === "tasks"       && <TasksSection      brandId={currentBrandId} />}
          {activeTab === "ads"         && <AdsSection        brandId={currentBrandId} />}
          {activeTab === "seo"         && <SEOSection        brandId={currentBrandId} />}
          {activeTab === "video"       && <VideoSection      brandId={currentBrandId} />}
          {activeTab === "content-lab" && <ContentLabSection brandId={currentBrandId} />}
          {activeTab === "sequences"   && <SequencesSection  brandId={currentBrandId} />}
          {activeTab === "spy"         && <SpySection        brandId={currentBrandId} />}
          {activeTab === "knowledge"   && <KnowledgeSection  brandId={currentBrandId} />}
          {activeTab === "news"        && <NewsSection />}

        </main>
      </div>
    </div>
  );
}

// The Geminel brand mark — two guiding stars
function GuidingPairMark({ size = 24 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" aria-hidden="true" style={{ flexShrink: 0 }}>
      <g fill="none" stroke="#E7C98A" strokeWidth="1.4" strokeLinejoin="round"
         filter="drop-shadow(0 0 6px rgba(231,201,138,0.5))">
        <path d="M38 30 L41.5 44 L55 47.5 L41.5 51 L38 65 L34.5 51 L21 47.5 L34.5 44 Z" />
      </g>
      <g fill="#E7C98A" opacity="0.95">
        <path d="M66 44 L68.4 53 L77 55.4 L68.4 57.8 L66 67 L63.6 57.8 L55 55.4 L63.6 53 Z" />
      </g>
    </svg>
  );
}

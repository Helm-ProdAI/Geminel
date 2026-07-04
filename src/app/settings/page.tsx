"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft, CheckCircle2, Circle, ExternalLink, Key, RefreshCw,
  BarChart3, Search, Share2, Video as VideoIcon, Mail, Database,
  Palette, AlertTriangle,
} from "lucide-react";

type IntegrationStatus = "connected" | "disconnected" | "error" | "pending";

interface Integration {
  id: string;
  name: string;
  description: string;
  category: string;
  status: IntegrationStatus;
  icon: React.ElementType;
  docs_url: string;
  env_key: string;
  last_synced?: string;
  error_message?: string;
}

const INTEGRATIONS: Integration[] = [
  // Analytics
  { id: "ga4",         name: "Google Analytics 4",    description: "Website traffic, conversions, user behavior.", category: "Analytics",      status: "disconnected", icon: BarChart3, docs_url: "#", env_key: "GOOGLE_CLIENT_ID" },
  { id: "gsc",         name: "Google Search Console",  description: "Keyword impressions, clicks, and indexing.",  category: "Analytics",      status: "disconnected", icon: Search,    docs_url: "#", env_key: "GOOGLE_CLIENT_ID" },

  // Social
  { id: "meta",        name: "Meta (Instagram + FB)",  description: "Follower growth, reach, engagement, insights.", category: "Social",       status: "disconnected", icon: Share2,    docs_url: "#", env_key: "META_APP_ID" },
  { id: "tiktok",      name: "TikTok for Business",    description: "Views, followers, engagement, trending.",      category: "Social",       status: "disconnected", icon: Share2,    docs_url: "#", env_key: "TIKTOK_CLIENT_KEY" },
  { id: "linkedin",    name: "LinkedIn Pages",          description: "Impressions, follower analytics, shares.",    category: "Social",       status: "disconnected", icon: Share2,    docs_url: "#", env_key: "LINKEDIN_CLIENT_ID" },

  // Ads
  { id: "meta_ads",    name: "Meta Ads",                description: "Campaign spend, ROAS, CTR, CPC.",            category: "Paid Ads",     status: "disconnected", icon: BarChart3, docs_url: "#", env_key: "META_APP_ID" },
  { id: "google_ads",  name: "Google Ads",              description: "Search campaigns, ROAS, quality scores.",    category: "Paid Ads",     status: "disconnected", icon: BarChart3, docs_url: "#", env_key: "GOOGLE_ADS_DEVELOPER_TOKEN" },
  { id: "tiktok_ads",  name: "TikTok Ads",              description: "Paid video reach, CPM, conversions.",       category: "Paid Ads",     status: "disconnected", icon: BarChart3, docs_url: "#", env_key: "TIKTOK_CLIENT_KEY" },

  // SEO
  { id: "semrush",     name: "Semrush",                 description: "Keyword rankings, backlinks, site audit.",   category: "SEO / AEO",   status: "disconnected", icon: Search,    docs_url: "#", env_key: "SEMRUSH_API_KEY" },
  { id: "profound",    name: "Profound",                 description: "AI Overview (AEO) inclusion tracking.",     category: "SEO / AEO",   status: "disconnected", icon: Search,    docs_url: "#", env_key: "PROFOUND_API_KEY" },

  // Video
  { id: "cloudinary",  name: "Cloudinary",              description: "Media storage, transforms, asset delivery.", category: "Video",        status: "disconnected", icon: VideoIcon, docs_url: "#", env_key: "CLOUDINARY_CLOUD_NAME" },
  { id: "shotstack",   name: "Shotstack",               description: "AI-powered video rendering from briefs.",    category: "Video",        status: "disconnected", icon: VideoIcon, docs_url: "#", env_key: "SHOTSTACK_API_KEY" },

  // Email / CRM
  { id: "resend",      name: "Resend",                  description: "Transactional email and weekly reports.",    category: "Email / CRM",  status: "disconnected", icon: Mail,      docs_url: "#", env_key: "RESEND_API_KEY" },
];

const STATUS_CONFIG: Record<IntegrationStatus, { color: string; label: string; icon: React.ElementType }> = {
  connected:    { color: "#6EC4A0", label: "Connected",    icon: CheckCircle2 },
  disconnected: { color: "#AEB6D4", label: "Not connected", icon: Circle },
  error:        { color: "#E07878", label: "Error",         icon: AlertTriangle },
  pending:      { color: "#D8B779", label: "Connecting…",  icon: RefreshCw },
};

const CATEGORIES = ["Analytics", "Social", "Paid Ads", "SEO / AEO", "Video", "Email / CRM"];

// Maps integration ids to service keys reported by /api/health
const HEALTH_KEY: Record<string, string> = {
  ga4: "google", gsc: "google", google_ads: "google",
  meta: "meta", meta_ads: "meta",
  semrush: "semrush", profound: "profound",
  cloudinary: "cloudinary", shotstack: "shotstack",
  resend: "resend",
};

export default function SettingsPage() {
  const [activeCategory, setActiveCategory] = useState<string>("Analytics");
  const [activeTab,      setActiveTab]       = useState<"integrations" | "api-keys" | "brand">("integrations");
  const [health, setHealth] = useState<{ services: Record<string, boolean>; mode: string } | null>(null);

  useEffect(() => {
    fetch("/api/health")
      .then((r) => r.json())
      .then(setHealth)
      .catch(() => setHealth(null));
  }, []);

  const resolved: Integration[] = INTEGRATIONS.map((i) => {
    const key = HEALTH_KEY[i.id];
    if (health && key && health.services[key]) {
      return { ...i, status: "connected" as IntegrationStatus };
    }
    return i;
  });

  const visible = resolved.filter((i) => i.category === activeCategory);
  const connected = resolved.filter((i) => i.status === "connected").length;

  return (
    <div className="min-h-screen" style={{ background: "#070B1C", color: "#EDEFF7" }}>

      {/* Top bar */}
      <header
        className="flex h-14 items-center justify-between px-6"
        style={{ borderBottom: "1px solid rgba(174,182,212,0.1)" }}
      >
        <div className="flex items-center gap-4">
          <Link
            href="/dashboard"
            className="flex items-center gap-2 text-sm transition-colors"
            style={{ color: "#AEB6D4" }}
          >
            <ArrowLeft className="h-4 w-4" />
            Dashboard
          </Link>
          <div style={{ width: 1, height: 16, background: "rgba(174,182,212,0.2)" }} />
          <div className="flex items-center gap-2.5">
            <GuidingPairMark size={22} />
            <span style={{ fontFamily: "Fraunces, Georgia, serif", fontWeight: 300, fontSize: 16, color: "#EDEFF7" }}>
              Settings
            </span>
          </div>
        </div>

        <div
          className="flex items-center gap-2 text-xs"
          style={{ color: connected > 0 ? "#6EC4A0" : "#AEB6D4" }}
        >
          <CheckCircle2 className="h-3.5 w-3.5" />
          {connected} of {INTEGRATIONS.length} integrations connected
        </div>
      </header>

      <div className="mx-auto max-w-5xl px-6 py-8">

        {/* Page header */}
        <div className="mb-8">
          <div className="eyebrow mb-2">Settings</div>
          <h1 style={{ fontFamily: "Fraunces, Georgia, serif", fontWeight: 300, fontSize: 28, color: "#EDEFF7" }}>
            Connect your platforms.
          </h1>
          <p className="mt-1 text-sm" style={{ color: "#AEB6D4", fontWeight: 300 }}>
            Every integration you connect gives Babuu real data to work with. The more context, the sharper the strategy.
          </p>
        </div>

        {/* Tab nav */}
        <div className="mb-8 flex gap-0" style={{ borderBottom: "1px solid rgba(174,182,212,0.1)" }}>
          {(["integrations", "api-keys", "brand"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className="px-5 py-2.5 text-sm capitalize transition-colors"
              style={{
                color: activeTab === tab ? "#E7C98A" : "#AEB6D4",
                borderBottom: activeTab === tab ? "2px solid #E7C98A" : "2px solid transparent",
                marginBottom: -1,
                background: "transparent",
              }}
            >
              {tab.replace("-", " ")}
            </button>
          ))}
        </div>

        {activeTab === "integrations" && (
          <div className="flex gap-6">
            {/* Category sidebar */}
            <div className="flex w-40 shrink-0 flex-col gap-0.5">
              {CATEGORIES.map((cat) => {
                const catIntegrations = INTEGRATIONS.filter((i) => i.category === cat);
                const catConnected    = catIntegrations.filter((i) => i.status === "connected").length;
                const isActive        = activeCategory === cat;
                return (
                  <button
                    key={cat}
                    onClick={() => setActiveCategory(cat)}
                    className="flex items-center justify-between rounded px-3 py-2 text-left text-sm transition-all"
                    style={{
                      background: isActive ? "rgba(231,201,138,0.08)" : "transparent",
                      color: isActive ? "#E7C98A" : "#AEB6D4",
                      border: `1px solid ${isActive ? "rgba(216,183,121,0.25)" : "transparent"}`,
                    }}
                  >
                    <span>{cat}</span>
                    {catConnected > 0 && (
                      <span className="h-1.5 w-1.5 rounded-full" style={{ background: "#6EC4A0" }} />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Integration cards */}
            <div className="flex-1 flex flex-col gap-3">
              {visible.map((integration) => (
                <IntegrationCard key={integration.id} integration={integration} />
              ))}
            </div>
          </div>
        )}

        {activeTab === "api-keys" && <ApiKeysSection />}

        {activeTab === "brand" && <BrandSettings />}
      </div>
    </div>
  );
}

function IntegrationCard({ integration }: { integration: Integration }) {
  const [status, setStatus] = useState(integration.status);
  const [connecting, setConnecting] = useState(false);
  const st = STATUS_CONFIG[status];
  const StatusIcon = st.icon;
  const Icon = integration.icon;

  async function handleConnect() {
    setConnecting(true);
    setStatus("pending");
    await new Promise((r) => setTimeout(r, 1500));
    // In production: redirect to OAuth flow for the platform
    // For now: show the API key instructions
    setConnecting(false);
    setStatus("disconnected");
    alert(`To connect ${integration.name}, add ${integration.env_key} to your .env.local file. See SETUP.md for details.`);
  }

  return (
    <div
      className="rounded-md p-5"
      style={{
        background: "#0E1530",
        border: `1px solid ${status === "connected" ? "rgba(110,196,160,0.2)" : status === "error" ? "rgba(224,120,120,0.2)" : "rgba(174,182,212,0.1)"}`,
      }}
    >
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <div
            className="flex h-8 w-8 items-center justify-center rounded-md shrink-0"
            style={{ background: "rgba(174,182,212,0.07)", border: "1px solid rgba(174,182,212,0.12)" }}
          >
            <Icon className="h-4 w-4" style={{ color: "#AEB6D4" }} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <p className="text-sm font-medium" style={{ color: "#EDEFF7" }}>{integration.name}</p>
              <span
                className="flex items-center gap-1 rounded-full px-2 py-0.5 text-xs"
                style={{
                  background: `${st.color}12`,
                  color: st.color,
                  border: `1px solid ${st.color}30`,
                }}
              >
                <StatusIcon className="h-2.5 w-2.5" />
                {st.label}
              </span>
            </div>
            <p className="text-xs mt-0.5" style={{ color: "#AEB6D4", fontWeight: 300 }}>{integration.description}</p>
            {integration.last_synced && (
              <p className="text-xs mt-1" style={{ color: "rgba(174,182,212,0.4)" }}>
                Last synced {integration.last_synced}
              </p>
            )}
            {integration.error_message && (
              <p className="text-xs mt-1" style={{ color: "#E07878" }}>{integration.error_message}</p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <a
            href={integration.docs_url}
            className="flex items-center gap-1 text-xs transition-colors"
            style={{ color: "rgba(174,182,212,0.5)" }}
          >
            <ExternalLink className="h-3 w-3" />
            Docs
          </a>
          {status === "connected" ? (
            <button
              className="rounded-md px-3 py-1.5 text-xs transition-all"
              style={{ background: "rgba(224,120,120,0.08)", color: "#E07878", border: "1px solid rgba(224,120,120,0.2)" }}
              onClick={() => setStatus("disconnected")}
            >
              Disconnect
            </button>
          ) : (
            <button
              className="rounded-md px-3 py-1.5 text-xs transition-all"
              disabled={connecting}
              onClick={handleConnect}
              style={{
                background: "rgba(231,201,138,0.1)",
                color: connecting ? "#AEB6D4" : "#E7C98A",
                border: `1px solid ${connecting ? "rgba(174,182,212,0.2)" : "rgba(216,183,121,0.28)"}`,
              }}
            >
              {connecting ? "Connecting…" : "Connect"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function ApiKeysSection() {
  const envVars = [
    { key: "NEXT_PUBLIC_SUPABASE_URL",      label: "Supabase URL",              category: "Database",    required: true },
    { key: "NEXT_PUBLIC_SUPABASE_ANON_KEY", label: "Supabase Anon Key",         category: "Database",    required: true },
    { key: "SUPABASE_SERVICE_ROLE_KEY",     label: "Supabase Service Role Key",  category: "Database",    required: true },
    { key: "ANTHROPIC_API_KEY",             label: "Anthropic API Key",          category: "AI",          required: true },
    { key: "COHERE_API_KEY",                label: "Cohere API Key",             category: "AI",          required: true },
    { key: "RESEND_API_KEY",                label: "Resend API Key",             category: "Email",       required: false },
    { key: "SEMRUSH_API_KEY",               label: "Semrush API Key",            category: "SEO",         required: false },
    { key: "PROFOUND_API_KEY",              label: "Profound API Key",           category: "AEO",         required: false },
    { key: "CLOUDINARY_CLOUD_NAME",         label: "Cloudinary Cloud Name",      category: "Video",       required: false },
    { key: "SHOTSTACK_API_KEY",             label: "Shotstack API Key",          category: "Video",       required: false },
    { key: "META_APP_ID",                   label: "Meta App ID",                category: "Social/Ads",  required: false },
    { key: "GOOGLE_CLIENT_ID",              label: "Google Client ID",           category: "Analytics",   required: false },
    { key: "CRON_SECRET",                   label: "Cron Secret",                category: "System",      required: true },
  ];

  return (
    <div className="max-w-2xl">
      <div className="mb-6 rounded-md p-4" style={{ background: "rgba(231,201,138,0.04)", border: "1px solid rgba(216,183,121,0.2)" }}>
        <p className="text-sm" style={{ color: "#AEB6D4", fontWeight: 300 }}>
          Add these keys to your <code className="px-1 py-0.5 rounded text-xs" style={{ background: "rgba(174,182,212,0.1)", color: "#E7C98A" }}>.env.local</code> file
          in the project root. Never commit this file — it is already in <code className="px-1 py-0.5 rounded text-xs" style={{ background: "rgba(174,182,212,0.1)", color: "#E7C98A" }}>.gitignore</code>.
        </p>
      </div>

      <div className="flex flex-col gap-2">
        {envVars.map((v) => (
          <div
            key={v.key}
            className="flex items-center justify-between rounded-md px-4 py-3"
            style={{ background: "#0E1530", border: "1px solid rgba(174,182,212,0.08)" }}
          >
            <div className="flex items-center gap-3">
              <Key className="h-3.5 w-3.5 shrink-0" style={{ color: "rgba(174,182,212,0.4)" }} />
              <div>
                <p className="text-sm font-mono" style={{ color: "#E7C98A", fontSize: 12 }}>{v.key}</p>
                <p className="text-xs" style={{ color: "#AEB6D4" }}>{v.label}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <span className="text-xs" style={{ color: "rgba(174,182,212,0.4)" }}>{v.category}</span>
              {v.required && (
                <span className="rounded-full px-2 py-0.5 text-xs" style={{ background: "rgba(231,201,138,0.08)", color: "#D8B779", border: "1px solid rgba(216,183,121,0.2)" }}>
                  Required
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function BrandSettings() {
  return (
    <div className="max-w-xl">
      <div className="rounded-md p-6" style={{ background: "#0E1530", border: "1px solid rgba(174,182,212,0.1)" }}>
        <p style={{ fontFamily: "Fraunces, Georgia, serif", fontWeight: 300, fontSize: 18, color: "#EDEFF7", marginBottom: 4 }}>
          Brand management
        </p>
        <p className="text-sm mb-6" style={{ color: "#AEB6D4" }}>
          Add and manage brands. Each brand has its own data, integrations, and Babuu context.
        </p>
        <div className="flex gap-3">
          <Link
            href="/brands/new"
            className="rounded-md px-4 py-2.5 text-sm transition-all"
            style={{ background: "rgba(231,201,138,0.1)", border: "1px solid rgba(216,183,121,0.28)", color: "#E7C98A" }}
          >
            Add new brand
          </Link>
          <Link
            href="/dashboard"
            className="rounded-md px-4 py-2.5 text-sm transition-all"
            style={{ background: "rgba(174,182,212,0.07)", border: "1px solid rgba(174,182,212,0.15)", color: "#AEB6D4" }}
          >
            Back to dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}

function GuidingPairMark({ size = 22 }: { size?: number }) {
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

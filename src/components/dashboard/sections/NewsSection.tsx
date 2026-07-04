"use client";

import { useEffect, useState } from "react";
import { Newspaper, ExternalLink } from "lucide-react";

interface NewsItem {
  title: string;
  summary: string;
  why_it_matters: string;
  source_url: string;
  category: string;
}

interface Digest {
  id: string;
  digest_date: string;
  items: NewsItem[];
  babuu_take: string;
}

const CATEGORY_COLOR: Record<string, string> = {
  social: "#6EC4A0", ads: "#E07878", seo: "#7C82D4", ai_tools: "#D8B779", outreach: "#6FB8D4",
};

const DEMO_DIGEST: Digest = {
  id: "demo",
  digest_date: "2026-07-04",
  babuu_take: "This is a demo digest. Once the AI news cron runs on the deployed platform, a fresh digest appears here every morning at 7AM with the five items that actually matter for client work and one strategic take.",
  items: [
    {
      title: "Google expands AI Overviews to more commercial queries",
      summary: "AI Overviews now trigger on a larger share of buying-intent searches.",
      why_it_matters: "AEO inclusion becomes revenue-relevant, not just brand-relevant. Our FAQ page strategy moves up in priority.",
      source_url: "#",
      category: "seo",
    },
    {
      title: "Meta rolls out new Advantage+ creative options",
      summary: "Automatic creative variations now apply to Reels placements.",
      why_it_matters: "Worth testing against our manual variations in one client account before trusting it with budgets.",
      source_url: "#",
      category: "ads",
    },
  ],
};

export function NewsSection() {
  const [digests, setDigests] = useState<Digest[]>([DEMO_DIGEST]);
  const [isDemo, setIsDemo] = useState(true);

  useEffect(() => {
    fetch("/api/news")
      .then((r) => r.json())
      .then((data) => {
        if (data.mode === "live" && data.digests?.length) {
          setDigests(data.digests);
          setIsDemo(false);
        }
      })
      .catch(() => {});
  }, []);

  return (
    <div className="h-full overflow-y-auto px-8 py-8">
      <div className="mx-auto max-w-3xl">

        <div className="mb-8">
          <div className="eyebrow mb-2">AI News</div>
          <h1 style={{ fontFamily: "Fraunces, Georgia, serif", fontWeight: 300, fontSize: 28, color: "#EDEFF7" }}>
            What changed while you slept.
          </h1>
          <p className="mt-1 text-sm" style={{ color: "#AEB6D4", fontWeight: 300 }}>
            Every morning Babuu reads the feeds and keeps the five items that matter for marketing, social, and outreach.
          </p>
        </div>

        {digests.map((digest) => (
          <div key={digest.id} className="mb-8">
            <div className="mb-4 flex items-center gap-2">
              <Newspaper className="h-4 w-4" style={{ color: "#D8B779" }} />
              <span className="text-sm" style={{ color: "#EDEFF7" }}>
                {new Date(digest.digest_date + "T12:00:00").toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
              </span>
              {isDemo && <span className="text-xs" style={{ color: "rgba(216,183,121,0.5)" }}>demo</span>}
            </div>

            {digest.babuu_take && (
              <div className="mb-4 rounded-md p-4" style={{ background: "rgba(231,201,138,0.04)", border: "1px solid rgba(216,183,121,0.22)" }}>
                <p className="eyebrow mb-1.5" style={{ letterSpacing: "0.24em", fontSize: 9 }}>Babuu's take</p>
                <p className="text-sm leading-relaxed" style={{ color: "#AEB6D4", fontWeight: 300 }}>{digest.babuu_take}</p>
              </div>
            )}

            <div className="flex flex-col gap-3">
              {digest.items?.map((item, i) => (
                <div key={i} className="rounded-md p-4" style={{ background: "#0E1530", border: "1px solid rgba(174,182,212,0.1)" }}>
                  <div className="mb-1.5 flex items-center gap-2">
                    <span
                      className="rounded-full px-2 py-0.5 text-xs capitalize"
                      style={{
                        background: `${CATEGORY_COLOR[item.category] ?? "#AEB6D4"}12`,
                        color: CATEGORY_COLOR[item.category] ?? "#AEB6D4",
                        border: `1px solid ${CATEGORY_COLOR[item.category] ?? "#AEB6D4"}30`,
                      }}
                    >
                      {item.category?.replace("_", " ")}
                    </span>
                    {item.source_url && item.source_url !== "#" && (
                      <a href={item.source_url} target="_blank" rel="noreferrer" className="ml-auto" style={{ color: "#AEB6D4" }}>
                        <ExternalLink className="h-3.5 w-3.5" />
                      </a>
                    )}
                  </div>
                  <p className="text-sm font-medium mb-1" style={{ color: "#EDEFF7" }}>{item.title}</p>
                  <p className="text-xs mb-2" style={{ color: "#AEB6D4", fontWeight: 300 }}>{item.summary}</p>
                  <p className="text-xs" style={{ color: "#D8B779", fontWeight: 300 }}>Why it matters: {item.why_it_matters}</p>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// Runs daily at 7AM UTC (see vercel.json)
// Pulls AI + marketing news from free RSS feeds, has Babuu write a digest
// focused on what matters for marketing, social, and sales outreach.
// Stored in ai_news_digests, displayed in the dashboard.

import { NextRequest, NextResponse } from "next/server";
import { createServiceSupabaseClient } from "@/lib/supabase-server";
import Anthropic from "@anthropic-ai/sdk";

const FEEDS = [
  "https://www.marketingaiinstitute.com/blog/rss.xml",
  "https://searchengineland.com/feed",
  "https://www.socialmediatoday.com/feeds/news/",
  "https://techcrunch.com/category/artificial-intelligence/feed/",
];

function verifyCron(req: NextRequest): boolean {
  return req.headers.get("authorization") === `Bearer ${process.env.CRON_SECRET}`;
}

interface FeedItem {
  title: string;
  link: string;
  pubDate: string;
  source: string;
}

// Minimal RSS parsing without extra dependencies
function parseRSS(xml: string, source: string): FeedItem[] {
  const items: FeedItem[] = [];
  const itemBlocks = xml.match(/<item[\s\S]*?<\/item>/g) ?? [];

  for (const block of itemBlocks.slice(0, 10)) {
    const title = block.match(/<title>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/title>/)?.[1]?.trim();
    const link  = block.match(/<link>([\s\S]*?)<\/link>/)?.[1]?.trim();
    const date  = block.match(/<pubDate>([\s\S]*?)<\/pubDate>/)?.[1]?.trim();
    if (title && link) {
      items.push({ title, link, pubDate: date ?? "", source });
    }
  }
  return items;
}

export async function GET(req: NextRequest) {
  if (!verifyCron(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json({ error: "ANTHROPIC_API_KEY not set" }, { status: 503 });
  }

  // Fetch all feeds in parallel; tolerate individual failures
  const results = await Promise.allSettled(
    FEEDS.map(async (url) => {
      const res = await fetch(url, { signal: AbortSignal.timeout(10_000) });
      if (!res.ok) throw new Error(`${url}: ${res.status}`);
      const xml = await res.text();
      return parseRSS(xml, new URL(url).hostname);
    })
  );

  const allItems = results
    .filter((r): r is PromiseFulfilledResult<FeedItem[]> => r.status === "fulfilled")
    .flatMap((r) => r.value);

  if (allItems.length === 0) {
    return NextResponse.json({ error: "No feed items retrieved" }, { status: 502 });
  }

  // Filter to last 48h where dates parse
  const cutoff = Date.now() - 48 * 60 * 60 * 1000;
  const recent = allItems.filter((i) => {
    const t = Date.parse(i.pubDate);
    return isNaN(t) || t >= cutoff;
  }).slice(0, 40);

  // Babuu digests
  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  const response = await anthropic.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 2000,
    messages: [{
      role: "user",
      content: `You are Babuu, senior strategist for the Geminel marketing studio. Here are today's headlines from marketing and AI news feeds:

${recent.map((i, n) => `${n + 1}. [${i.source}] ${i.title} — ${i.link}`).join("\n")}

Select the 5 most relevant items for a marketing studio managing multiple client brands (social media, paid ads, SEO/AEO, sales outreach). Ignore fluff and funding announcements unless they change what tools we should use.

Return strict JSON, nothing else:
{
  "items": [
    {"title": "...", "summary": "one sentence, plain language", "why_it_matters": "one sentence: the specific implication for our client work", "source_url": "...", "category": "social|ads|seo|ai_tools|outreach"}
  ],
  "babuu_take": "2-3 sentences: the single strategic thread across today's news and what, if anything, we should change this week"
}`,
    }],
  });

  const raw = response.content[0].type === "text" ? response.content[0].text : "{}";
  let digest: { items: unknown[]; babuu_take: string };
  try {
    digest = JSON.parse(raw.replace(/```json?|```/g, "").trim());
  } catch {
    return NextResponse.json({ error: "Digest parse failed", raw: raw.slice(0, 300) }, { status: 500 });
  }

  const today = new Date().toISOString().slice(0, 10);
  const supabase = createServiceSupabaseClient();
  const { error } = await supabase.from("ai_news_digests").upsert(
    {
      digest_date: today,
      items:       digest.items,
      babuu_take:  digest.babuu_take,
    },
    { onConflict: "digest_date" }
  );

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    date: today,
    item_count: digest.items?.length ?? 0,
    sources_ok: results.filter((r) => r.status === "fulfilled").length,
  });
}

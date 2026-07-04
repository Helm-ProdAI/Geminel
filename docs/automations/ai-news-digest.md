# Automation: ai-news-digest

## What it does

Every morning, pulls headlines from marketing and AI news feeds, selects the five most relevant for a studio managing client brands, and writes a digest: plain-language summary, why each item matters for client work, and a single strategic take for the week.

## Schedule

Daily at 7AM UTC (`vercel.json`), route: `/api/cron/ai-news`

## Sources (free RSS, no API keys)

- Marketing AI Institute
- Search Engine Land
- Social Media Today
- TechCrunch AI

Add or swap feeds by editing the `FEEDS` array in `src/app/api/cron/ai-news/route.ts`.

## Pipeline

1. Fetch all feeds in parallel (10s timeout each; individual failures tolerated)
2. Filter to items from the last 48 hours, cap at 40
3. Babuu selects the 5 most relevant, ignoring fluff and funding news
4. Digest upserted into `ai_news_digests` keyed by date (idempotent — safe to re-run)
5. Read by the dashboard via `GET /api/news`

## Output shape

```json
{
  "items": [{ "title", "summary", "why_it_matters", "source_url", "category" }],
  "babuu_take": "the strategic thread across today's news"
}
```

## Failure modes

- All feeds down: 502, no digest written, yesterday's remains visible
- Digest JSON malformed: 500 with raw output snippet for debugging
- Missing ANTHROPIC_API_KEY: 503, clear error

## How to verify

`curl -H "Authorization: Bearer $CRON_SECRET" https://<deployment>/api/cron/ai-news`
should return `{ date, item_count: 5, sources_ok: >=1 }`.

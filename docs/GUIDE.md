# The Geminel Marketing Engine — Master Guide

This is the map of the whole machine. Read this first; the per-skill docs in `skills/`, `integrations/`, and `automations/` go deeper on each part.

## What this is

An all-in-one marketing engine for the Geminel studio. Every client brand lives here with its own voice, audience, goals, data, and history — strictly isolated from every other brand. Babuu, the AI strategist at the center, reads real data before answering, cites its sources, and never publishes anything without human approval.

## The one rule that governs everything

**Per-brand isolation.** Every table carries a `brand_id`. Every query filters by it. Every Babuu conversation loads exactly one brand's context. Voices, designs, strategies, and data never mix. When you switch brands in the header, you switch worlds.

## The stack

| Layer | Tech | Why |
|---|---|---|
| App | Next.js 16 on Vercel | Full-stack, one repo, crons built in |
| Database | Supabase (PostgreSQL + pgvector) | Relational data + semantic memory in one place |
| Agent | Claude API (claude-sonnet-4-6) | Babuu's brain; tool-calling loop against real data |
| Embeddings | Cohere embed-english-v3.0 | Brand memory recall |
| Email | Resend | Reports, alerts, sequences |
| Publishing | Postiz (self-hosted) or Ayrshare | One API for all social platforms |
| Graphics | Next ImageResponse (Satori) | On-brand images, zero external services |

The platform runs independently once deployed. Claude Code is only needed for maintenance and new features.

## The dashboard, tab by tab

1. **Overview** — the brand at a glance: 5-stage Growth Engine cards, current leak, Babuu's read
2. **Babuu** — full conversation with the strategist; confidence levels and sources on every answer
3. **Growth** — stage drilldown: metrics, channels, this week's actions per stage
4. **Calendar** — the content pipeline: drafts, scheduled, published; posts auto-publish when approved
5. **Tasks** — per-brand kanban; Babuu creates tasks from its recommendations and auto-closes them when linked work ships
6. **Paid Ads** — blended KPIs and per-campaign performance across platforms
7. **SEO + AEO** — keyword rankings and AI Overview inclusion tracking
8. **Video** — asset library with Babuu-generated production briefs
9. **Content Lab** — one-variable tests; completing a test requires recording the learning
10. **Sequences** — email/SMS sequences Babuu drafts in the brand's voice; human approves before anything sends
11. **Spy** — the competitor swipe file; every entry gets a Babuu breakdown
12. **Knowledge** — dump workshops, courses, notes; Babuu summarizes and commits them to master memory
13. **AI News** — the daily digest: five items that matter, one strategic take

Plus the **floating Babuu assistant** (gold star, bottom-right, every page) for quick queries and actions.

## How Babuu stays honest

Three source tiers, in order of trust: client data (from the database), the Geminel framework (the playbook), and research (always cited). Confidence gating: high/medium/low on every response, and low-confidence claims are labeled exploratory, never stated as fact. Babuu fetches data through tools; it does not answer from memory about metrics. And the hard rule: **nothing publishes without human approval.** Babuu drafts, proposes, and schedules; a person flips every switch.

## The automations (7 crons)

| Cron | Schedule | What it does |
|---|---|---|
| auto-scheduler | Every 15 min | Publishes approved posts whose time arrived; auto-closes linked tasks |
| daily-engagement | 6AM + 6PM | Alerts when a brand's engagement drops >20% week over week |
| seo-rank-check | 6AM daily | Pulls fresh keyword positions from Semrush |
| ai-news | 7AM daily | Reads the feeds, writes the digest |
| ads-pacing | 8AM, 2PM, 8PM | Flags over/under-pacing ad campaigns |
| weekly-report | Monday 9AM | Full weekly report per brand, emailed |
| monthly-refresh | 1st, 3AM | Re-embeds brand memory; quarterly review at quarter end |

All are idempotent and safe to re-run. All reject requests without the `CRON_SECRET` bearer token.

## Demo mode vs live mode

Without Supabase credentials the platform runs entirely on demo data — every screen works, marked with a "Demo data" pill. Add credentials and real data takes over automatically; no code changes. `/api/health` reports exactly which services are configured.

## Testing the machine

```bash
./scripts/smoke-test.sh                    # local
./scripts/smoke-test.sh https://your-deployment.vercel.app   # deployed
```

24 checks: every page, every API, graphics generation, and cron auth. All green means the machine is healthy.

## Going live (the 15-minute path)

1. Create a Supabase project → SQL Editor → run `supabase/schema.sql`, then `supabase/schema-v2.sql`, then `supabase/seed.sql`
2. Create `.env.local` with: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `ANTHROPIC_API_KEY`, `COHERE_API_KEY`, `CRON_SECRET`
3. Restart the dev server — the demo pill disappears, Babuu comes online
4. Deploy: push to GitHub → import to Vercel → add the same env vars → crons activate automatically
5. Optional keys as you connect platforms: `RESEND_API_KEY`, `SEMRUSH_API_KEY`, `AYRSHARE_API_KEY` or `POSTIZ_API_URL`+`POSTIZ_API_KEY`, `META_APP_ID`, Google credentials

## When something breaks

- Check `/api/health` first — it tells you what's configured and whether Supabase is reachable
- Every API returns real error messages, never silent failures
- Cron failures store their errors on the affected rows (`last_publish_error`, etc.)
- For code fixes: open the repo in Claude Code and describe the symptom. Every skill has a doc with its failure modes.

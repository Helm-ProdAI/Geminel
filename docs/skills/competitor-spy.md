# Skill: competitor_spy

## What it does

Maintains an always-current swipe file of competitor marketing: organic posts, paid ads, landing pages, emails, and funnels. Every saved swipe gets an automatic Babuu breakdown — why it likely works, the specific technique used, and what to adapt (never copy) for our brands.

## Where it lives

- API: `GET/POST /api/swipes`
- UI: Spy tab (`src/components/dashboard/sections/SpySection.tsx`)
- Data: `competitor_swipes` table
- Paid ads source: Meta Ad Library (`src/lib/integrations/ad-library.ts`)

## Two capture modes

**Manual (works today):** the "Save swipe" form. Ten seconds to capture anything you see: competitor, platform, hook, copy, CTA, link. Babuu analyzes on save.

**Meta Ad Library (needs Meta token):** `searchCompetitorAds()` queries the official, free Ad Library API for every active ad a competitor runs. `rankByLongevity()` sorts oldest-first — an ad still running after months is almost certainly profitable, which is the strongest signal in advertising. These flow into the same swipe file flagged `still_running`.

## The longevity principle

The UI flags long-running ads with a flame badge. Rationale: nobody keeps paying for an ad that loses money. Age of an active ad is a proxy for its profitability, and it's public information.

## Guardrails

- Brand-scoped: each brand keeps its own swipe file (its own competitor set).
- Babuu's analysis always frames adaptation, not copying.
- Organic scraping is not automated (platform ToS). Organic swipes are captured manually; the Meta Ad Library covers paid automatically since it's an official API.

## Failure modes

- No Anthropic key: swipe saves without analysis (empty, not fabricated)
- Ad Library errors return the Graph API status verbatim for debugging

## How to verify

Save a swipe via the form. The card should appear with a "Babuu breakdown" box within a few seconds (when the Anthropic key is configured).

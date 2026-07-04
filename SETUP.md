# Babuu Platform Setup

## What You Need Before Starting

1. Node.js 20+ installed (brew install node)
2. A Supabase account (supabase.com) - free tier is fine to start
3. An Anthropic API key (console.anthropic.com)
4. A Vercel account for deployment (vercel.com)
5. Optional but recommended: Cohere API key, Resend API key

## Step 1: Install Node.js

If you see "node not found":
```
brew install node
```
Or via nvm (preferred):
```
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.1/install.sh | bash
nvm install 20
nvm use 20
```

## Step 2: Install Dependencies

```
cd /Users/michaelangelomacalalad/Desktop/Geminel/babuu-platform
npm install
```

## Step 3: Set Up Supabase

1. Go to supabase.com and create a new project
2. Name it "babuu-platform"
3. Copy your project URL and anon key from Settings > API
4. Copy the service role key (keep this secret)
5. Open the SQL editor in Supabase dashboard
6. Paste the contents of supabase/schema.sql and run it

## Step 4: Configure Environment Variables

```
cp .env.example .env.local
```

Fill in at minimum:
- NEXT_PUBLIC_SUPABASE_URL
- NEXT_PUBLIC_SUPABASE_ANON_KEY
- SUPABASE_SERVICE_ROLE_KEY
- ANTHROPIC_API_KEY
- NEXTAUTH_SECRET (generate with: openssl rand -base64 32)

The rest can be added as you connect each integration.

## Step 5: Run Locally

```
npm run dev
```

Open http://localhost:3000

## Step 6: Connect Your First Brand

1. Go to /brands/new
2. Fill in the brand schema form (brand type, audience, goals, voice)
3. Connect at least one integration (GA4 or Instagram to start)
4. Open Babuu chat and ask: "What is the weakest stage for this brand?"

## Step 7: Deploy to Vercel

```
npx vercel
```

Or connect the GitHub repo to Vercel for automatic deploys.

Add all environment variables in Vercel's project settings.

Cron jobs activate automatically when deployed to Vercel (see vercel.json).

## Integration Checklist

### Free (connect first)
- [ ] Google Analytics 4 (via Google APIs OAuth)
- [ ] Google Search Console (same OAuth flow)

### Paid tools (add when ready for SEO clients)
- [ ] Semrush ($120/mo) - keyword rankings, AI Overview, competitor gaps
- [ ] Profound ($99/mo) - AI Overview citation tracking

### Social APIs (connect per client)
- [ ] Meta (Instagram + Facebook) - via Meta Developer console
- [ ] TikTok - via TikTok Developer console
- [ ] LinkedIn - via LinkedIn Developer console

### Ad platforms (connect per client)
- [ ] Meta Ads API
- [ ] Google Ads API
- [ ] TikTok Ads API
- [ ] LinkedIn Ads API

### Video (connect when ready for video production)
- [ ] Cloudinary (free tier covers MVP)
- [ ] Shotstack (pay per second of video rendered)

### Email
- [ ] Resend (for weekly reports) - free tier covers 3,000 emails/mo

## Babuu's First Conversation

Once a brand is set up with at least one integration, Babuu is ready.

Good opening questions:
- "What is our biggest leak this month?"
- "Draft 3 social posts for this week based on what's worked."
- "What should our Content Lab test be this week?"
- "How are our ads performing?"
- "What does our SEO look like?"

Babuu will call its tools, pull fresh data, and respond with sourced recommendations.

## The No-Hallucination Guarantee

Babuu enforces confidence gating in the system prompt and in tool results.
If it says something is "high confidence," it came from client data or the Geminel framework.
If it says "medium confidence," it's a recommendation to test.
If it says "low confidence" or "test this first," do not act on it without validating.

This is by design. Babuu is not trying to sound smart. It is trying to be right.

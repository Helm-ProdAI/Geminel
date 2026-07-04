# Integration: external cron (free-tier setup)

## Why this exists

Vercel's free Hobby plan allows only 2 cron jobs, each running at most once per day.
The machine needs 7 schedules, one of them every 15 minutes. Solution: keep the 2
that fit in Vercel, trigger the other 5 from cron-job.org (free, supports custom
headers and minute-level schedules).

## Split

**In Vercel (`vercel.json`):**

| Cron | Schedule |
|---|---|
| ai-news | Daily 7:00 UTC |
| weekly-report | Monday 9:00 UTC |

**In cron-job.org (create one job each):**

| Job | URL | Schedule |
|---|---|---|
| Auto-scheduler | `https://YOUR-DEPLOYMENT.vercel.app/api/cron/auto-scheduler` | Every 15 minutes |
| Daily engagement | `https://YOUR-DEPLOYMENT.vercel.app/api/cron/daily-engagement` | 6:00 and 18:00 UTC |
| SEO rank check | `https://YOUR-DEPLOYMENT.vercel.app/api/cron/seo-rank-check` | Daily 6:00 UTC |
| Ads pacing | `https://YOUR-DEPLOYMENT.vercel.app/api/cron/ads-pacing` | 8:00, 14:00, 20:00 UTC |
| Monthly refresh | `https://YOUR-DEPLOYMENT.vercel.app/api/cron/monthly-refresh` | 1st of month, 3:00 UTC |

## Setup (10 minutes, one time)

1. Create a free account at [cron-job.org](https://cron-job.org)
2. For each row above: **Create cronjob** → paste the URL → set the schedule
3. In the job's **Advanced** settings, add a request header:
   - Name: `Authorization`
   - Value: `Bearer YOUR_CRON_SECRET` (the same value as `CRON_SECRET` in Vercel env vars)
4. Save. Enable "Save responses" so you can inspect results.

Without the header, every endpoint returns 401 and does nothing — that's the security
working, not a bug.

## How to verify

Each job's execution history in cron-job.org should show HTTP 200 with a JSON body.
A 401 means the Authorization header is missing or the secret doesn't match Vercel.
A 503 means a required API key isn't configured yet — the body says which one.

## If you upgrade to Vercel Pro later

Restore the full cron list in `vercel.json` (see git history for the 7-cron version),
delete the cron-job.org jobs, redeploy. Nothing else changes — the endpoints are identical.

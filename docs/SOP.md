# Standard Operating Procedures — Geminel Marketing Engine

How the team uses the machine, day by day. Written for a team member on their first day.

---

## Daily (10 minutes, morning)

1. **Open the dashboard.** Check the header for leak alerts (red pill).
2. **Read AI News.** Five items, one take. If Babuu's take suggests a change, create a task for it (ask the assistant: "create a task for this").
3. **Check Tasks.** Anything overdue shows a red date. Anything in Review needs your eyes today.
4. **Check the Calendar.** Confirm today's scheduled posts look right. Approved posts publish themselves; drafts wait for you.

## Per brand, weekly (30 minutes)

1. **Read the weekly report** (emailed Monday 9AM, also in the dashboard).
2. **Check the Growth tab.** One question: which stage is leaking? Work the "This week" actions for that stage only. Do not spread effort across all five stages.
3. **Review Content Lab.** If a test ended, record the learning (the system will not let you complete a test without one). Start the next test — one variable at a time.
4. **Ask Babuu for the week's priorities:** "What are the three most important things for this brand this week?" It answers from data, creates tasks on request.

## Creating content

1. Draft in the Calendar tab, or ask Babuu to draft ("draft a Reel caption for the carousel launch").
2. Every post gets a pillar (teach/connect/spark) and a Growth Engine stage. If you can't name the stage it serves, it doesn't go out.
3. Move draft → approved → scheduled. **Only scheduled posts auto-publish.** The machine never skips your approval.
4. Need a graphic? `/api/graphics?type=quote&text=...` renders an on-brand image instantly. Formats: square, story, landscape.

## When you attend a workshop or course

Dump it in the Knowledge tab the same week — PDF, docx, or pasted notes. Tag the type. Babuu summarizes it, extracts the takeaways, and remembers it permanently. From then on it applies that material when relevant. If you skip this step, the knowledge dies in your notebook.

## When you see a good competitor post or ad

Ten seconds in the Spy tab: competitor, platform, hook, CTA, save. Babuu analyzes it automatically. Check the flame badge on paid ads — long-running means profitable, and those are the ones to study.

## Email/SMS sequences

1. Sequences tab → New sequence → set the goal precisely ("book calls from webinar attendees", not "engagement").
2. Babuu drafts every step in the brand's voice. Read each message. Edit anything that doesn't sound like the brand.
3. Sequences stay in draft until you approve them. SMS additionally requires Twilio A2P registration (see integrations doc).

## Using the assistant (the gold star)

It's on every page. Use it for:
- Queries: "what's due this week?", "how did the last Reel perform?"
- Actions: "create a task...", "mark the bio audit done"
- Help: "how do I add a new brand?"

The assistant is brand-scoped. It cannot mix up client data.

## Onboarding a new client brand

1. `/brands/new` — complete all 5 steps. The quality of Babuu's strategy is bounded by the quality of this intake. Be specific in voice descriptors and forbidden patterns.
2. Upload any existing brand documents in the Knowledge tab (strategy decks, past reports).
3. Add competitor names in the Spy tab and save 3-5 initial swipes.
4. Connect the brand's platforms in Settings as credentials become available.
5. Ask Babuu: "diagnose all five stages for this brand" — this becomes the first quarter's plan.

## Rules that are never broken

1. **No auto-publish without approval.** Ever. The pipeline enforces it; don't work around it.
2. **One variable per Content Lab test.** Two variables means zero learnings.
3. **Every completed test records its learning.** Enforced by the system.
4. **Brand voices never mix.** If Babuu's output sounds off-brand, flag it and check the brand's voice settings rather than editing around it.
5. **No em-dashes, no AI tells, no hype** in any client-facing copy. Babuu is prompted for this; humans hold the same bar.

## If something looks broken

1. `/api/health` — is everything configured and reachable?
2. Run `./scripts/smoke-test.sh` — 24 checks in ten seconds.
3. Check the specific doc in `docs/` for that feature's failure modes.
4. Still stuck: open the repo in Claude Code and describe the symptom.

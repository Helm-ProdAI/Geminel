# Babuu Platform Documentation

Every skill, integration, and automation in the Geminel Marketing Engine has its own doc here.
When the platform is finalized, `SOP.md` and `GUIDE.md` tie everything together.

## Structure

- `skills/` — one doc per Babuu skill (what it does, inputs, outputs, guardrails, failure modes)
- `integrations/` — one doc per external service (setup, credentials, quotas, fallbacks)
- `automations/` — one doc per cron job (schedule, trigger, what it produces, how to verify it ran)
- `SOP.md` — standard operating procedures for the team (written at finalization)
- `GUIDE.md` — the master guide: how the whole engine fits together (written at finalization)

## Rules for these docs

1. Every new skill ships with its doc. No doc, not done.
2. Docs state failure modes honestly: what happens when an API is down, a key is missing, or data is stale.
3. Docs are written for a team member who has never seen the code.

## Skill index

| Skill | Doc | Status |
|---|---|---|
| fetch_analytics | skills/fetch-analytics.md | Built |
| search_past_content | skills/search-past-content.md | Built |
| get_content_lab_status | skills/content-lab.md | Built |
| get_seo_snapshot | skills/seo-snapshot.md | Built |
| get_ads_performance | skills/ads-performance.md | Built |
| get_video_assets | skills/video-assets.md | Built |
| diagnose_stage | skills/diagnose-stage.md | Built |
| generate_content_draft | skills/content-draft.md | Built |
| manage_tasks | skills/manage-tasks.md | Built |
| competitor_spy | skills/competitor-spy.md | Planned |
| knowledge_ingest | skills/knowledge-ingest.md | Planned |
| sequence_builder | skills/sequence-builder.md | Planned |
| ai_news_digest | automations/ai-news-digest.md | Planned |
| auto_scheduler | automations/auto-scheduler.md | Planned |

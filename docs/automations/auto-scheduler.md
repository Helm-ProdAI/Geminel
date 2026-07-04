# Automation: auto-scheduler

## What it does

Publishes approved content automatically. Every 15 minutes it finds calendar posts with status `scheduled` whose time has arrived, pushes them to the connected publisher, marks them `published`, and auto-completes any linked task.

## Schedule

Every 15 minutes (`vercel.json`), route: `/api/cron/auto-scheduler`

## Publisher backends (checked in order)

1. **Postiz** (self-hosted, free) — set `POSTIZ_API_URL` + `POSTIZ_API_KEY`
2. **Ayrshare** (paid, zero-setup) — set `AYRSHARE_API_KEY`

With neither configured, posts stay `scheduled` with `last_publish_error` explaining exactly what to set. Nothing is silently dropped.

## The approval gate

Only posts with status `scheduled` are eligible — and a post reaches `scheduled` only after human approval (draft → approved → scheduled). Babuu can draft and propose, but a person always flips the switch. This is a hard rule from the anti-hallucination architecture: never auto-publish unapproved content.

## Retry policy

Up to 3 publish attempts per post. Attempts and the last error are stored on the row (`publish_attempts`, `last_publish_error`). After 3 failures, the post stays scheduled but stops being retried — check the calendar UI for the error.

## Task auto-completion

If a task has `linked_entity_type: content_calendar` and `linked_entity_id` matching the published post, it is set to done with `auto_completed: true`. This is how the task board stays current without anyone touching it.

## Failure modes

- No publisher configured: clear error stored per post, retried when configured
- Publisher API error: exact message stored, retried up to the cap
- Platform not supported by the publisher: recorded as an error, not attempted blindly

## How to verify

Create a calendar post, set status to `scheduled` with `scheduled_for` in the past, then:
`curl -H "Authorization: Bearer $CRON_SECRET" https://<deployment>/api/cron/auto-scheduler`
Response reports `published`, `failed`, and per-post failure reasons.

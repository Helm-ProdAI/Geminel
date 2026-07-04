# Skill: manage_tasks

## What it does

Lets Babuu operate the per-brand task board: create tasks, update them, mark them done, and list what's due. This is the skill behind "create a task for the bio audit" or "what's due this week?" in both the main chat and the floating assistant.

It also powers Babuu's proactive behavior: when Babuu makes a strategic recommendation and the user agrees to act on it, Babuu creates a task so the recommendation doesn't evaporate after the conversation ends.

## Where it lives

- Tool definition: `src/agent/babuu.ts` (`manage_tasks` in `BABUU_TOOLS`)
- Handler: `src/app/api/babuu/chat/route.ts` (`manageTasks`)
- Data: `tasks` table (`supabase/schema-v2.sql`)
- UI: Tasks tab in the dashboard (`src/components/dashboard/sections/TasksSection.tsx`)
- REST API: `GET/POST /api/tasks`, `PATCH/DELETE /api/tasks/[id]`

## Actions

| Action | Required inputs | What happens |
|---|---|---|
| `create` | `title` | New task, `created_by: babuu`, defaults: status todo, priority medium |
| `update` | `task_id` | Updates title, owner, due_date, or priority |
| `complete` | `task_id` | Sets status done, stamps `completed_at`, flags `auto_completed` |
| `list` | none | Returns tasks ordered by due date; optional `status_filter` |

## Auto-completion (linked entities)

A task can carry `linked_entity_type` + `linked_entity_id` (e.g. a content_calendar post).
When the linked entity reaches its terminal state (post published, campaign launched),
the auto-scheduler cron closes the task automatically with `auto_completed: true`.
Auto-closed tasks show an "auto" marker in the board UI.

## Guardrails

- Brand-scoped: every query filters by `brand_id`. Babuu cannot see or touch another brand's tasks.
- Babuu-created tasks are visibly marked (bot icon in the UI, `created_by: babuu` in data).
- Babuu never deletes tasks. Deletion is human-only, via the UI or REST API.

## Failure modes

- Supabase not configured: the handler returns an error result; Babuu tells the user task management is offline instead of pretending it worked.
- Unknown `task_id`: returns the database error; Babuu reports it plainly.

## How to verify it works

Ask the assistant: "Create a task: test task, due tomorrow, owner Michael."
Then check the Tasks tab — the card should appear in To do with a bot icon.

"use client";

import { useEffect, useState } from "react";
import { Plus, User, Bot, Flag, CalendarClock, Trash2 } from "lucide-react";

type TaskStatus = "todo" | "in_progress" | "review" | "done" | "blocked";
type TaskPriority = "urgent" | "high" | "medium" | "low";

interface Task {
  id: string;
  title: string;
  description?: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  owner?: string | null;
  due_date?: string | null;
  category?: string | null;
  created_by: string;
  auto_completed?: boolean;
}

const COLUMNS: { id: TaskStatus; label: string; color: string }[] = [
  { id: "todo",        label: "To do",       color: "#AEB6D4" },
  { id: "in_progress", label: "In progress", color: "#7C82D4" },
  { id: "review",      label: "Review",      color: "#D8B779" },
  { id: "done",        label: "Done",        color: "#6EC4A0" },
  { id: "blocked",     label: "Blocked",     color: "#E07878" },
];

const PRIORITY_COLOR: Record<TaskPriority, string> = {
  urgent: "#E07878",
  high:   "#D8B779",
  medium: "#7C82D4",
  low:    "#AEB6D4",
};

const CATEGORIES = ["content", "ads", "seo", "design", "video", "email", "strategy", "admin"];

// Demo tasks shown until Supabase is connected
const DEMO_TASKS: Task[] = [
  { id: "d1", title: "Audit Instagram bio and pinned posts", description: "Consideration-stage leak: profile visits are not converting to follows.", status: "in_progress", priority: "high", owner: "Michael", due_date: "2026-07-07", category: "strategy", created_by: "babuu" },
  { id: "d2", title: "Draft July content calendar", status: "todo", priority: "medium", owner: "Michael", due_date: "2026-07-10", category: "content", created_by: "user" },
  { id: "d3", title: "Set up Meta retargeting campaign", description: "Warm audience from Awareness Reels. $15/day starting budget.", status: "review", priority: "high", owner: "Babuu", due_date: "2026-07-08", category: "ads", created_by: "babuu" },
  { id: "d4", title: "Publish FAQ page for AEO gap", description: "Target: 'what are content pillars' AI Overview inclusion.", status: "todo", priority: "medium", category: "seo", created_by: "babuu" },
  { id: "d5", title: "Weekly report review", status: "done", priority: "low", owner: "Michael", category: "admin", created_by: "user", auto_completed: true },
];

export function TasksSection({ brandId }: { brandId: string }) {
  const [tasks, setTasks] = useState<Task[]>(DEMO_TASKS);
  const [isDemo, setIsDemo] = useState(true);
  const [showNew, setShowNew] = useState(false);
  const [draft, setDraft] = useState({ title: "", owner: "", due_date: "", priority: "medium" as TaskPriority, category: "content" });

  useEffect(() => {
    fetch(`/api/tasks?brand_id=${brandId}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.mode === "live") {
          setTasks(data.tasks);
          setIsDemo(false);
        }
      })
      .catch(() => {});
  }, [brandId]);

  async function moveTask(task: Task, status: TaskStatus) {
    setTasks((prev) => prev.map((t) => (t.id === task.id ? { ...t, status } : t)));
    if (!isDemo) {
      await fetch(`/api/tasks/${task.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      }).catch(() => {});
    }
  }

  async function removeTask(task: Task) {
    setTasks((prev) => prev.filter((t) => t.id !== task.id));
    if (!isDemo) {
      await fetch(`/api/tasks/${task.id}`, { method: "DELETE" }).catch(() => {});
    }
  }

  async function createTask() {
    if (!draft.title.trim()) return;
    const optimistic: Task = {
      id: `tmp-${Math.random().toString(36).slice(2)}`,
      title: draft.title,
      status: "todo",
      priority: draft.priority,
      owner: draft.owner || null,
      due_date: draft.due_date || null,
      category: draft.category,
      created_by: "user",
    };
    setTasks((prev) => [optimistic, ...prev]);
    setShowNew(false);
    setDraft({ title: "", owner: "", due_date: "", priority: "medium", category: "content" });

    if (!isDemo) {
      const res = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ brand_id: brandId, ...optimistic, id: undefined }),
      }).catch(() => null);
      if (res?.ok) {
        const saved = await res.json();
        setTasks((prev) => prev.map((t) => (t.id === optimistic.id ? saved : t)));
      }
    }
  }

  return (
    <div className="flex h-full flex-col overflow-hidden">
      {/* Header */}
      <div className="flex items-start justify-between px-8 pt-8 pb-5">
        <div>
          <div className="eyebrow mb-2">Tasks</div>
          <h1 style={{ fontFamily: "Fraunces, Georgia, serif", fontWeight: 300, fontSize: 28, color: "#EDEFF7" }}>
            Who owns what, by when.
          </h1>
          <p className="mt-1 text-sm" style={{ color: "#AEB6D4", fontWeight: 300 }}>
            Babuu creates tasks from its recommendations and closes them when linked work ships.
          </p>
        </div>
        <button
          onClick={() => setShowNew((v) => !v)}
          className="flex items-center gap-2 rounded-md px-4 py-2 text-sm"
          style={{ background: "rgba(231,201,138,0.1)", border: "1px solid rgba(216,183,121,0.28)", color: "#E7C98A" }}
        >
          <Plus className="h-4 w-4" />
          New task
        </button>
      </div>

      {/* New task form */}
      {showNew && (
        <div className="mx-8 mb-5 rounded-md p-4" style={{ background: "#0E1530", border: "1px solid rgba(216,183,121,0.28)" }}>
          <div className="flex flex-wrap items-end gap-3">
            <div className="flex-1 min-w-48">
              <label className="mb-1 block text-xs" style={{ color: "#AEB6D4" }}>Task</label>
              <input
                value={draft.title}
                onChange={(e) => setDraft((p) => ({ ...p, title: e.target.value }))}
                placeholder="What needs to happen?"
                className="w-full rounded border px-3 py-2 text-sm outline-none"
                style={{ background: "rgba(7,11,28,0.6)", borderColor: "rgba(174,182,212,0.2)", color: "#EDEFF7" }}
              />
            </div>
            <div>
              <label className="mb-1 block text-xs" style={{ color: "#AEB6D4" }}>Owner</label>
              <input
                value={draft.owner}
                onChange={(e) => setDraft((p) => ({ ...p, owner: e.target.value }))}
                placeholder="Name"
                className="w-28 rounded border px-3 py-2 text-sm outline-none"
                style={{ background: "rgba(7,11,28,0.6)", borderColor: "rgba(174,182,212,0.2)", color: "#EDEFF7" }}
              />
            </div>
            <div>
              <label className="mb-1 block text-xs" style={{ color: "#AEB6D4" }}>Due</label>
              <input
                type="date"
                value={draft.due_date}
                onChange={(e) => setDraft((p) => ({ ...p, due_date: e.target.value }))}
                className="rounded border px-3 py-2 text-sm outline-none"
                style={{ background: "rgba(7,11,28,0.6)", borderColor: "rgba(174,182,212,0.2)", color: "#EDEFF7" }}
              />
            </div>
            <div>
              <label className="mb-1 block text-xs" style={{ color: "#AEB6D4" }}>Priority</label>
              <select
                value={draft.priority}
                onChange={(e) => setDraft((p) => ({ ...p, priority: e.target.value as TaskPriority }))}
                className="rounded border px-3 py-2 text-sm outline-none"
                style={{ background: "rgba(7,11,28,0.6)", borderColor: "rgba(174,182,212,0.2)", color: "#EDEFF7" }}
              >
                {(["urgent", "high", "medium", "low"] as const).map((p) => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs" style={{ color: "#AEB6D4" }}>Category</label>
              <select
                value={draft.category}
                onChange={(e) => setDraft((p) => ({ ...p, category: e.target.value }))}
                className="rounded border px-3 py-2 text-sm outline-none"
                style={{ background: "rgba(7,11,28,0.6)", borderColor: "rgba(174,182,212,0.2)", color: "#EDEFF7" }}
              >
                {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <button
              onClick={createTask}
              className="rounded px-4 py-2 text-sm"
              style={{ background: "#E7C98A", color: "#070B1C" }}
            >
              Add
            </button>
          </div>
        </div>
      )}

      {/* Board */}
      <div className="flex flex-1 gap-3 overflow-x-auto px-8 pb-8">
        {COLUMNS.map((col) => {
          const colTasks = tasks.filter((t) => t.status === col.id);
          return (
            <div key={col.id} className="flex w-64 shrink-0 flex-col">
              <div className="mb-3 flex items-center gap-2">
                <span className="h-2 w-2 rounded-full" style={{ background: col.color }} />
                <span className="text-xs font-medium" style={{ color: "#EDEFF7" }}>{col.label}</span>
                <span className="text-xs" style={{ color: "rgba(174,182,212,0.4)" }}>{colTasks.length}</span>
              </div>
              <div className="flex flex-1 flex-col gap-2 overflow-y-auto rounded-md p-2" style={{ background: "rgba(14,21,48,0.35)" }}>
                {colTasks.map((task) => (
                  <TaskCard key={task.id} task={task} onMove={moveTask} onDelete={removeTask} />
                ))}
                {colTasks.length === 0 && (
                  <p className="py-6 text-center text-xs" style={{ color: "rgba(174,182,212,0.3)" }}>Empty</p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function TaskCard({ task, onMove, onDelete }: { task: Task; onMove: (t: Task, s: TaskStatus) => void; onDelete: (t: Task) => void }) {
  const [expanded, setExpanded] = useState(false);
  const overdue = task.due_date && task.status !== "done" && new Date(task.due_date) < new Date();

  return (
    <div
      className="rounded-md p-3 cursor-pointer"
      style={{ background: "#0E1530", border: "1px solid rgba(174,182,212,0.1)" }}
      onClick={() => setExpanded((v) => !v)}
    >
      <div className="mb-2 flex items-center gap-1.5 flex-wrap">
        <Flag className="h-3 w-3" style={{ color: PRIORITY_COLOR[task.priority] }} />
        <span className="text-xs" style={{ color: PRIORITY_COLOR[task.priority] }}>{task.priority}</span>
        {task.category && (
          <span className="rounded-full px-1.5 py-0.5 text-xs" style={{ background: "rgba(174,182,212,0.08)", color: "#AEB6D4" }}>
            {task.category}
          </span>
        )}
        {task.created_by === "babuu" && (
          <span title="Created by Babuu"><Bot className="h-3 w-3" style={{ color: "#D8B779" }} /></span>
        )}
      </div>

      <p className="text-sm" style={{ color: "#EDEFF7", fontWeight: 400, lineHeight: 1.4 }}>{task.title}</p>

      {task.description && expanded && (
        <p className="mt-1.5 text-xs" style={{ color: "#AEB6D4", fontWeight: 300 }}>{task.description}</p>
      )}

      <div className="mt-2 flex items-center gap-3">
        {task.owner && (
          <span className="flex items-center gap-1 text-xs" style={{ color: "#AEB6D4" }}>
            <User className="h-3 w-3" />{task.owner}
          </span>
        )}
        {task.due_date && (
          <span className="flex items-center gap-1 text-xs" style={{ color: overdue ? "#E07878" : "#AEB6D4" }}>
            <CalendarClock className="h-3 w-3" />{task.due_date}
          </span>
        )}
        {task.auto_completed && (
          <span className="text-xs" style={{ color: "rgba(110,196,160,0.6)" }}>auto</span>
        )}
      </div>

      {expanded && (
        <div className="mt-3 flex items-center gap-1.5 flex-wrap" onClick={(e) => e.stopPropagation()}>
          {COLUMNS.filter((c) => c.id !== task.status).map((c) => (
            <button
              key={c.id}
              onClick={() => onMove(task, c.id)}
              className="rounded px-2 py-1 text-xs"
              style={{ background: `${c.color}12`, color: c.color, border: `1px solid ${c.color}30` }}
            >
              {c.label}
            </button>
          ))}
          <button onClick={() => onDelete(task)} className="ml-auto p-1" style={{ color: "rgba(224,120,120,0.6)" }}>
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      )}
    </div>
  );
}

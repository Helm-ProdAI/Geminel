"use client";

import { useEffect, useState } from "react";
import { Mail, MessageSquare, Plus, Wand2, ChevronDown, ChevronRight } from "lucide-react";

interface SeqMessage {
  step: number;
  delay_days: number;
  subject: string;
  body: string;
  cta: string;
}

interface Sequence {
  id: string;
  name: string;
  channel: "email" | "sms";
  sequence_type: string;
  status: string;
  messages: SeqMessage[];
  babuu_generated: boolean;
}

const DEMO_SEQUENCES: Sequence[] = [
  {
    id: "sq1",
    name: "Discovery call nurture",
    channel: "email",
    sequence_type: "nurture",
    status: "draft",
    babuu_generated: true,
    messages: [
      { step: 1, delay_days: 0, subject: "The audit you asked for", body: "Here is the honest version: most brands do not have a traffic problem. They have a consideration problem. People see you, visit your profile, and leave. Over the next few days I will show you exactly where that leak happens and how to close it.", cta: "See the first fix" },
      { step: 2, delay_days: 2, subject: "The 3-second bio test", body: "A stranger lands on your profile. Within three seconds they decide: follow or leave. Your bio either tells them who you help and what changes for them, or it loses them. Run this test on your own profile today.", cta: "Run the test" },
      { step: 3, delay_days: 4, subject: "What our best client did differently", body: "Six months ago they had reach but no revenue. One change: every piece of content pointed to a single next step instead of five. Conversions tripled. The plan is simpler than you think.", cta: "Book a 20-minute call" },
    ],
  },
];

const STATUS_COLOR: Record<string, string> = {
  draft: "#AEB6D4", approved: "#D8B779", active: "#6EC4A0", paused: "#7C82D4", archived: "#AEB6D4",
};

export function SequencesSection({ brandId }: { brandId: string }) {
  const [sequences, setSequences] = useState<Sequence[]>(DEMO_SEQUENCES);
  const [isDemo, setIsDemo] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [drafting, setDrafting] = useState(false);
  const [draft, setDraft] = useState({ name: "", channel: "email", sequence_type: "nurture", goal: "", steps: 5 });

  useEffect(() => {
    fetch(`/api/sequences?brand_id=${brandId}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.mode === "live") { setSequences(data.sequences); setIsDemo(false); }
      })
      .catch(() => {});
  }, [brandId]);

  async function createSequence() {
    if (!draft.name.trim()) return;
    setDrafting(true);

    if (isDemo) {
      setSequences((prev) => [{
        id: `tmp-${Math.random().toString(36).slice(2)}`,
        name: draft.name, channel: draft.channel as "email" | "sms",
        sequence_type: draft.sequence_type, status: "draft",
        babuu_generated: false,
        messages: [],
      }, ...prev]);
    } else {
      const res = await fetch("/api/sequences", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ brand_id: brandId, ...draft, draft_with_babuu: true }),
      }).catch(() => null);
      if (res?.ok) {
        const saved = await res.json();
        setSequences((prev) => [saved, ...prev]);
      }
    }

    setDrafting(false);
    setShowForm(false);
    setDraft({ name: "", channel: "email", sequence_type: "nurture", goal: "", steps: 5 });
  }

  return (
    <div className="h-full overflow-y-auto px-8 py-8">
      <div className="mx-auto max-w-3xl">

        <div className="mb-8 flex items-start justify-between">
          <div>
            <div className="eyebrow mb-2">Sequences</div>
            <h1 style={{ fontFamily: "Fraunces, Georgia, serif", fontWeight: 300, fontSize: 28, color: "#EDEFF7" }}>
              Email and SMS that earns the next open.
            </h1>
            <p className="mt-1 text-sm" style={{ color: "#AEB6D4", fontWeight: 300 }}>
              Babuu drafts full sequences in the brand's voice. You approve before anything sends.
            </p>
          </div>
          <button
            onClick={() => setShowForm((v) => !v)}
            className="flex items-center gap-2 rounded-md px-4 py-2 text-sm shrink-0"
            style={{ background: "rgba(231,201,138,0.1)", border: "1px solid rgba(216,183,121,0.28)", color: "#E7C98A" }}
          >
            <Plus className="h-4 w-4" /> New sequence
          </button>
        </div>

        {showForm && (
          <div className="mb-8 rounded-md p-5" style={{ background: "#0E1530", border: "1px solid rgba(216,183,121,0.28)" }}>
            <div className="grid grid-cols-2 gap-3 mb-3">
              <div className="col-span-2">
                <label className="mb-1 block text-xs" style={{ color: "#AEB6D4" }}>Sequence name</label>
                <input value={draft.name} onChange={(e) => setDraft((p) => ({ ...p, name: e.target.value }))}
                  placeholder="e.g. Post-webinar nurture" style={inp} />
              </div>
              <div>
                <label className="mb-1 block text-xs" style={{ color: "#AEB6D4" }}>Channel</label>
                <select value={draft.channel} onChange={(e) => setDraft((p) => ({ ...p, channel: e.target.value }))} style={inp}>
                  <option value="email">Email</option>
                  <option value="sms">SMS</option>
                </select>
              </div>
              <div>
                <label className="mb-1 block text-xs" style={{ color: "#AEB6D4" }}>Type</label>
                <select value={draft.sequence_type} onChange={(e) => setDraft((p) => ({ ...p, sequence_type: e.target.value }))} style={inp}>
                  {["nurture", "promotion", "newsletter", "onboarding", "winback"].map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>
              <div className="col-span-2">
                <label className="mb-1 block text-xs" style={{ color: "#AEB6D4" }}>Goal (Babuu drafts toward this)</label>
                <input value={draft.goal} onChange={(e) => setDraft((p) => ({ ...p, goal: e.target.value }))}
                  placeholder="e.g. book discovery calls from webinar attendees" style={inp} />
              </div>
            </div>
            <div className="flex gap-2">
              <button onClick={createSequence} disabled={drafting}
                className="flex items-center gap-2 rounded px-4 py-2 text-sm" style={{ background: "#E7C98A", color: "#070B1C" }}>
                <Wand2 className="h-3.5 w-3.5" />
                {drafting ? "Babuu is drafting..." : "Draft with Babuu"}
              </button>
              <button onClick={() => setShowForm(false)} className="rounded px-4 py-2 text-sm" style={{ color: "#AEB6D4" }}>Cancel</button>
            </div>
          </div>
        )}

        <div className="flex flex-col gap-3">
          {sequences.map((seq) => {
            const isOpen = expanded === seq.id;
            const Icon = seq.channel === "email" ? Mail : MessageSquare;
            return (
              <div key={seq.id} className="rounded-md" style={{ background: "#0E1530", border: "1px solid rgba(174,182,212,0.1)" }}>
                <button
                  onClick={() => setExpanded(isOpen ? null : seq.id)}
                  className="flex w-full items-center gap-3 p-4 text-left"
                >
                  {isOpen ? <ChevronDown className="h-4 w-4" style={{ color: "#AEB6D4" }} /> : <ChevronRight className="h-4 w-4" style={{ color: "#AEB6D4" }} />}
                  <Icon className="h-4 w-4" style={{ color: "#D8B779" }} />
                  <span className="text-sm font-medium" style={{ color: "#EDEFF7" }}>{seq.name}</span>
                  <span className="rounded-full px-2 py-0.5 text-xs capitalize" style={{ background: "rgba(174,182,212,0.08)", color: "#AEB6D4" }}>
                    {seq.sequence_type}
                  </span>
                  <span className="text-xs capitalize" style={{ color: STATUS_COLOR[seq.status] ?? "#AEB6D4" }}>{seq.status}</span>
                  {seq.babuu_generated && <span className="text-xs" style={{ color: "rgba(216,183,121,0.5)" }}>Babuu-drafted</span>}
                  <span className="ml-auto text-xs" style={{ color: "rgba(174,182,212,0.4)" }}>
                    {seq.messages.length} step{seq.messages.length !== 1 ? "s" : ""}
                  </span>
                </button>

                {isOpen && seq.messages.length > 0 && (
                  <div className="flex flex-col gap-2 px-4 pb-4">
                    {seq.messages.map((m) => (
                      <div key={m.step} className="rounded p-3" style={{ background: "rgba(7,11,28,0.5)", border: "1px solid rgba(174,182,212,0.08)" }}>
                        <div className="mb-1.5 flex items-center gap-2">
                          <span className="flex h-5 w-5 items-center justify-center rounded-full text-xs" style={{ background: "rgba(216,183,121,0.12)", color: "#D8B779" }}>
                            {m.step}
                          </span>
                          <span className="text-xs" style={{ color: "rgba(174,182,212,0.5)" }}>
                            {m.delay_days === 0 ? "Immediately" : `Day ${m.delay_days}`}
                          </span>
                          {m.subject && <span className="text-xs font-medium" style={{ color: "#EDEFF7" }}>{m.subject}</span>}
                        </div>
                        <p className="text-xs leading-relaxed" style={{ color: "#AEB6D4", fontWeight: 300 }}>{m.body}</p>
                        {m.cta && <p className="mt-1.5 text-xs" style={{ color: "#E7C98A" }}>CTA: {m.cta}</p>}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

const inp: React.CSSProperties = {
  background: "rgba(7,11,28,0.6)", border: "1px solid rgba(174,182,212,0.2)",
  color: "#EDEFF7", borderRadius: 4, padding: "8px 12px", fontSize: 13, outline: "none", width: "100%",
};

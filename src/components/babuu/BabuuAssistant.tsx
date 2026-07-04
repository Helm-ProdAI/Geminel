"use client";

// Floating Babuu assistant — available on every page.
// Handles queries, quick actions, and how-to help for team members.
// Uses the same agent API as the main chat, so per-brand voice and
// data isolation rules apply everywhere.

import { useEffect, useRef, useState } from "react";
import { X, Send, Minus } from "lucide-react";

interface Msg {
  id: string;
  role: "user" | "assistant";
  content: string;
}

const QUICK_ACTIONS = [
  "What's due this week?",
  "Create a task",
  "Draft a caption",
  "Summarize this brand's status",
];

export function BabuuAssistant() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [brandId, setBrandId] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Pick up the active brand so the assistant answers in-context
  useEffect(() => {
    fetch("/api/brands")
      .then((r) => (r.ok ? r.json() : []))
      .then((brands: { id: string }[]) => {
        if (Array.isArray(brands) && brands.length > 0) setBrandId(brands[0].id);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  async function send(text: string) {
    if (!text.trim() || loading) return;
    const userMsg: Msg = { id: crypto.randomUUID(), role: "user", content: text.trim() };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/babuu/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          brand_id: brandId ?? "studio",
          message: text.trim(),
          conversation_history: messages.map((m) => ({ role: m.role, content: m.content })),
        }),
      });

      const data = await res.json().catch(() => null);
      const content = res.ok
        ? data?.response?.content ?? "Done."
        : data?.error ?? "Something went wrong. Try again.";

      setMessages((prev) => [...prev, { id: crypto.randomUUID(), role: "assistant", content }]);
    } catch {
      setMessages((prev) => [
        ...prev,
        { id: crypto.randomUUID(), role: "assistant", content: "Connection error. Try again." },
      ]);
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        aria-label="Open Babuu assistant"
        className="fixed bottom-6 right-6 z-50 flex h-12 w-12 items-center justify-center rounded-full transition-transform hover:scale-105"
        style={{
          background: "#0E1530",
          border: "1px solid rgba(216,183,121,0.4)",
          boxShadow: "0 4px 24px rgba(0,0,0,0.5), 0 0 12px rgba(231,201,138,0.15)",
        }}
      >
        <GuidingPairMark size={22} />
      </button>
    );
  }

  return (
    <div
      className="fixed bottom-6 right-6 z-50 flex h-[480px] w-96 flex-col overflow-hidden rounded-lg"
      style={{
        background: "#0A0F26",
        border: "1px solid rgba(216,183,121,0.3)",
        boxShadow: "0 8px 40px rgba(0,0,0,0.6)",
      }}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between px-4 py-3"
        style={{ borderBottom: "1px solid rgba(174,182,212,0.1)", background: "#0E1530" }}
      >
        <div className="flex items-center gap-2">
          <GuidingPairMark size={16} />
          <span className="eyebrow" style={{ letterSpacing: "0.24em" }}>Babuu</span>
        </div>
        <div className="flex items-center gap-1">
          <button onClick={() => setOpen(false)} className="p-1" style={{ color: "#AEB6D4" }} aria-label="Minimize">
            <Minus className="h-4 w-4" />
          </button>
          <button
            onClick={() => { setOpen(false); setMessages([]); }}
            className="p-1"
            style={{ color: "#AEB6D4" }}
            aria-label="Close and clear"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4">
        {messages.length === 0 && (
          <div className="flex h-full flex-col justify-center">
            <p className="mb-1 text-sm text-center" style={{ color: "#EDEFF7", fontFamily: "Fraunces, Georgia, serif", fontWeight: 300 }}>
              How can I help?
            </p>
            <p className="mb-4 text-xs text-center" style={{ color: "#AEB6D4" }}>
              Ask anything, or start with one of these.
            </p>
            <div className="flex flex-col gap-1.5">
              {QUICK_ACTIONS.map((qa) => (
                <button
                  key={qa}
                  onClick={() => send(qa)}
                  className="rounded-md px-3 py-2 text-left text-xs transition-colors"
                  style={{
                    background: "rgba(231,201,138,0.05)",
                    border: "1px solid rgba(216,183,121,0.18)",
                    color: "#AEB6D4",
                  }}
                >
                  {qa}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((m) => (
          <div key={m.id} className={`mb-3 flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
            <div
              className="max-w-[85%] rounded-md px-3 py-2 text-xs leading-relaxed whitespace-pre-wrap"
              style={
                m.role === "user"
                  ? { background: "rgba(231,201,138,0.1)", border: "1px solid rgba(216,183,121,0.2)", color: "#EDEFF7" }
                  : { background: "#0E1530", border: "1px solid rgba(174,182,212,0.1)", color: "#AEB6D4" }
              }
            >
              {m.content}
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex gap-1 px-1 py-2">
            {[0, 1, 2].map((i) => (
              <span
                key={i}
                className="h-1.5 w-1.5 animate-bounce rounded-full"
                style={{ background: "#D8B779", animationDelay: `${i * 150}ms` }}
              />
            ))}
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="p-3" style={{ borderTop: "1px solid rgba(174,182,212,0.1)" }}>
        <div className="flex items-center gap-2">
          <input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") send(input); }}
            placeholder="Ask Babuu..."
            className="flex-1 rounded-md border px-3 py-2 text-xs outline-none"
            style={{ background: "rgba(14,21,48,0.8)", borderColor: "rgba(174,182,212,0.2)", color: "#EDEFF7" }}
          />
          <button
            onClick={() => send(input)}
            disabled={loading || !input.trim()}
            className="flex h-8 w-8 items-center justify-center rounded-md"
            style={{
              background: input.trim() ? "#E7C98A" : "rgba(174,182,212,0.1)",
              color: input.trim() ? "#070B1C" : "#AEB6D4",
            }}
            aria-label="Send"
          >
            <Send className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}

function GuidingPairMark({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" aria-hidden="true" style={{ flexShrink: 0 }}>
      <g fill="none" stroke="#E7C98A" strokeWidth="1.4" strokeLinejoin="round">
        <path d="M38 30 L41.5 44 L55 47.5 L41.5 51 L38 65 L34.5 51 L21 47.5 L34.5 44 Z" />
      </g>
      <g fill="#E7C98A" opacity="0.95">
        <path d="M66 44 L68.4 53 L77 55.4 L68.4 57.8 L66 67 L63.6 57.8 L55 55.4 L63.6 53 Z" />
      </g>
    </svg>
  );
}

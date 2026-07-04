"use client";

import { useState, useRef, useEffect } from "react";
import { Send, Loader2, AlertCircle, CheckCircle2, Info } from "lucide-react";
import type { BabuuResponse, BabuuSource } from "@/types/brand";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  confidence?: "high" | "medium" | "low";
  sources?: BabuuSource[];
  skills_called?: string[];
}

interface BabuuChatProps {
  brandId: string;
  brandName: string;
}

const CONFIDENCE_CONFIG = {
  high:   { icon: CheckCircle2, label: "High confidence", color: "#6EC4A0" },
  medium: { icon: Info,         label: "Medium confidence", color: "#D4B86E" },
  low:    { icon: AlertCircle,  label: "Low confidence",  color: "#E07878" },
};

const STARTER_PROMPTS = [
  "What is the biggest leak in this brand right now?",
  "Draft 3 social posts based on what has worked.",
  "What should our Content Lab test be this week?",
  "How are our paid ads performing?",
  "Give me the full SEO and AEO picture.",
];

export function BabuuChat({ brandId, brandName }: BabuuChatProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  async function sendMessage(text: string) {
    if (!text.trim() || loading) return;

    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: "user",
      content: text.trim(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setLoading(true);

    try {
      const history = messages.map((m) => ({ role: m.role, content: m.content }));

      const res = await fetch("/api/babuu/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          brand_id: brandId,
          message: text.trim(),
          session_id: sessionId,
          conversation_history: history,
        }),
      });

      if (!res.ok) {
        // Surface the server's message (e.g. "connect Supabase first") instead of a generic error
        const errBody = await res.json().catch(() => null);
        throw new Error(errBody?.error ?? "Request failed");
      }

      const data = await res.json();
      const response: BabuuResponse = data.response;
      if (data.session_id) setSessionId(data.session_id);

      setMessages((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          role: "assistant",
          content: response.content,
          confidence: response.confidence,
          sources: response.sources,
          skills_called: response.skills_called,
        },
      ]);
    } catch (err) {
      const msg = err instanceof Error && err.message !== "Request failed"
        ? err.message
        : "Something went wrong. Try again.";
      setMessages((prev) => [
        ...prev,
        { id: crypto.randomUUID(), role: "assistant", content: msg },
      ]);
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  }

  const isEmpty = messages.length === 0;

  return (
    <div className="flex h-full flex-col" style={{ background: "#070B1C" }}>
      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-6 py-8">
        {isEmpty ? (
          <div className="flex flex-col items-center justify-center gap-8 py-16 text-center">
            {/* Brand mark */}
            <div>
              <GuidingPairMark size={64} />
              <p className="mt-4 text-serif text-xl" style={{ color: "#EDEFF7", fontFamily: "Fraunces, Georgia, serif", fontWeight: 300 }}>
                Babuu
              </p>
              <p className="mt-1 text-sm" style={{ color: "#AEB6D4" }}>
                Strategic partner for {brandName}
              </p>
            </div>

            {/* Starter prompts */}
            <div className="flex flex-col gap-2 w-full max-w-md">
              {STARTER_PROMPTS.map((prompt) => (
                <button
                  key={prompt}
                  onClick={() => sendMessage(prompt)}
                  className="rounded-md border px-4 py-3 text-left text-sm transition-all"
                  style={{
                    borderColor: "rgba(216,183,121,0.28)",
                    background: "#0E1530",
                    color: "#AEB6D4",
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLElement).style.color = "#EDEFF7";
                    (e.currentTarget as HTMLElement).style.borderColor = "rgba(216,183,121,0.55)";
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLElement).style.color = "#AEB6D4";
                    (e.currentTarget as HTMLElement).style.borderColor = "rgba(216,183,121,0.28)";
                  }}
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="mx-auto flex max-w-2xl flex-col gap-6">
            {messages.map((message) => (
              <MessageBubble key={message.id} message={message} />
            ))}
            {loading && <ThinkingIndicator />}
            <div ref={bottomRef} />
          </div>
        )}
      </div>

      {/* Input */}
      <div
        className="px-6 py-4"
        style={{ borderTop: "1px solid rgba(174,182,212,0.1)", background: "#070B1C" }}
      >
        <div className="mx-auto flex max-w-2xl items-end gap-3">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask Babuu anything about this brand..."
            rows={1}
            className="flex-1 resize-none rounded-md border px-4 py-3 text-sm focus:outline-none max-h-40 overflow-y-auto"
            style={{
              background: "#0E1530",
              borderColor: "rgba(216,183,121,0.28)",
              color: "#EDEFF7",
              fontFamily: "Inter, sans-serif",
              fontWeight: 300,
            }}
            onFocus={(e) => { e.currentTarget.style.borderColor = "rgba(216,183,121,0.55)"; }}
            onBlur={(e) => { e.currentTarget.style.borderColor = "rgba(216,183,121,0.28)"; }}
            onInput={(e) => {
              const t = e.target as HTMLTextAreaElement;
              t.style.height = "auto";
              t.style.height = `${t.scrollHeight}px`;
            }}
          />
          <button
            onClick={() => sendMessage(input)}
            disabled={loading || !input.trim()}
            className="flex h-10 w-10 items-center justify-center rounded-md transition-all"
            style={{
              background: input.trim() && !loading ? "#E7C98A" : "#1B2240",
              color: input.trim() && !loading ? "#070B1C" : "#AEB6D4",
              cursor: input.trim() && !loading ? "pointer" : "not-allowed",
            }}
          >
            {loading
              ? <Loader2 className="h-4 w-4 animate-spin" />
              : <Send className="h-4 w-4" />
            }
          </button>
        </div>
        <p className="mx-auto mt-2 max-w-2xl text-center text-xs" style={{ color: "#AEB6D4", opacity: 0.5 }}>
          Enter to send. Shift + Enter for a new line.
        </p>
      </div>
    </div>
  );
}

function MessageBubble({ message }: { message: Message }) {
  const isUser = message.role === "user";

  if (isUser) {
    return (
      <div className="flex justify-end">
        <div
          className="max-w-[80%] rounded-md px-4 py-3 text-sm"
          style={{
            background: "rgba(231,201,138,0.1)",
            border: "1px solid rgba(216,183,121,0.28)",
            color: "#EDEFF7",
            fontWeight: 300,
          }}
        >
          {message.content}
        </div>
      </div>
    );
  }

  const confCfg = message.confidence ? CONFIDENCE_CONFIG[message.confidence] : null;

  return (
    <div className="flex flex-col gap-2">
      {/* Message */}
      <div
        className="rounded-md px-5 py-4 text-sm leading-relaxed"
        style={{
          background: "#0E1530",
          border: "1px solid rgba(174,182,212,0.1)",
          color: "#EDEFF7",
          fontWeight: 300,
        }}
      >
        <div className="flex items-center gap-2 mb-3">
          <GuidingPairMark size={16} />
          <span className="eyebrow" style={{ letterSpacing: "0.24em" }}>Babuu</span>
        </div>
        <p className="whitespace-pre-wrap">{message.content}</p>
      </div>

      {/* Metadata */}
      {(confCfg || (message.sources && message.sources.length > 0)) && (
        <div className="flex flex-wrap items-center gap-3 px-1">
          {confCfg && (
            <div className="flex items-center gap-1 text-xs" style={{ color: confCfg.color }}>
              <confCfg.icon className="h-3 w-3" />
              <span>{confCfg.label}</span>
            </div>
          )}
          {message.sources && message.sources.map((source, i) => (
            <span
              key={i}
              className="rounded-full px-2 py-0.5 text-xs"
              style={{
                background: "rgba(174,182,212,0.06)",
                border: "1px solid rgba(174,182,212,0.12)",
                color: "#AEB6D4",
              }}
            >
              {source.type === "client_data" ? `data: ${source.reference}` : source.type === "geminel_playbook" ? "framework" : "research"}
            </span>
          ))}
          {message.skills_called && message.skills_called.length > 0 && (
            <span className="text-xs" style={{ color: "rgba(174,182,212,0.4)" }}>
              {message.skills_called.length} skill{message.skills_called.length > 1 ? "s" : ""} used
            </span>
          )}
        </div>
      )}
    </div>
  );
}

function ThinkingIndicator() {
  return (
    <div className="flex items-center gap-2 text-sm" style={{ color: "#AEB6D4" }}>
      <GuidingPairMark size={16} />
      <div className="flex gap-1 items-center">
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="h-1 w-1 rounded-full animate-bounce"
            style={{ background: "#E7C98A", animationDelay: `${i * 150}ms`, opacity: 0.7 }}
          />
        ))}
      </div>
      <span style={{ opacity: 0.6 }}>Babuu is thinking...</span>
    </div>
  );
}

// The Geminel brand mark — guiding pair of stars
function GuidingPairMark({ size = 24 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      aria-hidden="true"
      style={{ flexShrink: 0 }}
    >
      <g fill="none" stroke="#E7C98A" strokeWidth="1.4" strokeLinejoin="round"
         filter="drop-shadow(0 0 6px rgba(231,201,138,0.5))">
        <path d="M38 30 L41.5 44 L55 47.5 L41.5 51 L38 65 L34.5 51 L21 47.5 L34.5 44 Z" />
      </g>
      <g fill="#E7C98A" opacity="0.95">
        <path d="M66 44 L68.4 53 L77 55.4 L68.4 57.8 L66 67 L63.6 57.8 L55 55.4 L63.6 53 Z" />
      </g>
    </svg>
  );
}

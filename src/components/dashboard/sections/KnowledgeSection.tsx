"use client";

import { useEffect, useRef, useState } from "react";
import { BookOpen, Upload, FileText, CheckCircle2, Loader2 } from "lucide-react";

interface KnowledgeDoc {
  id: string;
  title: string;
  source_type: string;
  babuu_summary?: string | null;
  key_takeaways?: string[];
  embedded: boolean;
  created_at: string;
}

const SOURCE_TYPES = [
  { id: "workshop",      label: "Workshop" },
  { id: "course",        label: "Course" },
  { id: "program",       label: "Program" },
  { id: "book",          label: "Book notes" },
  { id: "article",       label: "Article" },
  { id: "meeting_notes", label: "Meeting notes" },
  { id: "other",         label: "Other" },
];

const DEMO_DOCS: KnowledgeDoc[] = [
  {
    id: "k1",
    title: "StoryBrand Workshop — Donald Miller framework",
    source_type: "workshop",
    babuu_summary: "The StoryBrand framework positions the customer as the hero and the brand as the guide. Seven-part structure: a character with a problem meets a guide who gives them a plan, calls them to action, and helps them avoid failure and achieve success. Use it whenever messaging feels brand-centric instead of customer-centric.",
    key_takeaways: [
      "The customer is the hero. The brand is the guide, never the hero.",
      "Every homepage should pass the grunt test: what do you offer, how does it improve my life, how do I buy.",
      "Internal problems (frustration, self-doubt) sell better than external problems (the surface task).",
    ],
    embedded: true,
    created_at: "2026-06-15",
  },
];

export function KnowledgeSection({ brandId }: { brandId: string }) {
  const [docs, setDocs] = useState<KnowledgeDoc[]>(DEMO_DOCS);
  const [isDemo, setIsDemo] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadMsg, setUploadMsg] = useState("");
  const [sourceType, setSourceType] = useState("workshop");
  const [pasteMode, setPasteMode] = useState(false);
  const [pasteTitle, setPasteTitle] = useState("");
  const [pasteText, setPasteText] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetch(`/api/knowledge?brand_id=${brandId}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.mode === "live") { setDocs(data.documents); setIsDemo(false); }
      })
      .catch(() => {});
  }, [brandId]);

  async function handleFile(file: File) {
    setUploading(true);
    setUploadMsg(`Reading ${file.name}...`);

    const form = new FormData();
    form.append("file", file);
    form.append("title", file.name.replace(/\.(pdf|docx|txt|md)$/i, ""));
    form.append("source_type", sourceType);
    form.append("brand_id", brandId);

    setUploadMsg("Extracting, summarizing, and adding to master memory...");
    const res = await fetch("/api/knowledge", { method: "POST", body: form }).catch(() => null);

    if (res?.ok) {
      const doc = await res.json();
      setDocs((prev) => [doc, ...prev]);
      setUploadMsg("");
    } else {
      const err = await res?.json().catch(() => null);
      setUploadMsg(err?.error ?? "Upload failed. Is Supabase connected?");
    }
    setUploading(false);
  }

  async function handlePaste() {
    if (!pasteTitle.trim() || !pasteText.trim()) return;
    setUploading(true);
    setUploadMsg("Summarizing and adding to master memory...");

    const res = await fetch("/api/knowledge", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: pasteTitle, text: pasteText, source_type: sourceType, brand_id: brandId }),
    }).catch(() => null);

    if (res?.ok) {
      const doc = await res.json();
      setDocs((prev) => [doc, ...prev]);
      setPasteMode(false);
      setPasteTitle("");
      setPasteText("");
      setUploadMsg("");
    } else {
      const err = await res?.json().catch(() => null);
      setUploadMsg(err?.error ?? "Save failed. Is Supabase connected?");
    }
    setUploading(false);
  }

  return (
    <div className="h-full overflow-y-auto px-8 py-8">
      <div className="mx-auto max-w-3xl">

        {/* Header */}
        <div className="mb-8">
          <div className="eyebrow mb-2">Knowledge</div>
          <h1 style={{ fontFamily: "Fraunces, Georgia, serif", fontWeight: 300, fontSize: 28, color: "#EDEFF7" }}>
            Master memory.
          </h1>
          <p className="mt-1 text-sm" style={{ color: "#AEB6D4", fontWeight: 300 }}>
            Dump anything here — workshop notes, course PDFs, program materials. Babuu documents it, extracts the takeaways, and remembers it forever.
          </p>
        </div>

        {/* Upload zone */}
        <div className="mb-8 rounded-md p-5" style={{ background: "#0E1530", border: "1px dashed rgba(216,183,121,0.3)" }}>
          <div className="flex items-center gap-3 mb-4">
            <label className="text-xs" style={{ color: "#AEB6D4" }}>This is a:</label>
            <select
              value={sourceType}
              onChange={(e) => setSourceType(e.target.value)}
              className="rounded border px-3 py-1.5 text-xs outline-none"
              style={{ background: "rgba(7,11,28,0.6)", borderColor: "rgba(174,182,212,0.2)", color: "#EDEFF7" }}
            >
              {SOURCE_TYPES.map((t) => <option key={t.id} value={t.id}>{t.label}</option>)}
            </select>
          </div>

          {!pasteMode ? (
            <div className="flex items-center gap-3">
              <button
                onClick={() => fileRef.current?.click()}
                disabled={uploading}
                className="flex items-center gap-2 rounded-md px-4 py-2.5 text-sm"
                style={{ background: "rgba(231,201,138,0.1)", border: "1px solid rgba(216,183,121,0.28)", color: "#E7C98A" }}
              >
                {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                {uploading ? "Processing..." : "Upload file"}
              </button>
              <span className="text-xs" style={{ color: "rgba(174,182,212,0.5)" }}>PDF, DOCX, TXT, MD</span>
              <button onClick={() => setPasteMode(true)} className="ml-auto text-xs" style={{ color: "#AEB6D4" }}>
                Or paste text instead
              </button>
              <input
                ref={fileRef}
                type="file"
                accept=".pdf,.docx,.txt,.md"
                className="hidden"
                onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); e.target.value = ""; }}
              />
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              <input
                value={pasteTitle}
                onChange={(e) => setPasteTitle(e.target.value)}
                placeholder="Title — e.g. 'Hormozi offer workshop, day 2'"
                className="rounded border px-3 py-2 text-sm outline-none"
                style={{ background: "rgba(7,11,28,0.6)", borderColor: "rgba(174,182,212,0.2)", color: "#EDEFF7" }}
              />
              <textarea
                value={pasteText}
                onChange={(e) => setPasteText(e.target.value)}
                rows={6}
                placeholder="Paste your notes here..."
                className="rounded border px-3 py-2 text-sm outline-none resize-none"
                style={{ background: "rgba(7,11,28,0.6)", borderColor: "rgba(174,182,212,0.2)", color: "#EDEFF7", lineHeight: 1.6 }}
              />
              <div className="flex gap-2">
                <button onClick={handlePaste} disabled={uploading} className="rounded px-4 py-2 text-sm" style={{ background: "#E7C98A", color: "#070B1C" }}>
                  {uploading ? "Processing..." : "Add to memory"}
                </button>
                <button onClick={() => setPasteMode(false)} className="rounded px-4 py-2 text-sm" style={{ color: "#AEB6D4" }}>Cancel</button>
              </div>
            </div>
          )}

          {uploadMsg && (
            <p className="mt-3 text-xs" style={{ color: uploadMsg.includes("failed") || uploadMsg.includes("connected") ? "#E07878" : "#D8B779" }}>
              {uploadMsg}
            </p>
          )}
        </div>

        {/* Document list */}
        <div className="flex flex-col gap-4">
          {docs.map((doc) => (
            <div key={doc.id} className="rounded-md p-5" style={{ background: "#0E1530", border: "1px solid rgba(174,182,212,0.1)" }}>
              <div className="mb-2 flex items-center gap-2 flex-wrap">
                <FileText className="h-4 w-4" style={{ color: "#D8B779" }} />
                <span className="text-sm font-medium" style={{ color: "#EDEFF7" }}>{doc.title}</span>
                <span className="rounded-full px-2 py-0.5 text-xs capitalize" style={{ background: "rgba(174,182,212,0.08)", color: "#AEB6D4" }}>
                  {doc.source_type.replace("_", " ")}
                </span>
                {doc.embedded && (
                  <span className="flex items-center gap-1 text-xs" style={{ color: "#6EC4A0" }}>
                    <CheckCircle2 className="h-3 w-3" /> In memory
                  </span>
                )}
              </div>

              {doc.babuu_summary && (
                <p className="text-xs leading-relaxed mb-3" style={{ color: "#AEB6D4", fontWeight: 300 }}>
                  {doc.babuu_summary}
                </p>
              )}

              {doc.key_takeaways && doc.key_takeaways.length > 0 && (
                <div className="rounded px-3 py-2.5" style={{ background: "rgba(7,11,28,0.5)", border: "1px solid rgba(174,182,212,0.08)" }}>
                  <p className="eyebrow mb-2" style={{ letterSpacing: "0.24em", fontSize: 9 }}>Key takeaways</p>
                  <ul className="flex flex-col gap-1.5">
                    {doc.key_takeaways.map((t, i) => (
                      <li key={i} className="flex gap-2 text-xs" style={{ color: "#AEB6D4", fontWeight: 300 }}>
                        <span style={{ color: "#D8B779" }}>·</span>{t}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ))}

          {docs.length === 0 && (
            <div className="py-16 text-center">
              <BookOpen className="h-10 w-10 mx-auto mb-3" style={{ color: "rgba(216,183,121,0.25)" }} />
              <p style={{ fontFamily: "Fraunces, Georgia, serif", fontWeight: 300, color: "#EDEFF7" }}>Nothing in memory yet</p>
              <p className="mt-1 text-sm" style={{ color: "#AEB6D4" }}>Upload your first workshop or course material above.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

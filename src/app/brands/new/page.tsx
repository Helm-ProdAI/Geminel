"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronRight, ChevronLeft, Check } from "lucide-react";

type BrandType = "personal" | "creator" | "corporate" | "ecommerce";
type GoalType  = "awareness" | "leads" | "sales" | "retention" | "advocacy";

interface FormData {
  // Step 1 — Identity
  brand_name: string;
  brand_type: BrandType | "";
  is_local: boolean;
  elevator_pitch: string;
  tone_descriptors: string;
  forbidden_patterns: string;

  // Step 2 — Audience
  persona_name: string;
  persona_situation: string;
  persona_problem: string;
  persona_outcome: string;
  persona_keywords: string;
  geographic_focus: string;

  // Step 3 — Goals
  primary_goal: string;
  goal_type: GoalType | "";
  current_stage_focus: string;
  weakest_stage: string;
  target_awareness: string;
  target_consideration: string;
  target_conversion: string;
  target_loyalty: string;
  target_advocacy: string;

  // Step 4 — Positioning
  positioning_statement: string;
  core_differentiator: string;
  market_category: string;
  biggest_leak: string;

  // Step 5 — Channels
  primary_domain: string;
  instagram_handle: string;
  tiktok_handle: string;
  linkedin_handle: string;
  contact_email: string;
  timezone: string;
}

const EMPTY: FormData = {
  brand_name: "", brand_type: "", is_local: false, elevator_pitch: "", tone_descriptors: "", forbidden_patterns: "",
  persona_name: "", persona_situation: "", persona_problem: "", persona_outcome: "", persona_keywords: "", geographic_focus: "",
  primary_goal: "", goal_type: "", current_stage_focus: "1", weakest_stage: "2",
  target_awareness: "", target_consideration: "", target_conversion: "", target_loyalty: "", target_advocacy: "",
  positioning_statement: "", core_differentiator: "", market_category: "", biggest_leak: "",
  primary_domain: "", instagram_handle: "", tiktok_handle: "", linkedin_handle: "", contact_email: "", timezone: "UTC",
};

const STEPS = [
  { id: 1, label: "Identity"    },
  { id: 2, label: "Audience"   },
  { id: 3, label: "Goals"      },
  { id: 4, label: "Positioning" },
  { id: 5, label: "Channels"   },
];

const BRAND_TYPES: { value: BrandType; label: string; desc: string }[] = [
  { value: "personal",   label: "Personal",   desc: "Coach, consultant, freelancer. You are the brand." },
  { value: "creator",    label: "Creator",    desc: "Influencer, educator, media. Content is the product." },
  { value: "corporate",  label: "Corporate",  desc: "Company, agency, B2B. Goal: leads and credibility." },
  { value: "ecommerce",  label: "E-commerce", desc: "Online store, DTC. Goal: sales and repeat purchase." },
];

const GOAL_TYPES: { value: GoalType; label: string }[] = [
  { value: "awareness",  label: "Build awareness" },
  { value: "leads",      label: "Generate leads" },
  { value: "sales",      label: "Drive sales" },
  { value: "retention",  label: "Improve retention" },
  { value: "advocacy",   label: "Grow advocacy" },
];

const STAGES = [1, 2, 3, 4, 5];
const STAGE_NAMES = ["", "Awareness", "Consideration", "Conversion", "Loyalty", "Advocacy"];

export default function NewBrandPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [form, setForm] = useState<FormData>(EMPTY);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  function set(field: keyof FormData, value: string | boolean) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function next() { if (step < 5) setStep((s) => s + 1); }
  function back() { if (step > 1) setStep((s) => s - 1); }

  async function submit() {
    setSaving(true);
    setError("");

    try {
      const payload = {
        brand_name:   form.brand_name,
        brand_type:   form.brand_type,
        is_local:     form.is_local,
        voice: {
          elevator_pitch:   form.elevator_pitch,
          tone_descriptors: form.tone_descriptors.split(",").map((s) => s.trim()).filter(Boolean),
          forbidden_patterns: form.forbidden_patterns.split(",").map((s) => s.trim()).filter(Boolean),
          tone_by_channel:  {},
          writing_samples:  [],
        },
        visual_identity: { primary_colors: [], typography: "", logo_url: "", asset_folder_url: "", do_not_do: [] },
        primary_persona: {
          name:            form.persona_name,
          situation:       form.persona_situation,
          problem_statement: form.persona_problem,
          desired_outcome: form.persona_outcome,
          search_keywords: form.persona_keywords.split(",").map((s) => s.trim()).filter(Boolean),
          decision_maker:  true, budget_range: null, buying_cycle: "", pain_points: [],
        },
        secondary_personas:     [],
        geographic_focus:       form.geographic_focus || null,
        primary_goal:           form.primary_goal,
        goal_type:              form.goal_type,
        current_stage_focus:    parseInt(form.current_stage_focus),
        weakest_stage:          parseInt(form.weakest_stage),
        quarterly_targets: {
          awareness:     parseInt(form.target_awareness)     || 0,
          consideration: parseInt(form.target_consideration) || 0,
          conversion:    parseInt(form.target_conversion)    || 0,
          loyalty:       parseInt(form.target_loyalty)       || 0,
          advocacy:      parseInt(form.target_advocacy)      || 0,
        },
        positioning_statement: form.positioning_statement,
        core_differentiator:   form.core_differentiator,
        market_category:       form.market_category,
        biggest_leak:          form.biggest_leak,
        competitors:           [],
        past_wins:             [],
        past_losses:           [],
        social_channels: [
          form.instagram_handle && { platform: "instagram", handle: form.instagram_handle, follower_count: 0, posting_cadence: "3x/week", content_pillar_ratios: { teach: 40, connect: 35, spark: 25 } },
          form.tiktok_handle    && { platform: "tiktok",    handle: form.tiktok_handle,    follower_count: 0, posting_cadence: "5x/week", content_pillar_ratios: { teach: 20, connect: 35, spark: 45 } },
          form.linkedin_handle  && { platform: "linkedin",  handle: form.linkedin_handle,  follower_count: 0, posting_cadence: "3x/week", content_pillar_ratios: { teach: 55, connect: 25, spark: 20 } },
        ].filter(Boolean),
        seo_config:        { primary_domain: form.primary_domain, target_keywords: [] },
        email_config:      null,
        paid_ads_config:   [],
        video_config:      null,
        content_lab_results: [],
        evergreen_assets:    [],
        babuu_permissions:   ["read_analytics", "suggest_strategy", "draft_content"],
        review_cadence:      "weekly",
        contact_email:       form.contact_email,
        timezone:            form.timezone,
      };

      const res = await fetch("/api/brands", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "Failed to create brand");
      }

      const { id } = await res.json();
      router.push(`/dashboard?brand=${id}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="min-h-screen" style={{ background: "#070B1C", color: "#EDEFF7" }}>

      {/* Header */}
      <header
        className="flex h-14 items-center justify-between px-6"
        style={{ borderBottom: "1px solid rgba(174,182,212,0.1)" }}
      >
        <div className="flex items-center gap-2.5">
          <GuidingPairMark size={24} />
          <span style={{ fontFamily: "Fraunces, Georgia, serif", fontWeight: 300, fontSize: 16, color: "#EDEFF7" }}>
            Gemin<b style={{ fontWeight: 400 }}>el</b>
          </span>
        </div>
        <a href="/dashboard" className="text-sm" style={{ color: "#AEB6D4" }}>
          Back to dashboard
        </a>
      </header>

      <div className="mx-auto max-w-2xl px-6 py-12">

        {/* Page title */}
        <div className="mb-10">
          <div className="eyebrow mb-2">New brand</div>
          <h1 style={{ fontFamily: "Fraunces, Georgia, serif", fontWeight: 300, fontSize: 32 }}>
            Add a brand to Babuu
          </h1>
          <p className="mt-2 text-sm" style={{ color: "#AEB6D4", fontWeight: 300 }}>
            Five quick steps. Babuu uses this to know your brand before you ask the first question.
          </p>
        </div>

        {/* Step indicators */}
        <div className="mb-10 flex items-center gap-0">
          {STEPS.map((s, i) => (
            <div key={s.id} className="flex items-center">
              <button
                onClick={() => s.id < step && setStep(s.id)}
                className="flex flex-col items-center gap-1.5"
                style={{ cursor: s.id < step ? "pointer" : "default" }}
              >
                <div
                  className="flex h-7 w-7 items-center justify-center rounded-full text-xs font-medium transition-all"
                  style={{
                    background: s.id === step ? "#E7C98A" : s.id < step ? "rgba(231,201,138,0.15)" : "rgba(174,182,212,0.08)",
                    border: `1px solid ${s.id === step ? "#E7C98A" : s.id < step ? "rgba(216,183,121,0.4)" : "rgba(174,182,212,0.2)"}`,
                    color: s.id === step ? "#070B1C" : s.id < step ? "#E7C98A" : "#AEB6D4",
                  }}
                >
                  {s.id < step ? <Check className="h-3.5 w-3.5" /> : s.id}
                </div>
                <span className="text-xs hidden sm:block" style={{ color: s.id === step ? "#E7C98A" : "#AEB6D4" }}>
                  {s.label}
                </span>
              </button>
              {i < STEPS.length - 1 && (
                <div className="mx-2 h-px w-8 sm:w-12" style={{ background: "rgba(174,182,212,0.15)" }} />
              )}
            </div>
          ))}
        </div>

        {/* Form steps */}
        <div
          className="rounded-md p-8"
          style={{ background: "#0E1530", border: "1px solid rgba(216,183,121,0.28)" }}
        >
          {step === 1 && <Step1 form={form} set={set} />}
          {step === 2 && <Step2 form={form} set={set} />}
          {step === 3 && <Step3 form={form} set={set} />}
          {step === 4 && <Step4 form={form} set={set} />}
          {step === 5 && <Step5 form={form} set={set} />}
        </div>

        {/* Error */}
        {error && (
          <p className="mt-4 text-sm text-red-400">{error}</p>
        )}

        {/* Navigation */}
        <div className="mt-6 flex items-center justify-between">
          <button
            onClick={back}
            className="flex items-center gap-1.5 text-sm transition-colors"
            style={{ color: step === 1 ? "transparent" : "#AEB6D4", pointerEvents: step === 1 ? "none" : "auto" }}
          >
            <ChevronLeft className="h-4 w-4" />
            Back
          </button>

          {step < 5 ? (
            <button
              onClick={next}
              disabled={!canProceed(step, form)}
              className="flex items-center gap-1.5 rounded-md px-5 py-2.5 text-sm font-medium transition-all"
              style={{
                background: canProceed(step, form) ? "#E7C98A" : "rgba(231,201,138,0.15)",
                color: canProceed(step, form) ? "#070B1C" : "#AEB6D4",
                cursor: canProceed(step, form) ? "pointer" : "not-allowed",
              }}
            >
              Continue
              <ChevronRight className="h-4 w-4" />
            </button>
          ) : (
            <button
              onClick={submit}
              disabled={saving || !canProceed(5, form)}
              className="flex items-center gap-1.5 rounded-md px-5 py-2.5 text-sm font-medium transition-all"
              style={{
                background: !saving && canProceed(5, form) ? "#E7C98A" : "rgba(231,201,138,0.15)",
                color: !saving && canProceed(5, form) ? "#070B1C" : "#AEB6D4",
                cursor: !saving && canProceed(5, form) ? "pointer" : "not-allowed",
              }}
            >
              {saving ? "Creating brand..." : "Create brand"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Step components ──────────────────────────────────────────

function Step1({ form, set }: { form: FormData; set: (f: keyof FormData, v: string | boolean) => void }) {
  return (
    <div className="flex flex-col gap-6">
      <StepHeader n={1} title="Brand identity" sub="The foundation Babuu builds every recommendation on." />

      <Field label="Brand name" required>
        <Input value={form.brand_name} onChange={(v) => set("brand_name", v)} placeholder="Geminel" />
      </Field>

      <Field label="Brand type" required>
        <div className="grid grid-cols-2 gap-2">
          {BRAND_TYPES.map((bt) => (
            <button
              key={bt.value}
              onClick={() => set("brand_type", bt.value)}
              className="rounded-md border p-3 text-left text-sm transition-all"
              style={{
                borderColor: form.brand_type === bt.value ? "#E7C98A" : "rgba(174,182,212,0.15)",
                background: form.brand_type === bt.value ? "rgba(231,201,138,0.08)" : "transparent",
              }}
            >
              <p style={{ color: form.brand_type === bt.value ? "#E7C98A" : "#EDEFF7", fontWeight: 400 }}>{bt.label}</p>
              <p className="mt-0.5 text-xs" style={{ color: "#AEB6D4" }}>{bt.desc}</p>
            </button>
          ))}
        </div>
      </Field>

      <Field label="Elevator pitch" sub="30 seconds. What you do, who you help, what changes.">
        <Textarea value={form.elevator_pitch} onChange={(v) => set("elevator_pitch", v)} placeholder="We help growth-stage B2B founders build content systems that generate inbound leads without paid ads." rows={3} />
      </Field>

      <Field label="Voice — tone descriptors" sub="Comma-separated words that define how this brand sounds.">
        <Input value={form.tone_descriptors} onChange={(v) => set("tone_descriptors", v)} placeholder="calm, certain, elevated, grounded" />
      </Field>

      <Field label="Voice — what to never do" sub="Patterns Babuu must avoid in every output.">
        <Input value={form.forbidden_patterns} onChange={(v) => set("forbidden_patterns", v)} placeholder="em-dashes, AI tells, hype language, jargon" />
      </Field>

      <label className="flex items-center gap-2.5 cursor-pointer">
        <input
          type="checkbox"
          checked={form.is_local}
          onChange={(e) => set("is_local", e.target.checked)}
          className="rounded"
          style={{ accentColor: "#E7C98A" }}
        />
        <span className="text-sm" style={{ color: "#AEB6D4" }}>This brand serves a specific geographic area (add local playbook layer)</span>
      </label>
    </div>
  );
}

function Step2({ form, set }: { form: FormData; set: (f: keyof FormData, v: string | boolean) => void }) {
  return (
    <div className="flex flex-col gap-6">
      <StepHeader n={2} title="Audience" sub="The specific person, not everyone. Babuu uses this to speak to the right human." />

      <Field label="Persona name" sub="Give them a name to make the person real.">
        <Input value={form.persona_name} onChange={(v) => set("persona_name", v)} placeholder="Sarah, the overwhelmed founder" />
      </Field>

      <Field label="Their situation" sub="The job they are hiring this brand to do.">
        <Input value={form.persona_situation} onChange={(v) => set("persona_situation", v)} placeholder="Running a 10-person SaaS company, responsible for all marketing" />
      </Field>

      <Field label="Their problem" required>
        <Textarea value={form.persona_problem} onChange={(v) => set("persona_problem", v)} placeholder="She knows she needs consistent content but has no system, no team, and no time to think strategically." rows={2} />
      </Field>

      <Field label="Their desired outcome" required>
        <Input value={form.persona_outcome} onChange={(v) => set("persona_outcome", v)} placeholder="Inbound leads from content without spending 20 hours a week on it" />
      </Field>

      <Field label="Search keywords they use" sub="Comma-separated. The words they type when looking for help.">
        <Input value={form.persona_keywords} onChange={(v) => set("persona_keywords", v)} placeholder="content strategy for SaaS, B2B content marketing, content without a team" />
      </Field>

      <Field label="Geographic focus" sub="Leave blank if not a local brand.">
        <Input value={form.geographic_focus} onChange={(v) => set("geographic_focus", v)} placeholder="Manila, Philippines / Philippines / Southeast Asia" />
      </Field>
    </div>
  );
}

function Step3({ form, set }: { form: FormData; set: (f: keyof FormData, v: string | boolean) => void }) {
  return (
    <div className="flex flex-col gap-6">
      <StepHeader n={3} title="Goals" sub="One primary focus per quarter. Babuu will route every recommendation toward this." />

      <Field label="Primary goal" required sub="Specific and measurable. One sentence.">
        <Textarea value={form.primary_goal} onChange={(v) => set("primary_goal", v)} placeholder="Generate 30 qualified inbound leads per month from organic content within 90 days." rows={2} />
      </Field>

      <Field label="Goal type" required>
        <div className="flex flex-wrap gap-2">
          {GOAL_TYPES.map((g) => (
            <button
              key={g.value}
              onClick={() => set("goal_type", g.value)}
              className="rounded-full border px-3 py-1.5 text-sm transition-all"
              style={{
                borderColor: form.goal_type === g.value ? "#E7C98A" : "rgba(174,182,212,0.2)",
                background: form.goal_type === g.value ? "rgba(231,201,138,0.08)" : "transparent",
                color: form.goal_type === g.value ? "#E7C98A" : "#AEB6D4",
              }}
            >
              {g.label}
            </button>
          ))}
        </div>
      </Field>

      <div className="grid grid-cols-2 gap-4">
        <Field label="Current stage focus">
          <Select value={form.current_stage_focus} onChange={(v) => set("current_stage_focus", v)} options={STAGES.map((s) => ({ value: String(s), label: `Stage ${s}: ${STAGE_NAMES[s]}` }))} />
        </Field>
        <Field label="Weakest stage (the leak)">
          <Select value={form.weakest_stage} onChange={(v) => set("weakest_stage", v)} options={STAGES.map((s) => ({ value: String(s), label: `Stage ${s}: ${STAGE_NAMES[s]}` }))} />
        </Field>
      </div>

      <div>
        <p className="mb-3 text-sm" style={{ color: "#AEB6D4" }}>Quarterly targets (set 0 if unknown)</p>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
          {[
            { key: "target_awareness",     label: "Awareness",     unit: "reach" },
            { key: "target_consideration", label: "Consideration", unit: "engagements" },
            { key: "target_conversion",    label: "Conversion",    unit: "leads" },
            { key: "target_loyalty",       label: "Loyalty",       unit: "% retention" },
            { key: "target_advocacy",      label: "Advocacy",      unit: "referrals" },
          ].map((t) => (
            <div key={t.key}>
              <label className="mb-1 block text-xs" style={{ color: "#AEB6D4" }}>{t.label}</label>
              <Input
                value={form[t.key as keyof FormData] as string}
                onChange={(v) => set(t.key as keyof FormData, v)}
                placeholder="0"
                type="number"
              />
              <p className="mt-1 text-xs" style={{ color: "rgba(174,182,212,0.5)" }}>{t.unit}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function Step4({ form, set }: { form: FormData; set: (f: keyof FormData, v: string | boolean) => void }) {
  return (
    <div className="flex flex-col gap-6">
      <StepHeader n={4} title="Positioning" sub="Why this brand over every alternative. Babuu uses this to sharpen every recommendation." />

      <Field label="Positioning statement" required sub="Why this brand, why now, why not the competition.">
        <Textarea value={form.positioning_statement} onChange={(v) => set("positioning_statement", v)} placeholder="The only marketing studio in Southeast Asia that builds systems before it builds content — so brands grow without burning out." rows={3} />
      </Field>

      <Field label="Core differentiator" required sub="One thing that is genuinely different.">
        <Input value={form.core_differentiator} onChange={(v) => set("core_differentiator", v)} placeholder="We use the Geminel Growth Engine — a five-stage framework that diagnoses before it prescribes." />
      </Field>

      <Field label="Market category">
        <Input value={form.market_category} onChange={(v) => set("market_category", v)} placeholder="Marketing studio / B2B SaaS / D2C skincare / Personal coaching" />
      </Field>

      <Field label="Biggest current leak" sub="Which stage is losing the most people and why?">
        <Textarea value={form.biggest_leak} onChange={(v) => set("biggest_leak", v)} placeholder="Stage 2 to 3: Profile visitors don't convert to follows or inquiries. The bio doesn't clearly state what we do or who it's for." rows={2} />
      </Field>
    </div>
  );
}

function Step5({ form, set }: { form: FormData; set: (f: keyof FormData, v: string | boolean) => void }) {
  const TZ = ["UTC", "Asia/Manila", "America/New_York", "America/Los_Angeles", "Europe/London", "Asia/Singapore", "Australia/Sydney"];
  return (
    <div className="flex flex-col gap-6">
      <StepHeader n={5} title="Channels" sub="Where the brand lives. You can add API integrations later." />

      <Field label="Website domain">
        <Input value={form.primary_domain} onChange={(v) => set("primary_domain", v)} placeholder="geminel.co" />
      </Field>

      <div className="grid grid-cols-3 gap-3">
        <Field label="Instagram handle">
          <Input value={form.instagram_handle} onChange={(v) => set("instagram_handle", v)} placeholder="@geminel" />
        </Field>
        <Field label="TikTok handle">
          <Input value={form.tiktok_handle} onChange={(v) => set("tiktok_handle", v)} placeholder="@geminel" />
        </Field>
        <Field label="LinkedIn">
          <Input value={form.linkedin_handle} onChange={(v) => set("linkedin_handle", v)} placeholder="company/geminel" />
        </Field>
      </div>

      <Field label="Contact email" sub="For weekly reports and Babuu alerts.">
        <Input value={form.contact_email} onChange={(v) => set("contact_email", v)} placeholder="ella@geminel.co" type="email" />
      </Field>

      <Field label="Timezone">
        <Select value={form.timezone} onChange={(v) => set("timezone", v)} options={TZ.map((tz) => ({ value: tz, label: tz }))} />
      </Field>
    </div>
  );
}

// ── Shared components ────────────────────────────────────────

function StepHeader({ n, title, sub }: { n: number; title: string; sub: string }) {
  return (
    <div className="mb-2">
      <div className="eyebrow mb-1">Step {n} of 5</div>
      <h2 style={{ fontFamily: "Fraunces, Georgia, serif", fontWeight: 300, fontSize: 22, color: "#EDEFF7" }}>{title}</h2>
      <p className="mt-1 text-sm" style={{ color: "#AEB6D4", fontWeight: 300 }}>{sub}</p>
    </div>
  );
}

function Field({ label, sub, required, children }: { label: string; sub?: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-1.5 block text-sm" style={{ color: "#EDEFF7", fontWeight: 400 }}>
        {label}
        {required && <span style={{ color: "#E7C98A", marginLeft: 4 }}>*</span>}
      </label>
      {sub && <p className="mb-2 text-xs" style={{ color: "#AEB6D4" }}>{sub}</p>}
      {children}
    </div>
  );
}

function Input({ value, onChange, placeholder, type = "text" }: { value: string; onChange: (v: string) => void; placeholder?: string; type?: string }) {
  return (
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full rounded-md border px-3 py-2.5 text-sm outline-none transition-colors"
      style={{
        background: "rgba(7,11,28,0.6)",
        borderColor: "rgba(174,182,212,0.2)",
        color: "#EDEFF7",
        fontWeight: 300,
      }}
      onFocus={(e) => { e.currentTarget.style.borderColor = "rgba(216,183,121,0.55)"; }}
      onBlur={(e) => { e.currentTarget.style.borderColor = "rgba(174,182,212,0.2)"; }}
    />
  );
}

function Textarea({ value, onChange, placeholder, rows = 3 }: { value: string; onChange: (v: string) => void; placeholder?: string; rows?: number }) {
  return (
    <textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      rows={rows}
      className="w-full rounded-md border px-3 py-2.5 text-sm outline-none transition-colors resize-none"
      style={{
        background: "rgba(7,11,28,0.6)",
        borderColor: "rgba(174,182,212,0.2)",
        color: "#EDEFF7",
        fontWeight: 300,
        lineHeight: 1.6,
      }}
      onFocus={(e) => { e.currentTarget.style.borderColor = "rgba(216,183,121,0.55)"; }}
      onBlur={(e) => { e.currentTarget.style.borderColor = "rgba(174,182,212,0.2)"; }}
    />
  );
}

function Select({ value, onChange, options }: { value: string; onChange: (v: string) => void; options: { value: string; label: string }[] }) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full rounded-md border px-3 py-2.5 text-sm outline-none"
      style={{
        background: "#0E1530",
        borderColor: "rgba(174,182,212,0.2)",
        color: "#EDEFF7",
        fontWeight: 300,
      }}
    >
      {options.map((o) => (
        <option key={o.value} value={o.value} style={{ background: "#0E1530" }}>{o.label}</option>
      ))}
    </select>
  );
}

function canProceed(step: number, form: FormData): boolean {
  if (step === 1) return !!(form.brand_name && form.brand_type);
  if (step === 2) return !!(form.persona_problem && form.persona_outcome);
  if (step === 3) return !!(form.primary_goal && form.goal_type);
  if (step === 4) return !!(form.positioning_statement && form.core_differentiator);
  if (step === 5) return !!(form.contact_email);
  return true;
}

function GuidingPairMark({ size = 24 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" aria-hidden="true" style={{ flexShrink: 0 }}>
      <g fill="none" stroke="#E7C98A" strokeWidth="1.4" strokeLinejoin="round" filter="drop-shadow(0 0 6px rgba(231,201,138,0.5))">
        <path d="M38 30 L41.5 44 L55 47.5 L41.5 51 L38 65 L34.5 51 L21 47.5 L34.5 44 Z" />
      </g>
      <g fill="#E7C98A" opacity="0.95">
        <path d="M66 44 L68.4 53 L77 55.4 L68.4 57.8 L66 67 L63.6 57.8 L55 55.4 L63.6 53 Z" />
      </g>
    </svg>
  );
}

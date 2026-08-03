"use client";

import { buildInsights } from "@/lib/finance/analytics";
import type { FinanceState } from "@/lib/finance/types";
import { Card, SectionTitle } from "./ui";

const TONE = {
  alert: { ring: "border-[#F09A9A]/35", dot: "#F09A9A", label: "Act now" },
  warn: { ring: "border-gold/35", dot: "#E7C98A", label: "Watch" },
  good: { ring: "border-[#6EC4A0]/35", dot: "#6EC4A0", label: "On track" },
  info: { ring: "border-white/10", dot: "#7C82D4", label: "Context" },
} as const;

export function Insights({ state }: { state: FinanceState }) {
  const insights = buildInsights(state);

  return (
    <div>
      <SectionTitle hint={`${insights.length} findings`}>What the numbers say</SectionTitle>
      <div className="flex flex-col gap-3">
        {insights.map((i) => {
          const tone = TONE[i.tone];
          return (
            <Card key={i.id} className={tone.ring}>
              <div className="mb-1.5 flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full" style={{ background: tone.dot }} />
                <span className="text-[10px] uppercase tracking-wider text-mist/80">{tone.label}</span>
              </div>
              <h3 className="font-serif text-base leading-snug text-cloud">{i.title}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-mist">{i.body}</p>
            </Card>
          );
        })}
      </div>

      <SectionTitle>The plan</SectionTitle>
      <Card>
        <ol className="flex flex-col gap-3 text-sm text-mist">
          {[
            "Name the unlabeled lines. Several thousand pesos have no merchant attached. Do this while you still remember the week.",
            "Enter every debt balance and APR under Debts. You are paying five lenders at once — you cannot prioritise without the rates.",
            "Put your monthly income into Settings. Until then no number here can tell you whether the burn is affordable.",
            "Set one flexible-spending ceiling and hold it. Shopping, food and family transfers are where a cut is actually available.",
            "Open a separate sinking fund for events. The birthday was a fifth of the period; the next one should be pre-funded, not absorbed.",
          ].map((step, i) => (
            <li key={i} className="flex gap-3">
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-gold/12 text-[11px] text-gold">
                {i + 1}
              </span>
              <span className="leading-relaxed">{step}</span>
            </li>
          ))}
        </ol>
      </Card>
    </div>
  );
}

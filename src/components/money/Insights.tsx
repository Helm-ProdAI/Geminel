"use client";

import { buildInsights, peso, summarize } from "@/lib/finance/analytics";
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
  const s = summarize(state);

  // The plan reflects what is still missing, so finished steps drop off.
  const steps = [
    s.unlabeled > 0 &&
      `Name the ${peso(s.unlabeled)} of unlabeled lines. You cannot cut spending you cannot see, and the memory fades fast.`,
    state.debts.some((d) => d.balance <= 0 || d.apr === undefined) &&
      "Enter every debt balance and APR under Debts. You are paying several lenders at once — you cannot prioritise without the rates.",
    s.monthlyIncome <= 0 && "Log your income so the run-rate has something to be measured against.",
    s.monthlySurplus !== null &&
      s.monthlySurplus < 0 &&
      `Close the ${peso(Math.abs(s.monthlySurplus))} monthly gap. Flexible spending is ${peso(
        s.flexible
      )} of this period — that is where the room is.`,
    s.monthlySurplus !== null &&
      s.monthlySurplus > 0 &&
      `Automate the ${peso(
        s.monthlySurplus
      )} surplus on payday. A surplus you have to remember to save is a surplus that gets spent.`,
    "Set one flexible-spending ceiling and hold it. Shopping, food and family transfers are where a cut is actually available.",
    s.birthday > 0 &&
      "Open a separate sinking fund for events. The birthday was a quarter of the period; the next one should be pre-funded, not absorbed.",
    s.capitalReturned > 0 &&
      `Give the ${peso(
        s.capitalReturned
      )} paluwagan a job today — a balance it clears or a fund it starts. A lump sum with no job attached quietly becomes ordinary spending.`,
    "Keep the dollar rate current in the Income tab. You earn in USD and spend in PHP, so that one number moves everything.",
  ].filter((x): x is string => typeof x === "string");

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
          {steps.map((step, i) => (
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

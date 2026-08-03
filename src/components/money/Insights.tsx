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

  // Short, ordered, and only what is still undone.
  const steps = [
    "Buy life insurance this week. Plain term, not investment-linked. Six kids and none right now.",
    s.nextPayout &&
      `Decide now what the ${peso(s.nextPayout.payout)} paluwagan payout is for, before it arrives.`,
    s.inCollections > 0 && "Write down every old debt: who, how much, their reference number. One page.",
    s.inCollections > 0 && "Email each one. Ask what they will accept to close the account for good. Get it in writing.",
    s.inCollections > 0 && "Pay off the settled ones, biggest discount first. Use a bank account your salary does not go into.",
    "Ask a lawyer to read the condo contract before March 2027. You may get half your payments back.",
    "Once the debt is gone, save first and spend after. Move the money the day you get paid.",
  ].filter((x): x is string => typeof x === "string");

  return (
    <div>
      <SectionTitle hint={`${insights.length}`}>Where you stand</SectionTitle>
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

      <SectionTitle hint="In order">Do these</SectionTitle>
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

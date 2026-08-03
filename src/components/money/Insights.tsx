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
    s.inCollections > 0 &&
      `List every collections account with the agency name, reference number and last contact date. ${peso(
        s.inCollections
      )} across ${s.collectionsCount} accounts cannot be negotiated until it is one document.`,
    s.inCollections > 0 &&
      "Ask each agency for a written statement of account before paying anything. Verbal balances on defaulted debt are frequently wrong and always unenforceable.",
    s.inCollections > 0 &&
      "Open settlement talks on the largest accounts first, offering a lump sum against a written release. Never pay from an account you also receive income into.",
    s.monthlySurplus !== null &&
      s.monthlySurplus > 0 &&
      s.monthlySurplus < s.monthlyIncome * 0.1 &&
      `Your slack is only ${peso(
        s.monthlySurplus
      )} a month. Find the cuts inside the ${peso(s.fixedMonthly)} of living costs before promising anyone a payment plan.`,
    state.debts.some((d) => d.status === "rolling" && d.apr === undefined) &&
      "Get the APR on every rolling account. Some of what you are servicing is certainly more expensive than the rest, and right now you cannot tell which.",
    s.unlabeled > 0 &&
      `Name the ${peso(s.unlabeled)} of unlabeled spending. Small next to the collections figure, but it is the part you control this week.`,
    s.capitalReturned > 0 &&
      `Do not spend the ${peso(
        s.capitalReturned
      )} paluwagan on living costs. Against this debt position it is settlement money, and it is the only lump sum you have.`,
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

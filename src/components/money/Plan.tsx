"use client";

import { peso, summarize } from "@/lib/finance/analytics";
import type { AllocationKind, FinanceState, PlanMonth } from "@/lib/finance/types";
import { Bar, Card, SectionTitle } from "./ui";

const KIND = {
  debt: { color: "#E7C98A", label: "Debt" },
  safety: { color: "#6EC4A0", label: "Safety" },
  goal: { color: "#7C82D4", label: "Goal" },
  buffer: { color: "#8FA3C8", label: "Life" },
} as const satisfies Record<AllocationKind, { color: string; label: string }>;

interface Props {
  state: FinanceState;
  onToggle: (id: string, done: boolean) => void;
}

export function Plan({ state, onToggle }: Props) {
  const s = summarize(state);
  const surplus = s.monthlySurplus ?? 0;
  const monthTotal = (m: PlanMonth) => m.allocations.reduce((a, x) => a + x.amount, 0);

  const totalIn = state.plan.reduce((a, m) => a + surplus + m.payout, 0);
  const byKind = (k: AllocationKind) =>
    state.plan.reduce((a, m) => a + m.allocations.filter((x) => x.kind === k).reduce((b, x) => b + x.amount, 0), 0);
  const done = state.plan.filter((m) => m.done).length;

  const settlementFund = state.plan.reduce(
    (a, m) => a + m.allocations.filter((x) => /settlement/i.test(x.label)).reduce((b, x) => b + x.amount, 0),
    0
  );

  return (
    <div>
      <Card className="border-gold/25 bg-gradient-to-br from-ink/90 to-midnight/80">
        <span className="text-[11px] uppercase tracking-wider text-champagne">Six months, planned</span>
        <div className="mt-1 font-serif text-3xl text-gold">{peso(totalIn)}</div>
        <p className="mt-1 text-xs text-mist">
          {peso(surplus)} a month plus {peso(totalIn - surplus * state.plan.length)} of paluwagan landing inside the
          window.
        </p>
        <div className="mt-3">
          <Bar value={done / state.plan.length} color="#6EC4A0" />
        </div>
        <p className="mt-2 text-xs text-mist">
          {done} of {state.plan.length} months done. Tick each one off as you finish it.
        </p>
      </Card>

      <div className="mt-3 grid grid-cols-2 gap-3">
        {(["debt", "safety", "goal", "buffer"] as const).map((k) => (
          <Card key={k} className="flex flex-col gap-1">
            <span className="text-[11px] uppercase tracking-wider text-mist/80">{KIND[k].label}</span>
            <span className="font-serif text-xl" style={{ color: KIND[k].color }}>
              {peso(byKind(k), { compact: true })}
            </span>
            <span className="text-[11px] text-mist">{((byKind(k) / totalIn) * 100).toFixed(0)}% of the six months</span>
          </Card>
        ))}
      </div>

      <SectionTitle hint="Tap to tick off">Month by month</SectionTitle>

      <div className="flex flex-col gap-2">
        {state.plan.map((m) => {
          const avail = surplus + m.payout;
          const planned = monthTotal(m);
          const drift = Math.abs(planned - avail) > 1;
          return (
            <Card key={m.id} className={`p-4 ${m.done ? "opacity-60" : ""}`}>
              <button
                type="button"
                onClick={() => onToggle(m.id, !m.done)}
                className="flex w-full items-baseline justify-between gap-3 text-left"
              >
                <span className="flex items-center gap-2.5">
                  <span
                    className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border text-[10px] ${
                      m.done ? "border-[#6EC4A0] bg-[#6EC4A0] text-deep" : "border-white/25 text-transparent"
                    }`}
                  >
                    ✓
                  </span>
                  <span className="font-serif text-base text-cloud">{m.month}</span>
                </span>
                <span className="shrink-0 text-xs tabular-nums text-mist">
                  {peso(avail, { compact: true })}
                  {m.payout > 0 ? ` · +${peso(m.payout, { compact: true })} payout` : ""}
                </span>
              </button>

              <div className="mt-3 flex flex-col gap-2.5">
                {m.allocations.map((a, i) => (
                  <div key={i}>
                    <div className="mb-1 flex items-baseline justify-between gap-2">
                      <span className="flex min-w-0 items-center gap-2 text-sm text-cloud">
                        <span
                          className="h-2 w-2 shrink-0 rounded-full"
                          style={{ background: KIND[a.kind].color }}
                        />
                        <span className="truncate">{a.label}</span>
                      </span>
                      <span className="shrink-0 text-sm tabular-nums text-mist">{peso(a.amount)}</span>
                    </div>
                    <Bar value={a.amount / avail} color={KIND[a.kind].color} />
                  </div>
                ))}
              </div>

              {drift ? (
                <p className="mt-2.5 text-[11px] text-[#F09A9A]">
                  Allocations come to {peso(planned)} against {peso(avail)} available — {peso(Math.abs(planned - avail))}{" "}
                  {planned > avail ? "over" : "unspent"}. Your surplus has changed since the plan was written.
                </p>
              ) : null}
            </Card>
          );
        })}
      </div>

      <SectionTitle>Where this gets you</SectionTitle>
      <Card>
        <ul className="flex flex-col gap-3 text-sm text-mist">
          {[
            ["Cards", "The ₱150k paluwagan clears most in August; the rest by September. Then never used again."],
            ["Insurance", "In place in month one, before anything else."],
            ["Emergency fund", `${peso(byKind("safety"))} by October — about a month of everything.`],
            [
              "Settlement fund",
              `${peso(settlementFund)} by end of January. Enough to settle all ${
                s.collectionsCount
              } collections accounts at anything up to ${((settlementFund / s.inCollections) * 100).toFixed(
                0
              )}% of face value.`,
            ],
            ["Loans", "Atome and MAC finish inside the window. Tonik has 11 payments left."],
          ].map(([k, v]) => (
            <li key={k} className="flex flex-col gap-0.5">
              <span className="text-cloud">{k}</span>
              <span className="leading-relaxed">{v}</span>
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}

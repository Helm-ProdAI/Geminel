"use client";

import { Cell, Pie, PieChart, ResponsiveContainer } from "recharts";
import { categoryTotals, peso, summarize } from "@/lib/finance/analytics";
import type { FinanceState } from "@/lib/finance/types";
import { Bar, Card, SectionTitle, Stat } from "./ui";

export function Overview({ state }: { state: FinanceState }) {
  const s = summarize(state);
  const cats = categoryTotals(state.transactions);
  const flexShare = s.total > 0 ? s.flexible / s.total : 0;

  return (
    <div>
      <Card className="border-gold/25 bg-gradient-to-br from-ink/90 to-midnight/80">
        <span className="text-[11px] uppercase tracking-wider text-champagne">
          {new Date(state.settings.periodStart).toLocaleDateString("en-PH", { month: "short", day: "numeric" })} —{" "}
          {new Date(state.settings.periodEnd).toLocaleDateString("en-PH", { month: "short", day: "numeric" })}
        </span>
        <div className="mt-1 font-serif text-4xl text-gold">{peso(s.total)}</div>
        <div className="mt-1 text-sm text-mist">
          {s.count} transactions · {peso(s.perDay)} a day
        </div>
      </Card>

      {s.monthlyIncome > 0 ? (
        <Card className="mt-3">
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="text-[11px] uppercase tracking-wider text-mist/80">Income</div>
              <div className="whitespace-nowrap font-serif text-xl text-[#6EC4A0]">
                {peso(s.monthlyIncome, { compact: true })}
              </div>
            </div>
            <div>
              <div className="text-[11px] uppercase tracking-wider text-mist/80">Run-rate</div>
              <div className="whitespace-nowrap font-serif text-xl text-cloud">
                {peso(s.projectedMonth, { compact: true })}
              </div>
            </div>
            <div className="text-right">
              <div className="text-[11px] uppercase tracking-wider text-mist/80">Surplus</div>
              <div
                className={`whitespace-nowrap font-serif text-xl ${
                  (s.monthlySurplus ?? 0) >= 0 ? "text-[#6EC4A0]" : "text-[#F09A9A]"
                }`}
              >
                {(s.monthlySurplus ?? 0) >= 0 ? "+" : "−"}
                {peso(Math.abs(s.monthlySurplus ?? 0), { compact: true })}
              </div>
            </div>
          </div>
          <p className="mt-2.5 border-t border-white/8 pt-2.5 text-xs text-mist">
            Per month. Your own sources are {peso(s.monthlyIncomeMine)} of the {peso(s.monthlyIncome)} household
            total{s.capitalReturned > 0 ? `, and the ${peso(s.capitalReturned)} paluwagan sits outside both` : ""}.
          </p>
        </Card>
      ) : null}

      <div className="mt-3 grid grid-cols-2 gap-3">
        <Stat label="Debt paid" value={peso(s.debtPaid)} sub={`${((s.debtPaid / s.total) * 100).toFixed(0)}% of spend`} />
        <Stat
          label="Won’t repeat"
          value={peso(s.oneOff)}
          sub={`${((s.oneOff / s.total) * 100).toFixed(0)}% of spend`}
        />
        <Stat label="Repeating burn" value={peso(s.recurringBurn)} sub="Excludes one-offs" />
        <Stat
          label="Monthly run-rate"
          value={peso(s.projectedMonth)}
          sub="Each line on its own rhythm"
          tone={s.monthlySurplus !== null && s.monthlySurplus < 0 ? "alert" : "default"}
        />
      </div>

      {s.savingsRate !== null ? (
        <Card className="mt-3">
          <div className="flex items-baseline justify-between">
            <span className="text-[11px] uppercase tracking-wider text-mist/80">Savings rate</span>
            <span className={s.savingsRate < 0 ? "font-serif text-xl text-[#F09A9A]" : "font-serif text-xl text-gold"}>
              {(s.savingsRate * 100).toFixed(0)}%
            </span>
          </div>
          <div className="mt-2">
            <Bar value={Math.max(0, s.savingsRate)} color={s.savingsRate < 0.2 ? "#F09A9A" : "#6EC4A0"} />
          </div>
          <p className="mt-2 text-xs text-mist">
            Run-rate {peso(s.projectedMonth)} against {peso(s.monthlyIncome)} of income that repeats
            {s.incomeIsOverride ? " (set manually)" : ""}. Target is 20% or better.
          </p>
        </Card>
      ) : (
        <Card className="mt-3 border-gold/30">
          <p className="text-sm text-cloud">Add your income</p>
          <p className="mt-1 text-xs text-mist">
            Log what comes in on the Income ledger, or set a figure in Settings. Without it this app can show what
            you spent, but not whether you can afford it.
          </p>
        </Card>
      )}

      <SectionTitle hint={`${cats.length} categories`}>Where it went</SectionTitle>
      <Card>
        <div className="flex items-center gap-4">
          <div className="h-28 w-28 shrink-0">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={cats} dataKey="total" innerRadius={30} outerRadius={54} paddingAngle={2} stroke="none">
                  {cats.map((c) => (
                    <Cell key={c.id} fill={c.color} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-[11px] uppercase tracking-wider text-mist/80">Discretionary</div>
            <div className="font-serif text-2xl text-cloud">{(flexShare * 100).toFixed(0)}%</div>
            <div className="text-xs text-mist">
              {peso(s.flexible)} of {peso(s.total)} was spending you chose rather than owed.
            </div>
          </div>
        </div>

        <div className="mt-4 flex flex-col gap-3">
          {cats.map((c) => (
            <div key={c.id}>
              <div className="mb-1 flex items-baseline justify-between gap-2">
                <span className="flex min-w-0 items-center gap-2 text-sm text-cloud">
                  <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: c.color }} />
                  <span className="truncate">{c.label}</span>
                  {c.flexible ? (
                    <span className="shrink-0 rounded border border-white/10 px-1 text-[9px] uppercase tracking-wide text-mist/70">
                      flex
                    </span>
                  ) : null}
                </span>
                <span className="shrink-0 text-sm tabular-nums text-mist">{peso(c.total)}</span>
              </div>
              <Bar value={c.share} color={c.color} />
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

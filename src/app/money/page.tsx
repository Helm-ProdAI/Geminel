"use client";

import { useState } from "react";
import { Commitments } from "@/components/money/Commitments";
import { Debts } from "@/components/money/Debts";
import { Goals } from "@/components/money/Goals";
import { IncomeList } from "@/components/money/IncomeList";
import { Insights } from "@/components/money/Insights";
import { Overview } from "@/components/money/Overview";
import { Transactions } from "@/components/money/Transactions";
import { Button, Card, Field, Input, SectionTitle } from "@/components/money/ui";
import { peso, summarize } from "@/lib/finance/analytics";
import { useFinance } from "@/lib/finance/store";

const TABS = [
  { id: "overview", label: "Overview" },
  { id: "transactions", label: "Ledger" },
  { id: "debts", label: "Debts" },
  { id: "goals", label: "Goals" },
  { id: "insights", label: "Advice" },
] as const;

type TabId = (typeof TABS)[number]["id"];

export default function MoneyPage() {
  const f = useFinance();
  const [tab, setTab] = useState<TabId>("overview");
  const [ledgerSide, setLedgerSide] = useState<"out" | "in" | "monthly">("monthly");
  const [settingsOpen, setSettingsOpen] = useState(false);

  return (
    <main className="mx-auto min-h-screen w-full max-w-lg bg-deep px-4 pb-28 pt-6">
      <header className="mb-5 flex items-start justify-between gap-3">
        <div>
          <h1 className="font-serif text-2xl text-cloud">Money</h1>
          <p className="text-xs text-mist">Personal ledger · PHP</p>
        </div>
        <Button variant="ghost" className="shrink-0 px-3 py-2" onClick={() => setSettingsOpen((v) => !v)}>
          {settingsOpen ? "Done" : "Settings"}
        </Button>
      </header>

      {settingsOpen ? <SettingsPanel f={f} /> : null}

      {!f.hydrated ? (
        <p className="py-16 text-center text-sm text-mist">Loading your ledger…</p>
      ) : (
        <>
          {tab === "overview" && <Overview state={f.state} />}
          {tab === "transactions" && (
            <>
              <div className="mb-4 flex rounded-xl border border-white/10 p-1">
                {(["monthly", "out", "in"] as const).map((side) => (
                  <button
                    key={side}
                    type="button"
                    onClick={() => setLedgerSide(side)}
                    className={`flex-1 rounded-lg py-2 text-sm transition ${
                      ledgerSide === side ? "bg-gold/12 text-gold" : "text-mist"
                    }`}
                  >
                    {side === "monthly" ? "Monthly" : side === "out" ? "Spending" : "Income"}
                  </button>
                ))}
              </div>
              {ledgerSide === "monthly" ? (
                <Commitments
                  commitments={f.state.commitments}
                  monthlyIncome={summarize(f.state).monthlyIncome}
                  onAdd={f.addCommitment}
                  onUpdate={f.updateCommitment}
                  onRemove={f.removeCommitment}
                />
              ) : ledgerSide === "out" ? (
                <Transactions
                  transactions={f.state.transactions}
                  periodStart={f.state.settings.periodStart}
                  onAdd={f.addTransaction}
                  onUpdate={f.updateTransaction}
                  onRemove={f.removeTransaction}
                />
              ) : (
                <IncomeList
                  income={f.state.income}
                  settings={f.state.settings}
                  onAdd={f.addIncome}
                  onUpdate={f.updateIncome}
                  onRemove={f.removeIncome}
                  onRateChange={(usdPhpRate) => f.updateSettings({ usdPhpRate })}
                />
              )}
            </>
          )}
          {tab === "debts" && (
            <Debts debts={f.state.debts} onAdd={f.addDebt} onUpdate={f.updateDebt} onRemove={f.removeDebt} />
          )}
          {tab === "goals" && (
            <Goals state={f.state} onAdd={f.addGoal} onUpdate={f.updateGoal} onRemove={f.removeGoal} />
          )}
          {tab === "insights" && <Insights state={f.state} />}
        </>
      )}

      <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-white/10 bg-deep/95 backdrop-blur">
        <div className="mx-auto flex w-full max-w-lg justify-between px-2 pb-[env(safe-area-inset-bottom)]">
          {TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={`flex-1 py-3 text-[11px] font-medium transition ${
                tab === t.id ? "text-gold" : "text-mist/70"
              }`}
            >
              <span
                className={`mx-auto mb-1.5 block h-0.5 w-6 rounded-full transition ${
                  tab === t.id ? "bg-gold" : "bg-transparent"
                }`}
              />
              {t.label}
            </button>
          ))}
        </div>
      </nav>
    </main>
  );
}

function SettingsPanel({ f }: { f: ReturnType<typeof useFinance> }) {
  const { settings } = f.state;

  return (
    <Card className="mb-5 border-gold/25">
      <SectionTitle>Settings</SectionTitle>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Income override">
          <Input
            type="number"
            inputMode="decimal"
            value={settings.monthlyIncome || ""}
            placeholder="From Income ledger"
            onChange={(e) => f.updateSettings({ monthlyIncome: Number(e.target.value) || 0 })}
          />
        </Field>
        <Field label="Monthly flex budget">
          <Input
            type="number"
            inputMode="decimal"
            value={settings.monthlyBudget || ""}
            placeholder="0.00"
            onChange={(e) => f.updateSettings({ monthlyBudget: Number(e.target.value) || 0 })}
          />
        </Field>
        <Field label="Period start">
          <Input
            type="date"
            value={settings.periodStart}
            onChange={(e) => f.updateSettings({ periodStart: e.target.value })}
          />
        </Field>
        <Field label="Period end">
          <Input
            type="date"
            value={settings.periodEnd}
            onChange={(e) => f.updateSettings({ periodEnd: e.target.value })}
          />
        </Field>
      </div>

      <p className="mt-3 text-[11px] leading-relaxed text-mist/80">
        Everything is stored on this device only — nothing is uploaded. Total logged:{" "}
        {peso(f.state.transactions.reduce((s, t) => s + t.amount, 0))}.
      </p>

      <div className="mt-3 flex gap-2">
        <Button
          variant="ghost"
          className="flex-1"
          onClick={() => {
            const blob = new Blob([f.exportJson()], { type: "application/json" });
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `money-${new Date().toISOString().slice(0, 10)}.json`;
            a.click();
            URL.revokeObjectURL(url);
          }}
        >
          Export JSON
        </Button>
        <Button
          variant="danger"
          className="flex-1"
          onClick={() => {
            if (confirm("Reset to the original ledger? Any edits you made will be lost.")) f.resetToSeed();
          }}
        >
          Reset
        </Button>
      </div>
    </Card>
  );
}

"use client";

import { useMemo, useState } from "react";
import { peso } from "@/lib/finance/analytics";
import type { Debt } from "@/lib/finance/types";
import { Bar, Button, Card, Field, Input, SectionTitle, Stat } from "./ui";

interface Props {
  debts: Debt[];
  onAdd: (d: Omit<Debt, "id">) => void;
  onUpdate: (id: string, patch: Partial<Debt>) => void;
  onRemove: (id: string) => void;
}

export function Debts({ debts, onAdd, onUpdate, onRemove }: Props) {
  const [open, setOpen] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [name, setName] = useState("");

  const totalBalance = debts.reduce((s, d) => s + d.balance, 0);
  const totalPaid = debts.reduce((s, d) => s + d.paidThisPeriod, 0);
  const missingBalances = debts.filter((d) => d.balance <= 0).length;

  /** Avalanche order: highest APR first, then largest balance. Unknown rates sink. */
  const ordered = useMemo(
    () =>
      [...debts].sort((a, b) => {
        const ar = a.apr ?? -1;
        const br = b.apr ?? -1;
        if (ar !== br) return br - ar;
        return b.balance - a.balance;
      }),
    [debts]
  );

  return (
    <div>
      <div className="grid grid-cols-2 gap-3">
        <Stat label="Known balances" value={peso(totalBalance)} sub={`${debts.length} accounts`} tone="alert" />
        <Stat label="Paid this period" value={peso(totalPaid)} sub="From your ledger" tone="gold" />
      </div>

      {missingBalances > 0 ? (
        <Card className="mt-3 border-gold/30">
          <p className="text-sm text-cloud">
            {missingBalances} of {debts.length} accounts have no balance yet
          </p>
          <p className="mt-1 text-xs text-mist">
            Your ledger showed payments, not balances. Pull up each statement and enter the outstanding amount and
            interest rate — until then the payoff order below is a guess.
          </p>
        </Card>
      ) : null}

      <SectionTitle hint="Highest rate first">Payoff order</SectionTitle>
      <p className="-mt-1 mb-3 text-xs text-mist">
        Pay the minimum on everything, then throw every spare peso at the top account. It clears debt faster than
        splitting payments evenly, because interest compounds hardest at the top.
      </p>

      <div className="flex flex-col gap-2">
        {ordered.map((d, i) => {
          const isOpen = open === d.id;
          const progress = d.balance + d.paidThisPeriod > 0 ? d.paidThisPeriod / (d.balance + d.paidThisPeriod) : 0;
          return (
            <Card key={d.id} className="p-3">
              <button
                type="button"
                onClick={() => setOpen(isOpen ? null : d.id)}
                className="flex w-full items-center gap-3 text-left"
              >
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gold/12 text-xs text-gold">
                  {i + 1}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm text-cloud">{d.name}</span>
                  <span className="block text-xs text-mist">
                    {d.apr ? `${d.apr}% APR` : "rate unknown"} · paid {peso(d.paidThisPeriod)}
                  </span>
                </span>
                <span className="shrink-0 text-right text-sm tabular-nums text-cloud">
                  {d.balance > 0 ? peso(d.balance) : "—"}
                </span>
              </button>

              {d.balance > 0 ? (
                <div className="mt-2">
                  <Bar value={progress} color="#E7C98A" />
                </div>
              ) : null}
              {d.note ? <p className="mt-2 text-[11px] text-mist/80">{d.note}</p> : null}

              {isOpen ? (
                <div className="mt-3 grid grid-cols-2 gap-3 border-t border-white/8 pt-3">
                  <Field label="Name">
                    <Input value={d.name} onChange={(e) => onUpdate(d.id, { name: e.target.value })} />
                  </Field>
                  <Field label="Balance">
                    <Input
                      type="number"
                      inputMode="decimal"
                      value={d.balance || ""}
                      placeholder="0.00"
                      onChange={(e) => onUpdate(d.id, { balance: Number(e.target.value) || 0 })}
                    />
                  </Field>
                  <Field label="APR %">
                    <Input
                      type="number"
                      inputMode="decimal"
                      value={d.apr ?? ""}
                      placeholder="e.g. 36"
                      onChange={(e) =>
                        onUpdate(d.id, { apr: e.target.value === "" ? undefined : Number(e.target.value) })
                      }
                    />
                  </Field>
                  <Field label="Paid this period">
                    <Input
                      type="number"
                      inputMode="decimal"
                      value={d.paidThisPeriod || ""}
                      onChange={(e) => onUpdate(d.id, { paidThisPeriod: Number(e.target.value) || 0 })}
                    />
                  </Field>
                  <div className="col-span-2">
                    <Button variant="danger" className="w-full" onClick={() => onRemove(d.id)}>
                      Remove account
                    </Button>
                  </div>
                </div>
              ) : null}
            </Card>
          );
        })}
      </div>

      {adding ? (
        <Card className="mt-3">
          <Field label="Account name">
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Home Credit" autoFocus />
          </Field>
          <Button
            className="mt-3 w-full"
            disabled={!name.trim()}
            onClick={() => {
              onAdd({ name: name.trim(), balance: 0, paidThisPeriod: 0 });
              setName("");
              setAdding(false);
            }}
          >
            Add account
          </Button>
        </Card>
      ) : (
        <Button variant="ghost" className="mt-3 w-full" onClick={() => setAdding(true)}>
          + Add another account
        </Button>
      )}
    </div>
  );
}

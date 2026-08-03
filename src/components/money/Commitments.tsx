"use client";

import { useState } from "react";
import { peso } from "@/lib/finance/analytics";
import type { Commitment } from "@/lib/finance/types";
import { Bar, Button, Card, Field, Input, SectionTitle, Select } from "./ui";

interface Props {
  commitments: Commitment[];
  monthlyIncome: number;
  onAdd: (c: Omit<Commitment, "id">) => void;
  onUpdate: (id: string, patch: Partial<Commitment>) => void;
  onRemove: (id: string) => void;
}

const KIND_LABEL = { fixed: "Living costs", debt: "Debt servicing" } as const;

export function Commitments({ commitments, monthlyIncome, onAdd, onUpdate, onRemove }: Props) {
  const [open, setOpen] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState({ name: "", amount: "", kind: "fixed" as Commitment["kind"] });

  const fixed = commitments.filter((c) => c.kind === "fixed");
  const debt = commitments.filter((c) => c.kind === "debt");
  const sum = (list: Commitment[]) => list.reduce((s, c) => s + c.amount, 0);
  const total = sum(commitments);
  const left = monthlyIncome - total;

  return (
    <div>
      <Card className="border-gold/25 bg-gradient-to-br from-ink/90 to-midnight/80">
        <span className="text-[11px] uppercase tracking-wider text-champagne">Committed every month</span>
        <div className="mt-1 font-serif text-3xl text-gold">{peso(total)}</div>
        <div className="mt-2 flex gap-5 text-xs text-mist">
          <span>Living {peso(sum(fixed), { compact: true })}</span>
          <span>Debt {peso(sum(debt), { compact: true })}</span>
        </div>
        {monthlyIncome > 0 ? (
          <>
            <div className="mt-3">
              <Bar
                value={total / monthlyIncome}
                color={total / monthlyIncome > 0.9 ? "#F09A9A" : total / monthlyIncome > 0.7 ? "#E7C98A" : "#6EC4A0"}
              />
            </div>
            <p className="mt-2 text-xs text-mist">
              {((total / monthlyIncome) * 100).toFixed(0)}% of household income is spoken for before anything
              discretionary. {left >= 0 ? `${peso(left)} left over.` : `${peso(Math.abs(left))} short.`}
            </p>
          </>
        ) : null}
      </Card>

      {(["fixed", "debt"] as const).map((kind) => {
        const rows = commitments.filter((c) => c.kind === kind).sort((a, b) => b.amount - a.amount);
        if (rows.length === 0) return null;
        return (
          <div key={kind}>
            <SectionTitle hint={`${peso(sum(rows), { compact: true })}/mo`}>{KIND_LABEL[kind]}</SectionTitle>
            <div className="flex flex-col gap-2">
              {rows.map((c) => {
                const isOpen = open === c.id;
                return (
                  <Card key={c.id} className="p-3">
                    <button
                      type="button"
                      onClick={() => setOpen(isOpen ? null : c.id)}
                      className="flex w-full items-center gap-3 text-left"
                    >
                      <span
                        className="h-8 w-1 shrink-0 rounded-full"
                        style={{ background: kind === "debt" ? "#E7C98A" : "#8FA3C8" }}
                      />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm text-cloud">{c.name}</span>
                        {c.note ? <span className="block truncate text-xs text-mist">{c.note}</span> : null}
                      </span>
                      <span className="shrink-0 text-sm tabular-nums text-cloud">{peso(c.amount)}</span>
                    </button>

                    {isOpen ? (
                      <div className="mt-3 grid grid-cols-2 gap-3 border-t border-white/8 pt-3">
                        <Field label="Name">
                          <Input value={c.name} onChange={(e) => onUpdate(c.id, { name: e.target.value })} />
                        </Field>
                        <Field label="Per month">
                          <Input
                            type="number"
                            inputMode="decimal"
                            value={c.amount}
                            onChange={(e) => onUpdate(c.id, { amount: Number(e.target.value) || 0 })}
                          />
                        </Field>
                        <Field label="Kind">
                          <Select
                            value={c.kind}
                            onChange={(e) => onUpdate(c.id, { kind: e.target.value as Commitment["kind"] })}
                          >
                            <option value="fixed">Living cost</option>
                            <option value="debt">Debt servicing</option>
                          </Select>
                        </Field>
                        <Field label="Note">
                          <Input
                            value={c.note ?? ""}
                            onChange={(e) => onUpdate(c.id, { note: e.target.value })}
                            placeholder="Optional"
                          />
                        </Field>
                        <div className="col-span-2">
                          <Button
                            variant="danger"
                            className="w-full"
                            onClick={() => {
                              onRemove(c.id);
                              setOpen(null);
                            }}
                          >
                            Remove
                          </Button>
                        </div>
                      </div>
                    ) : null}
                  </Card>
                );
              })}
            </div>
          </div>
        );
      })}

      {adding ? (
        <Card className="mt-3">
          <div className="grid grid-cols-2 gap-3">
            <Field label="Name">
              <Input
                value={draft.name}
                onChange={(e) => setDraft({ ...draft, name: e.target.value })}
                placeholder="e.g. Tuition"
                autoFocus
              />
            </Field>
            <Field label="Per month">
              <Input
                type="number"
                inputMode="decimal"
                value={draft.amount}
                onChange={(e) => setDraft({ ...draft, amount: e.target.value })}
                placeholder="0.00"
              />
            </Field>
            <Field label="Kind">
              <Select
                value={draft.kind}
                onChange={(e) => setDraft({ ...draft, kind: e.target.value as Commitment["kind"] })}
              >
                <option value="fixed">Living cost</option>
                <option value="debt">Debt servicing</option>
              </Select>
            </Field>
          </div>
          <Button
            className="mt-3 w-full"
            disabled={!draft.name.trim() || Number(draft.amount) <= 0}
            onClick={() => {
              onAdd({ name: draft.name.trim(), amount: Number(draft.amount), kind: draft.kind, owner: "me" });
              setDraft({ name: "", amount: "", kind: "fixed" });
              setAdding(false);
            }}
          >
            Add commitment
          </Button>
        </Card>
      ) : (
        <Button variant="ghost" className="mt-3 w-full" onClick={() => setAdding(true)}>
          + Add commitment
        </Button>
      )}
    </div>
  );
}

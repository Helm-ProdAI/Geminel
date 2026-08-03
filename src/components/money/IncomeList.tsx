"use client";

import { useState } from "react";
import { CADENCE_LABEL, monthlyValue, peso } from "@/lib/finance/analytics";
import type { Cadence, Income } from "@/lib/finance/types";
import { Button, Card, Field, Input, SectionTitle, Select } from "./ui";

const CADENCES: Cadence[] = ["once", "weekly", "semimonthly", "monthly"];

interface Props {
  income: Income[];
  onAdd: (i: Omit<Income, "id">) => void;
  onUpdate: (id: string, patch: Partial<Income>) => void;
  onRemove: (id: string) => void;
}

export function IncomeList({ income, onAdd, onUpdate, onRemove }: Props) {
  const [open, setOpen] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState({ source: "", amount: "", cadence: "monthly" as Cadence });

  const received = income.reduce((s, i) => s + i.amount, 0);
  const repeating = income.reduce((s, i) => s + monthlyValue(i), 0);
  const capital = income.filter((i) => i.returnOfCapital).reduce((s, i) => s + i.amount, 0);

  return (
    <div>
      <div className="grid grid-cols-2 gap-3">
        <Card className="flex flex-col gap-1">
          <span className="text-[11px] uppercase tracking-wider text-mist/80">Received</span>
          <span className="font-serif text-2xl text-cloud">{peso(received)}</span>
          <span className="text-xs text-mist">This period</span>
        </Card>
        <Card className="flex flex-col gap-1">
          <span className="text-[11px] uppercase tracking-wider text-mist/80">Repeats monthly</span>
          <span className="font-serif text-2xl text-gold">{peso(repeating)}</span>
          <span className="text-xs text-mist">Drives every projection</span>
        </Card>
      </div>

      {capital > 0 ? (
        <Card className="mt-3 border-gold/30">
          <p className="text-sm text-cloud">{peso(capital)} of this was your own money coming back</p>
          <p className="mt-1 text-xs text-mist">
            Capital returns spend like income but cannot be planned around — they arrive once. Only the repeating
            figure above is safe to size your life against.
          </p>
        </Card>
      ) : null}

      <SectionTitle hint={`${income.length} sources`}>Money in</SectionTitle>

      <div className="flex flex-col gap-2">
        {income.map((i) => {
          const isOpen = open === i.id;
          const monthly = monthlyValue(i);
          return (
            <Card key={i.id} className="p-3">
              <button
                type="button"
                onClick={() => setOpen(isOpen ? null : i.id)}
                className="flex w-full items-center gap-3 text-left"
              >
                <span
                  className="h-8 w-1 shrink-0 rounded-full"
                  style={{ background: i.returnOfCapital ? "#B0B8CC" : "#6EC4A0" }}
                />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm text-cloud">{i.source}</span>
                  <span className="block truncate text-xs text-mist">
                    {CADENCE_LABEL[i.cadence]}
                    {i.returnOfCapital ? " · not earnings" : monthly > 0 ? ` · ${peso(monthly)}/mo` : ""}
                  </span>
                </span>
                <span className="shrink-0 text-sm tabular-nums text-cloud">{peso(i.amount)}</span>
              </button>

              {i.note ? <p className="mt-2 text-[11px] text-mist/80">{i.note}</p> : null}

              {isOpen ? (
                <div className="mt-3 flex flex-col gap-3 border-t border-white/8 pt-3">
                  <div className="grid grid-cols-2 gap-3">
                    <Field label="Source">
                      <Input value={i.source} onChange={(e) => onUpdate(i.id, { source: e.target.value })} />
                    </Field>
                    <Field label="Amount">
                      <Input
                        type="number"
                        inputMode="decimal"
                        value={i.amount}
                        onChange={(e) => onUpdate(i.id, { amount: Number(e.target.value) || 0 })}
                      />
                    </Field>
                    <Field label="How often">
                      <Select
                        value={i.cadence}
                        onChange={(e) => onUpdate(i.id, { cadence: e.target.value as Cadence })}
                      >
                        {CADENCES.map((c) => (
                          <option key={c} value={c}>
                            {CADENCE_LABEL[c]}
                          </option>
                        ))}
                      </Select>
                    </Field>
                    <Field label="Date">
                      <Input
                        type="date"
                        value={i.date}
                        onChange={(e) => onUpdate(i.id, { date: e.target.value, dateEstimated: false })}
                      />
                    </Field>
                  </div>
                  <label className="flex items-center gap-2.5 text-sm text-cloud">
                    <input
                      type="checkbox"
                      className="h-4 w-4 accent-[#E7C98A]"
                      checked={!!i.returnOfCapital}
                      onChange={(e) => onUpdate(i.id, { returnOfCapital: e.target.checked })}
                    />
                    My own capital returning, not new earnings
                  </label>
                  <Button
                    variant="danger"
                    onClick={() => {
                      onRemove(i.id);
                      setOpen(null);
                    }}
                  >
                    Delete
                  </Button>
                </div>
              ) : null}
            </Card>
          );
        })}
      </div>

      {adding ? (
        <Card className="mt-3">
          <div className="grid grid-cols-2 gap-3">
            <Field label="Source">
              <Input
                value={draft.source}
                onChange={(e) => setDraft({ ...draft, source: e.target.value })}
                placeholder="e.g. Freelance"
                autoFocus
              />
            </Field>
            <Field label="Amount">
              <Input
                type="number"
                inputMode="decimal"
                value={draft.amount}
                onChange={(e) => setDraft({ ...draft, amount: e.target.value })}
                placeholder="0.00"
              />
            </Field>
            <Field label="How often">
              <Select
                value={draft.cadence}
                onChange={(e) => setDraft({ ...draft, cadence: e.target.value as Cadence })}
              >
                {CADENCES.map((c) => (
                  <option key={c} value={c}>
                    {CADENCE_LABEL[c]}
                  </option>
                ))}
              </Select>
            </Field>
          </div>
          <Button
            className="mt-3 w-full"
            disabled={!draft.source.trim() || Number(draft.amount) <= 0}
            onClick={() => {
              onAdd({
                source: draft.source.trim(),
                amount: Number(draft.amount),
                cadence: draft.cadence,
                date: new Date().toISOString().slice(0, 10),
              });
              setDraft({ source: "", amount: "", cadence: "monthly" });
              setAdding(false);
            }}
          >
            Add income
          </Button>
        </Card>
      ) : (
        <Button variant="ghost" className="mt-3 w-full" onClick={() => setAdding(true)}>
          + Add income
        </Button>
      )}
    </div>
  );
}

"use client";

import { useState } from "react";
import { peso, summarize } from "@/lib/finance/analytics";
import type { FinanceState, Goal } from "@/lib/finance/types";
import { Bar, Button, Card, Field, Input, SectionTitle } from "./ui";

interface Props {
  state: FinanceState;
  onAdd: (g: Omit<Goal, "id">) => void;
  onUpdate: (id: string, patch: Partial<Goal>) => void;
  onRemove: (id: string) => void;
}

export function Goals({ state, onAdd, onUpdate, onRemove }: Props) {
  const [open, setOpen] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState({ name: "", target: "" });

  const s = summarize(state);
  /** What is actually free each month, if income is known. */
  const monthlySurplus = s.monthlySurplus;

  return (
    <div>
      <Card className="border-gold/25">
        <span className="text-[11px] uppercase tracking-wider text-champagne">Monthly surplus</span>
        <div className="mt-1 font-serif text-3xl text-gold">
          {monthlySurplus === null ? "—" : peso(monthlySurplus)}
        </div>
        <p className="mt-1 text-xs text-mist">
          {monthlySurplus === null
            ? "Log what comes in on the Income ledger and this becomes the number that funds every goal below."
            : monthlySurplus <= 0
              ? "You have no surplus at this burn rate. Goals below cannot be funded until spending drops or income rises."
              : "This is what you can move into goals each month without borrowing."}
        </p>
      </Card>

      <SectionTitle hint={`${state.goals.length} goals`}>Goals</SectionTitle>

      <div className="flex flex-col gap-2">
        {state.goals.map((g) => {
          const progress = g.target > 0 ? g.saved / g.target : 0;
          const remaining = Math.max(0, g.target - g.saved);
          const months = monthlySurplus && monthlySurplus > 0 ? remaining / monthlySurplus : null;
          const isOpen = open === g.id;

          return (
            <Card key={g.id} className="p-4">
              <button
                type="button"
                onClick={() => setOpen(isOpen ? null : g.id)}
                className="flex w-full items-baseline justify-between gap-3 text-left"
              >
                <span className="min-w-0 flex-1 truncate text-sm text-cloud">{g.name}</span>
                <span className="shrink-0 text-xs tabular-nums text-mist">
                  {peso(g.saved, { compact: true })} / {peso(g.target, { compact: true })}
                </span>
              </button>

              <div className="mt-2">
                <Bar value={progress} color={progress >= 1 ? "#6EC4A0" : "#E7C98A"} />
              </div>

              <p className="mt-2 text-xs text-mist">
                {progress >= 1
                  ? "Funded."
                  : months === null
                    ? `${peso(remaining)} to go.`
                    : `${peso(remaining)} to go — about ${Math.ceil(months)} month${
                        Math.ceil(months) === 1 ? "" : "s"
                      } at your current surplus.`}
              </p>
              {g.note ? <p className="mt-1 text-[11px] text-mist/70">{g.note}</p> : null}

              {isOpen ? (
                <div className="mt-3 grid grid-cols-2 gap-3 border-t border-white/8 pt-3">
                  <Field label="Name">
                    <Input value={g.name} onChange={(e) => onUpdate(g.id, { name: e.target.value })} />
                  </Field>
                  <Field label="Target">
                    <Input
                      type="number"
                      inputMode="decimal"
                      value={g.target || ""}
                      onChange={(e) => onUpdate(g.id, { target: Number(e.target.value) || 0 })}
                    />
                  </Field>
                  <Field label="Saved so far">
                    <Input
                      type="number"
                      inputMode="decimal"
                      value={g.saved || ""}
                      placeholder="0.00"
                      onChange={(e) => onUpdate(g.id, { saved: Number(e.target.value) || 0 })}
                    />
                  </Field>
                  <Field label="Target date">
                    <Input
                      type="date"
                      value={g.targetDate ?? ""}
                      onChange={(e) => onUpdate(g.id, { targetDate: e.target.value || undefined })}
                    />
                  </Field>
                  <div className="col-span-2">
                    <Button variant="danger" className="w-full" onClick={() => onRemove(g.id)}>
                      Remove goal
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
          <div className="grid grid-cols-2 gap-3">
            <Field label="Goal">
              <Input
                value={draft.name}
                onChange={(e) => setDraft({ ...draft, name: e.target.value })}
                placeholder="e.g. Japan trip"
                autoFocus
              />
            </Field>
            <Field label="Target">
              <Input
                type="number"
                inputMode="decimal"
                value={draft.target}
                onChange={(e) => setDraft({ ...draft, target: e.target.value })}
                placeholder="0.00"
              />
            </Field>
          </div>
          <Button
            className="mt-3 w-full"
            disabled={!draft.name.trim() || Number(draft.target) <= 0}
            onClick={() => {
              onAdd({ name: draft.name.trim(), target: Number(draft.target), saved: 0 });
              setDraft({ name: "", target: "" });
              setAdding(false);
            }}
          >
            Add goal
          </Button>
        </Card>
      ) : (
        <Button variant="ghost" className="mt-3 w-full" onClick={() => setAdding(true)}>
          + Add a goal
        </Button>
      )}
    </div>
  );
}

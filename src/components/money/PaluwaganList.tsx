"use client";

import { useState } from "react";
import { peso } from "@/lib/finance/analytics";
import type { Paluwagan } from "@/lib/finance/types";
import { Button, Card, Field, Input, SectionTitle, Select } from "./ui";

interface Props {
  paluwagan: Paluwagan[];
  onAdd: (p: Omit<Paluwagan, "id">) => void;
  onUpdate: (id: string, patch: Partial<Paluwagan>) => void;
  onRemove: (id: string) => void;
}

const monthly = (p: Paluwagan) => p.contribution * (p.cadence === "biweekly" ? 2 : 1);

function when(iso: string): string {
  return new Date(iso).toLocaleDateString("en-PH", { month: "short", year: "numeric" });
}

export function PaluwaganList({ paluwagan, onAdd, onUpdate, onRemove }: Props) {
  const [open, setOpen] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState({
    name: "",
    contribution: "",
    payout: "",
    cadence: "monthly" as Paluwagan["cadence"],
    payoutDate: "",
  });

  const live = paluwagan.filter((p) => !p.received);
  const perMonth = live.reduce((a, p) => a + monthly(p), 0);
  const due = live.reduce((a, p) => a + p.payout, 0);
  const paidIn = paluwagan.reduce((a, p) => a + monthly(p), 0);

  // Soonest first — the schedule is the whole point.
  const ordered = [...paluwagan].sort((a, b) => a.payoutDate.localeCompare(b.payoutDate));

  return (
    <div>
      <Card className="border-gold/25 bg-gradient-to-br from-ink/90 to-midnight/80">
        <span className="text-[11px] uppercase tracking-wider text-champagne">Coming back to you</span>
        <div className="mt-1 font-serif text-3xl text-gold">{peso(due)}</div>
        <div className="mt-2 flex gap-5 text-xs text-mist">
          <span>{live.length} slots</span>
          <span>{peso(perMonth, { compact: true })}/mo in</span>
        </div>
        <p className="mt-3 border-t border-white/8 pt-2.5 text-xs text-mist">
          This is saving, not spending. It leaves every cycle and comes back in lump sums on the dates below — the
          only large amounts you have scheduled.
        </p>
      </Card>

      <SectionTitle hint={`${peso(paidIn, { compact: true })}/mo`}>Payout schedule</SectionTitle>

      <div className="flex flex-col gap-2">
        {ordered.map((p) => {
          const isOpen = open === p.id;
          return (
            <Card key={p.id} className={`p-3 ${p.received ? "opacity-50" : ""}`}>
              <button
                type="button"
                onClick={() => setOpen(isOpen ? null : p.id)}
                className="flex w-full items-center gap-3 text-left"
              >
                <span
                  className="h-8 w-1 shrink-0 rounded-full"
                  style={{ background: p.received ? "#B0B8CC" : "#6EC4A0" }}
                />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm text-cloud">{p.name}</span>
                  <span className="block truncate text-xs text-mist">
                    {peso(p.contribution)} {p.cadence === "biweekly" ? "every 2 weeks" : "a month"}
                    {p.received ? " · received" : ""}
                  </span>
                </span>
                <span className="shrink-0 text-right">
                  <span className="block text-sm tabular-nums text-[#6EC4A0]">{peso(p.payout, { compact: true })}</span>
                  <span className="block text-[10px] text-mist/70">{when(p.payoutDate)}</span>
                </span>
              </button>

              {p.note ? <p className="mt-2 text-[11px] text-mist/80">{p.note}</p> : null}

              {isOpen ? (
                <div className="mt-3 flex flex-col gap-3 border-t border-white/8 pt-3">
                  <div className="grid grid-cols-2 gap-3">
                    <Field label="Name">
                      <Input value={p.name} onChange={(e) => onUpdate(p.id, { name: e.target.value })} />
                    </Field>
                    <Field label="Per cycle">
                      <Input
                        type="number"
                        inputMode="decimal"
                        value={p.contribution}
                        onChange={(e) => onUpdate(p.id, { contribution: Number(e.target.value) || 0 })}
                      />
                    </Field>
                    <Field label="How often">
                      <Select
                        value={p.cadence}
                        onChange={(e) => onUpdate(p.id, { cadence: e.target.value as Paluwagan["cadence"] })}
                      >
                        <option value="monthly">Monthly</option>
                        <option value="biweekly">Every 2 weeks</option>
                      </Select>
                    </Field>
                    <Field label="Payout">
                      <Input
                        type="number"
                        inputMode="decimal"
                        value={p.payout}
                        onChange={(e) => onUpdate(p.id, { payout: Number(e.target.value) || 0 })}
                      />
                    </Field>
                    <Field label="Payout date">
                      <Input
                        type="date"
                        value={p.payoutDate}
                        onChange={(e) => onUpdate(p.id, { payoutDate: e.target.value })}
                      />
                    </Field>
                  </div>
                  <label className="flex items-center gap-2.5 text-sm text-cloud">
                    <input
                      type="checkbox"
                      className="h-4 w-4 accent-[#E7C98A]"
                      checked={!!p.received}
                      onChange={(e) => onUpdate(p.id, { received: e.target.checked })}
                    />
                    Already received
                  </label>
                  <Button
                    variant="danger"
                    onClick={() => {
                      onRemove(p.id);
                      setOpen(null);
                    }}
                  >
                    Remove
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
            <Field label="Name">
              <Input
                value={draft.name}
                onChange={(e) => setDraft({ ...draft, name: e.target.value })}
                placeholder="e.g. B14 50K"
                autoFocus
              />
            </Field>
            <Field label="Per cycle">
              <Input
                type="number"
                inputMode="decimal"
                value={draft.contribution}
                onChange={(e) => setDraft({ ...draft, contribution: e.target.value })}
                placeholder="0.00"
              />
            </Field>
            <Field label="How often">
              <Select
                value={draft.cadence}
                onChange={(e) => setDraft({ ...draft, cadence: e.target.value as Paluwagan["cadence"] })}
              >
                <option value="monthly">Monthly</option>
                <option value="biweekly">Every 2 weeks</option>
              </Select>
            </Field>
            <Field label="Payout">
              <Input
                type="number"
                inputMode="decimal"
                value={draft.payout}
                onChange={(e) => setDraft({ ...draft, payout: e.target.value })}
                placeholder="0.00"
              />
            </Field>
            <Field label="Payout date">
              <Input
                type="date"
                value={draft.payoutDate}
                onChange={(e) => setDraft({ ...draft, payoutDate: e.target.value })}
              />
            </Field>
          </div>
          <Button
            className="mt-3 w-full"
            disabled={!draft.name.trim() || Number(draft.contribution) <= 0 || !draft.payoutDate}
            onClick={() => {
              onAdd({
                name: draft.name.trim(),
                contribution: Number(draft.contribution),
                cadence: draft.cadence,
                payout: Number(draft.payout) || 0,
                payoutDate: draft.payoutDate,
              });
              setDraft({ name: "", contribution: "", payout: "", cadence: "monthly", payoutDate: "" });
              setAdding(false);
            }}
          >
            Add slot
          </Button>
        </Card>
      ) : (
        <Button variant="ghost" className="mt-3 w-full" onClick={() => setAdding(true)}>
          + Add slot
        </Button>
      )}
    </div>
  );
}

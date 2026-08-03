"use client";

import { useState } from "react";
import { CADENCE_LABEL, monthlyValue, peso, toPeso } from "@/lib/finance/analytics";
import type { Cadence, Currency, Income, Owner, Settings } from "@/lib/finance/types";
import { Button, Card, Field, Input, SectionTitle, Select } from "./ui";

const CADENCES: Cadence[] = ["once", "weekly", "semimonthly", "monthly"];
const OWNER_LABEL: Record<Owner, string> = { me: "You", partner: "Husband" };

interface Props {
  income: Income[];
  settings: Settings;
  onAdd: (i: Omit<Income, "id">) => void;
  onUpdate: (id: string, patch: Partial<Income>) => void;
  onRemove: (id: string) => void;
  onRateChange: (rate: number) => void;
}

function fmt(i: Income): string {
  return i.currency === "USD"
    ? `$${i.amount.toLocaleString("en-US", { maximumFractionDigits: 2 })}`
    : peso(i.amount);
}

export function IncomeList({ income, settings, onAdd, onUpdate, onRemove, onRateChange }: Props) {
  const [open, setOpen] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState({
    source: "",
    amount: "",
    cadence: "monthly" as Cadence,
    currency: "USD" as Currency,
    owner: "me" as Owner,
  });

  const monthly = (o: Owner) =>
    income.filter((i) => i.owner === o).reduce((s, i) => s + monthlyValue(i, settings), 0);
  const mine = monthly("me");
  const theirs = monthly("partner");
  const household = mine + theirs;
  const capital = income.filter((i) => i.returnOfCapital).reduce((s, i) => s + toPeso(i, settings), 0);
  const hasUsd = income.some((i) => i.currency === "USD");

  const groups: Owner[] = ["me", "partner"];

  return (
    <div>
      <Card className="border-gold/25 bg-gradient-to-br from-ink/90 to-midnight/80">
        <span className="text-[11px] uppercase tracking-wider text-champagne">Household, every month</span>
        <div className="mt-1 font-serif text-3xl text-gold">{peso(household)}</div>
        <div className="mt-2 flex gap-5 text-xs text-mist">
          <span>You {peso(mine, { compact: true })}</span>
          <span>Husband {peso(theirs, { compact: true })}</span>
        </div>
      </Card>

      {hasUsd ? (
        <Card className="mt-3">
          <Field label="Pesos per US dollar">
            <Input
              type="number"
              inputMode="decimal"
              value={settings.usdPhpRate || ""}
              onChange={(e) => onRateChange(Number(e.target.value) || 0)}
            />
          </Field>
          <p className="mt-2 text-[11px] leading-relaxed text-mist/80">
            Every USD figure above converts at this rate, so it drives the whole picture. Set it to the rate you
            actually receive after remittance fees, not the mid-market rate.
          </p>
        </Card>
      ) : null}

      {capital > 0 ? (
        <Card className="mt-3 border-gold/30">
          <p className="text-sm text-cloud">{peso(capital)} of what arrived was your own money coming back</p>
          <p className="mt-1 text-xs text-mist">
            Capital returns spend like income but cannot be planned around — they arrive once. Only the repeating
            figures above are safe to size your life against.
          </p>
        </Card>
      ) : null}

      {groups.map((owner) => {
        const rows = income.filter((i) => i.owner === owner);
        if (rows.length === 0) return null;
        return (
          <div key={owner}>
            <SectionTitle hint={`${peso(monthly(owner), { compact: true })}/mo`}>{OWNER_LABEL[owner]}</SectionTitle>
            <div className="flex flex-col gap-2">
              {rows.map((i) => {
                const isOpen = open === i.id;
                const perMonth = monthlyValue(i, settings);
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
                          {i.returnOfCapital
                            ? " · not earnings"
                            : perMonth > 0 && i.currency === "USD"
                              ? ` · ${peso(perMonth)}/mo`
                              : ""}
                        </span>
                      </span>
                      <span className="shrink-0 text-sm tabular-nums text-cloud">{fmt(i)}</span>
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
                          <Field label="Currency">
                            <Select
                              value={i.currency}
                              onChange={(e) => onUpdate(i.id, { currency: e.target.value as Currency })}
                            >
                              <option value="USD">USD</option>
                              <option value="PHP">PHP</option>
                            </Select>
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
                          <Field label="Whose">
                            <Select
                              value={i.owner}
                              onChange={(e) => onUpdate(i.id, { owner: e.target.value as Owner })}
                            >
                              <option value="me">You</option>
                              <option value="partner">Husband</option>
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
          </div>
        );
      })}

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
            <Field label="Currency">
              <Select
                value={draft.currency}
                onChange={(e) => setDraft({ ...draft, currency: e.target.value as Currency })}
              >
                <option value="USD">USD</option>
                <option value="PHP">PHP</option>
              </Select>
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
            <Field label="Whose">
              <Select value={draft.owner} onChange={(e) => setDraft({ ...draft, owner: e.target.value as Owner })}>
                <option value="me">You</option>
                <option value="partner">Husband</option>
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
                currency: draft.currency,
                owner: draft.owner,
                cadence: draft.cadence,
                date: new Date().toISOString().slice(0, 10),
              });
              setDraft({ source: "", amount: "", cadence: "monthly", currency: "USD", owner: "me" });
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

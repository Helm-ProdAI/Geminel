"use client";

import { useMemo, useState } from "react";
import { peso, TX_CADENCE_LABEL } from "@/lib/finance/analytics";
import { CATEGORIES, CATEGORY_MAP } from "@/lib/finance/seed";
import type { CategoryId, Transaction, TxCadence } from "@/lib/finance/types";
import { Button, Card, Field, Input, SectionTitle, Select } from "./ui";

interface Props {
  transactions: Transaction[];
  periodStart: string;
  onAdd: (tx: Omit<Transaction, "id">) => void;
  onUpdate: (id: string, patch: Partial<Transaction>) => void;
  onRemove: (id: string) => void;
}

export function Transactions({ transactions, periodStart, onAdd, onUpdate, onRemove }: Props) {
  const [filter, setFilter] = useState<CategoryId | "all">("all");
  const [query, setQuery] = useState("");
  const [adding, setAdding] = useState(false);
  const [editing, setEditing] = useState<string | null>(null);

  const shown = useMemo(() => {
    const q = query.trim().toLowerCase();
    return transactions
      .filter((t) => (filter === "all" ? true : t.category === filter))
      .filter((t) => (q ? t.merchant.toLowerCase().includes(q) : true))
      .sort((a, b) => b.amount - a.amount);
  }, [transactions, filter, query]);

  const shownTotal = shown.reduce((s, t) => s + t.amount, 0);

  return (
    <div>
      <div className="flex items-center gap-2">
        <Input
          placeholder="Search merchant"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          inputMode="search"
        />
        <Button onClick={() => setAdding((v) => !v)} className="shrink-0">
          {adding ? "Close" : "+ Add"}
        </Button>
      </div>

      {adding ? <AddForm periodStart={periodStart} onAdd={onAdd} onDone={() => setAdding(false)} /> : null}

      <div className="-mx-4 mt-3 overflow-x-auto px-4">
        <div className="flex w-max gap-2 pb-1">
          <Chip active={filter === "all"} onClick={() => setFilter("all")}>
            All
          </Chip>
          {CATEGORIES.filter((c) => transactions.some((t) => t.category === c.id)).map((c) => (
            <Chip key={c.id} active={filter === c.id} color={c.color} onClick={() => setFilter(c.id)}>
              {c.label}
            </Chip>
          ))}
        </div>
      </div>

      <SectionTitle hint={`${shown.length} shown · ${peso(shownTotal)}`}>Transactions</SectionTitle>

      <div className="flex flex-col gap-2">
        {shown.map((t) => {
          const cat = CATEGORY_MAP[t.category];
          const isEditing = editing === t.id;
          return (
            <Card key={t.id} className="p-3">
              <button
                type="button"
                onClick={() => setEditing(isEditing ? null : t.id)}
                className="flex w-full items-center gap-3 text-left"
              >
                <span className="h-8 w-1 shrink-0 rounded-full" style={{ background: cat.color }} />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm text-cloud">{t.merchant}</span>
                  <span className="block truncate text-xs text-mist">
                    {cat.label}
                    {t.cadence && t.cadence !== "period" ? ` · ${TX_CADENCE_LABEL[t.cadence].toLowerCase()}` : ""}
                    {t.note ? ` · ${t.note}` : ""}
                  </span>
                </span>
                <span className="shrink-0 text-right">
                  <span className="block text-sm tabular-nums text-cloud">{peso(t.amount)}</span>
                  {t.dateEstimated ? (
                    <span className="block text-[10px] text-mist/60">date not recorded</span>
                  ) : (
                    <span className="block text-[10px] text-mist/60">
                      {new Date(t.date).toLocaleDateString("en-PH", { month: "short", day: "numeric" })}
                    </span>
                  )}
                </span>
              </button>

              {isEditing ? (
                <div className="mt-3 flex flex-col gap-3 border-t border-white/8 pt-3">
                  <div className="grid grid-cols-2 gap-3">
                    <Field label="Merchant">
                      <Input value={t.merchant} onChange={(e) => onUpdate(t.id, { merchant: e.target.value })} />
                    </Field>
                    <Field label="Amount">
                      <Input
                        type="number"
                        inputMode="decimal"
                        value={t.amount}
                        onChange={(e) => onUpdate(t.id, { amount: Number(e.target.value) || 0 })}
                      />
                    </Field>
                    <Field label="Category">
                      <Select
                        value={t.category}
                        onChange={(e) => onUpdate(t.id, { category: e.target.value as CategoryId })}
                      >
                        {CATEGORIES.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.label}
                          </option>
                        ))}
                      </Select>
                    </Field>
                    <Field label="Date">
                      <Input
                        type="date"
                        value={t.date}
                        onChange={(e) => onUpdate(t.id, { date: e.target.value, dateEstimated: false })}
                      />
                    </Field>
                  </div>
                  <Field label="Note">
                    <Input
                      value={t.note ?? ""}
                      placeholder="What was this?"
                      onChange={(e) => onUpdate(t.id, { note: e.target.value })}
                    />
                  </Field>
                  <Field label="How often this repeats">
                    <Select
                      value={t.cadence ?? "period"}
                      onChange={(e) => onUpdate(t.id, { cadence: e.target.value as TxCadence })}
                    >
                      {(["period", "weekly", "monthly", "once"] as const).map((c) => (
                        <option key={c} value={c}>
                          {TX_CADENCE_LABEL[c]}
                        </option>
                      ))}
                    </Select>
                  </Field>
                  <p className="-mt-1 text-[11px] text-mist/70">
                    This is what the monthly run-rate projects from. A card installment that landed in this week is
                    monthly, not every period.
                  </p>
                  <Button
                    variant="danger"
                    onClick={() => {
                      onRemove(t.id);
                      setEditing(null);
                    }}
                  >
                    Delete transaction
                  </Button>
                </div>
              ) : null}
            </Card>
          );
        })}
        {shown.length === 0 ? <p className="py-8 text-center text-sm text-mist">Nothing matches that filter.</p> : null}
      </div>
    </div>
  );
}

function Chip({
  active,
  color,
  onClick,
  children,
}: {
  active: boolean;
  color?: string;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs transition ${
        active ? "border-gold/50 bg-gold/12 text-gold" : "border-white/10 text-mist"
      }`}
    >
      {color ? <span className="h-1.5 w-1.5 rounded-full" style={{ background: color }} /> : null}
      {children}
    </button>
  );
}

function AddForm({
  periodStart,
  onAdd,
  onDone,
}: {
  periodStart: string;
  onAdd: (tx: Omit<Transaction, "id">) => void;
  onDone: () => void;
}) {
  const [merchant, setMerchant] = useState("");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState<CategoryId>("food");
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));

  const valid = merchant.trim().length > 0 && Number(amount) > 0;

  return (
    <Card className="mt-3">
      <div className="grid grid-cols-2 gap-3">
        <Field label="Merchant">
          <Input value={merchant} onChange={(e) => setMerchant(e.target.value)} placeholder="e.g. Grab" autoFocus />
        </Field>
        <Field label="Amount">
          <Input
            type="number"
            inputMode="decimal"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0.00"
          />
        </Field>
        <Field label="Category">
          <Select value={category} onChange={(e) => setCategory(e.target.value as CategoryId)}>
            {CATEGORIES.map((c) => (
              <option key={c.id} value={c.id}>
                {c.label}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Date">
          <Input type="date" value={date} min={periodStart} onChange={(e) => setDate(e.target.value)} />
        </Field>
      </div>
      <Button
        className="mt-3 w-full"
        disabled={!valid}
        onClick={() => {
          if (!valid) return;
          onAdd({ merchant: merchant.trim(), amount: Number(amount), category, date });
          onDone();
        }}
      >
        Save transaction
      </Button>
    </Card>
  );
}

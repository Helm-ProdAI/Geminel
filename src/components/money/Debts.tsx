"use client";

import { useMemo, useState } from "react";
import { peso } from "@/lib/finance/analytics";
import type { Debt, DebtStatus, Owner } from "@/lib/finance/types";
import { Bar, Button, Card, Field, Input, SectionTitle, Select, Stat } from "./ui";

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
  const [view, setView] = useState<DebtStatus>("collections");

  const rolling = debts.filter((d) => d.status === "rolling");
  const collections = debts.filter((d) => d.status === "collections");
  const sum = (list: Debt[]) => list.reduce((s, d) => s + d.balance, 0);

  const collMine = collections.filter((d) => d.owner === "me");
  const collPartner = collections.filter((d) => d.owner === "partner");

  const shown = view === "rolling" ? rolling : collections;

  /** Biggest first within collections — that is where a settlement moves the needle. */
  const ordered = useMemo(
    () =>
      [...shown].sort((a, b) => {
        if (view === "rolling") {
          const ar = a.apr ?? -1;
          const br = b.apr ?? -1;
          if (ar !== br) return br - ar;
        }
        return b.balance - a.balance;
      }),
    [shown, view]
  );

  return (
    <div>
      <div className="grid grid-cols-2 gap-3">
        <Stat
          label="In collections"
          value={peso(sum(collections))}
          sub={`${collections.length} defaulted accounts`}
          tone="alert"
        />
        <Stat label="Still rolling" value={peso(sum(rolling))} sub={`${rolling.length} accounts`} tone="gold" />
      </div>

      {collections.length > 0 ? (
        <Card className="mt-3 border-[#F09A9A]/35">
          <p className="text-sm text-cloud">Collections balances are a starting price, not a final one</p>
          <p className="mt-1 text-xs text-mist">
            {peso(sum(collMine))} is in your name across {collMine.length} accounts
            {collPartner.length > 0 ? `, and ${peso(sum(collPartner))} is your husband's` : ""}. Agencies routinely
            settle defaulted consumer debt well below face value, and they settle hardest with whoever engages first.
            Get every balance confirmed in writing before paying anything.
          </p>
        </Card>
      ) : null}

      <div className="mt-4 flex rounded-xl border border-white/10 p-1">
        {(["collections", "rolling"] as const).map((v) => (
          <button
            key={v}
            type="button"
            onClick={() => {
              setView(v);
              setOpen(null);
            }}
            className={`flex-1 rounded-lg py-2 text-sm transition ${
              view === v ? "bg-gold/12 text-gold" : "text-mist"
            }`}
          >
            {v === "collections" ? "Collections" : "Rolling"}
          </button>
        ))}
      </div>

      <SectionTitle hint={`${ordered.length} · ${peso(sum(ordered), { compact: true })}`}>
        {view === "collections" ? "Largest first" : "Highest rate first"}
      </SectionTitle>
      <p className="-mt-1 mb-3 text-xs text-mist">
        {view === "collections"
          ? "Ordered by size, because a negotiated settlement on a big account frees more than clearing several small ones. Small accounts still matter — they are the cheapest to close and each one removes a caller."
          : "Pay the minimum on everything, then throw every spare peso at the top account. Interest compounds hardest there."}
      </p>

      <div className="flex flex-col gap-2">
        {ordered.map((d, i) => {
          const isOpen = open === d.id;
          const denom = d.balance + d.paidThisPeriod;
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
                    {d.owner === "partner" ? "Husband · " : ""}
                    {d.apr ? `${d.apr}% APR` : "rate unknown"}
                    {d.paidThisPeriod > 0 ? ` · ${peso(d.paidThisPeriod)}/mo` : ""}
                  </span>
                </span>
                <span className="shrink-0 text-right text-sm tabular-nums text-cloud">
                  {d.balance > 0 ? peso(d.balance) : "—"}
                </span>
              </button>

              {d.status === "rolling" && d.balance > 0 ? (
                <div className="mt-2">
                  <Bar value={denom > 0 ? d.paidThisPeriod / denom : 0} color="#E7C98A" />
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
                  <Field label="Paying monthly">
                    <Input
                      type="number"
                      inputMode="decimal"
                      value={d.paidThisPeriod || ""}
                      placeholder="0.00"
                      onChange={(e) => onUpdate(d.id, { paidThisPeriod: Number(e.target.value) || 0 })}
                    />
                  </Field>
                  <Field label="Status">
                    <Select
                      value={d.status}
                      onChange={(e) => onUpdate(d.id, { status: e.target.value as DebtStatus })}
                    >
                      <option value="rolling">Rolling</option>
                      <option value="collections">In collections</option>
                    </Select>
                  </Field>
                  <Field label="Whose">
                    <Select value={d.owner} onChange={(e) => onUpdate(d.id, { owner: e.target.value as Owner })}>
                      <option value="me">You</option>
                      <option value="partner">Husband</option>
                    </Select>
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
              onAdd({ name: name.trim(), balance: 0, paidThisPeriod: 0, status: view, owner: "me" });
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

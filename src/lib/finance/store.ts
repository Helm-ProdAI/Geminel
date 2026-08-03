"use client";

import { useCallback, useEffect, useState } from "react";
import { SEED_STATE } from "./seed";
import type { Debt, FinanceState, Goal, Settings, Transaction } from "./types";

const STORAGE_KEY = "geminel.money.v1";

function load(): FinanceState {
  if (typeof window === "undefined") return SEED_STATE;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return SEED_STATE;
    const parsed = JSON.parse(raw) as Partial<FinanceState>;
    return {
      transactions: parsed.transactions ?? SEED_STATE.transactions,
      debts: parsed.debts ?? SEED_STATE.debts,
      goals: parsed.goals ?? SEED_STATE.goals,
      settings: { ...SEED_STATE.settings, ...parsed.settings },
    };
  } catch {
    return SEED_STATE;
  }
}

export function useFinance() {
  const [state, setState] = useState<FinanceState>(SEED_STATE);
  // Seed renders on the server and on the first client paint; the stored state
  // is swapped in after hydration so the markup matches.
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setState(load());
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      // Quota or private-browsing failures are non-fatal; the session still works.
    }
  }, [state, hydrated]);

  const addTransaction = useCallback((tx: Omit<Transaction, "id">) => {
    setState((s) => ({
      ...s,
      transactions: [{ ...tx, id: `tx-${Date.now()}-${Math.random().toString(36).slice(2, 7)}` }, ...s.transactions],
    }));
  }, []);

  const updateTransaction = useCallback((id: string, patch: Partial<Transaction>) => {
    setState((s) => ({
      ...s,
      transactions: s.transactions.map((t) => (t.id === id ? { ...t, ...patch } : t)),
    }));
  }, []);

  const removeTransaction = useCallback((id: string) => {
    setState((s) => ({ ...s, transactions: s.transactions.filter((t) => t.id !== id) }));
  }, []);

  const updateDebt = useCallback((id: string, patch: Partial<Debt>) => {
    setState((s) => ({ ...s, debts: s.debts.map((d) => (d.id === id ? { ...d, ...patch } : d)) }));
  }, []);

  const addDebt = useCallback((debt: Omit<Debt, "id">) => {
    setState((s) => ({ ...s, debts: [...s.debts, { ...debt, id: `debt-${Date.now()}` }] }));
  }, []);

  const removeDebt = useCallback((id: string) => {
    setState((s) => ({ ...s, debts: s.debts.filter((d) => d.id !== id) }));
  }, []);

  const updateGoal = useCallback((id: string, patch: Partial<Goal>) => {
    setState((s) => ({ ...s, goals: s.goals.map((g) => (g.id === id ? { ...g, ...patch } : g)) }));
  }, []);

  const addGoal = useCallback((goal: Omit<Goal, "id">) => {
    setState((s) => ({ ...s, goals: [...s.goals, { ...goal, id: `goal-${Date.now()}` }] }));
  }, []);

  const removeGoal = useCallback((id: string) => {
    setState((s) => ({ ...s, goals: s.goals.filter((g) => g.id !== id) }));
  }, []);

  const updateSettings = useCallback((patch: Partial<Settings>) => {
    setState((s) => ({ ...s, settings: { ...s.settings, ...patch } }));
  }, []);

  const resetToSeed = useCallback(() => setState(SEED_STATE), []);

  const exportJson = useCallback(() => JSON.stringify(state, null, 2), [state]);

  return {
    state,
    hydrated,
    addTransaction,
    updateTransaction,
    removeTransaction,
    addDebt,
    updateDebt,
    removeDebt,
    addGoal,
    updateGoal,
    removeGoal,
    updateSettings,
    resetToSeed,
    exportJson,
  };
}

import { CATEGORY_MAP, CATEGORIES } from "./seed";
import type {
  Cadence,
  CategoryId,
  FinanceState,
  Income,
  Paluwagan,
  Settings,
  Transaction,
  TxCadence,
} from "./types";

/** How many times a cadence lands in a month. `once` never repeats. */
const PER_MONTH: Record<Cadence, number> = {
  once: 0,
  weekly: 52 / 12,
  semimonthly: 2,
  monthly: 1,
};

export const CADENCE_LABEL: Record<Cadence, string> = {
  once: "One-off",
  weekly: "Weekly",
  semimonthly: "Twice a month",
  monthly: "Monthly",
};

export const TX_CADENCE_LABEL: Record<TxCadence, string> = {
  once: "Won't repeat",
  period: "Every period",
  weekly: "Weekly",
  monthly: "Monthly",
};

/**
 * Monthly cost of one spending line. "period" scales by how many times this
 * ledger period fits in a month; everything else is fixed by its own rhythm.
 */
export function monthlyCost(t: Transaction, periodDays: number): number {
  switch (t.cadence ?? "period") {
    case "once":
      return 0;
    case "monthly":
      return t.amount;
    case "weekly":
      return t.amount * (52 / 12);
    default:
      return t.amount * (30 / periodDays);
  }
}

/** A single income line converted to pesos at the configured rate. */
export function toPeso(i: Income, settings: Settings): number {
  return i.currency === "USD" ? i.amount * settings.usdPhpRate : i.amount;
}

/** Monthly peso value of one income line; 0 for anything that does not repeat. */
export function monthlyValue(i: Income, settings: Settings): number {
  return toPeso(i, settings) * PER_MONTH[i.cadence];
}

export function peso(n: number, opts: { compact?: boolean } = {}): string {
  if (opts.compact && Math.abs(n) >= 1_000_000) {
    return `₱${(n / 1_000_000).toFixed(1)}M`;
  }
  if (opts.compact && Math.abs(n) >= 1000) {
    return `₱${(n / 1000).toFixed(Math.abs(n) >= 100_000 ? 0 : 1)}k`;
  }
  return `₱${n.toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function daysInPeriod(start: string, end: string): number {
  const ms = new Date(end).getTime() - new Date(start).getTime();
  return Math.max(1, Math.round(ms / 86_400_000) + 1);
}

export interface CategoryTotal {
  id: CategoryId;
  label: string;
  color: string;
  flexible: boolean;
  total: number;
  count: number;
  share: number;
}

export function categoryTotals(transactions: Transaction[]): CategoryTotal[] {
  const grand = transactions.reduce((s, t) => s + t.amount, 0);
  const byId = new Map<CategoryId, { total: number; count: number }>();
  for (const t of transactions) {
    const cur = byId.get(t.category) ?? { total: 0, count: 0 };
    byId.set(t.category, { total: cur.total + t.amount, count: cur.count + 1 });
  }
  return CATEGORIES.map((c) => {
    const agg = byId.get(c.id) ?? { total: 0, count: 0 };
    return {
      id: c.id,
      label: c.label,
      color: c.color,
      flexible: c.flexible,
      total: agg.total,
      count: agg.count,
      share: grand > 0 ? agg.total / grand : 0,
    };
  })
    .filter((c) => c.count > 0)
    .sort((a, b) => b.total - a.total);
}

export interface Summary {
  total: number;
  count: number;
  days: number;
  perDay: number;
  projectedMonth: number;
  flexible: number;
  essential: number;
  debtPaid: number;
  oneOff: number;
  birthday: number;
  recurringBurn: number;
  unlabeled: number;
  /** Everything received in the period, capital returns included. */
  incomeIn: number;
  /** Period income that was your own capital coming back, not earnings. */
  capitalReturned: number;
  /** Monthly living costs, excluding debt servicing. */
  fixedMonthly: number;
  /** Monthly debt servicing on accounts still rolling. */
  debtMonthly: number;
  /** Paluwagan contributions per month — saving, not spending. */
  paluwaganMonthly: number;
  /** Payouts still to be received. */
  paluwaganDue: number;
  /** The next payout still outstanding, or null. */
  nextPayout: Paluwagan | null;
  /** fixedMonthly + debtMonthly. */
  committedMonthly: number;
  /** Face value of every defaulted account, both owners. */
  inCollections: number;
  /** Face value of defaulted accounts in your name only. */
  inCollectionsMine: number;
  /** Outstanding on accounts still being serviced. */
  rollingBalances: number;
  collectionsCount: number;
  /** Repeating monthly income in PHP — household, at the configured FX rate. */
  monthlyIncome: number;
  /** Repeating monthly income from your own sources only. */
  monthlyIncomeMine: number;
  /** True when monthlyIncome came from Settings rather than the income ledger. */
  incomeIsOverride: boolean;
  /** Money in minus money out, for this period only. */
  netThisPeriod: number;
  savingsRate: number | null;
  monthlySurplus: number | null;
}

export function monthlyIncomeOf(state: FinanceState): { value: number; isOverride: boolean } {
  if (state.settings.monthlyIncome > 0) return { value: state.settings.monthlyIncome, isOverride: true };
  return { value: state.income.reduce((s, i) => s + monthlyValue(i, state.settings), 0), isOverride: false };
}

export function summarize(state: FinanceState): Summary {
  const { transactions, income, settings } = state;
  const total = transactions.reduce((s, t) => s + t.amount, 0);
  const days = daysInPeriod(settings.periodStart, settings.periodEnd);
  const sumWhere = (fn: (t: Transaction) => boolean) =>
    transactions.filter(fn).reduce((s, t) => s + t.amount, 0);

  const flexible = sumWhere((t) => CATEGORY_MAP[t.category].flexible);
  const debtPaid = sumWhere((t) => t.category === "debt");
  const birthday = sumWhere((t) => t.category === "birthday");
  // Strip anything flagged as non-repeating before projecting forward, so one
  // unusual week is not multiplied into a monthly figure it never was.
  const oneOff = sumWhere((t) => t.cadence === "once");
  const recurringBurn = total - oneOff;
  // A written monthly budget beats projecting one week of receipts, so when
  // commitments exist they are the run-rate. Otherwise fall back to projecting
  // each transaction on its own cadence.
  const fixedMonthly = state.commitments.filter((c) => c.kind === "fixed").reduce((a, c) => a + c.amount, 0);
  const debtMonthly = state.commitments.filter((c) => c.kind === "debt").reduce((a, c) => a + c.amount, 0);
  // Biweekly slots bill twice a month.
  // Contributions continue after your turn — a paluwagan is paid every cycle
  // regardless of when the payout lands — so `received` does not stop them.
  const paluwaganMonthly = state.paluwagan.reduce(
    (a, p) => a + p.contribution * (p.cadence === "biweekly" ? 2 : 1),
    0
  );
  const paluwaganDue = state.paluwagan.filter((p) => !p.received).reduce((a, p) => a + p.payout, 0);
  const nextPayout =
    state.paluwagan
      .filter((p) => !p.received)
      .sort((a, b) => a.payoutDate.localeCompare(b.payoutDate))[0] ?? null;
  const committedMonthly = fixedMonthly + debtMonthly + paluwaganMonthly;
  const projectedMonth =
    state.commitments.length > 0
      ? committedMonthly
      : transactions.reduce((acc, t) => acc + monthlyCost(t, days), 0);

  const inCollections = state.debts
    .filter((d) => d.status === "collections")
    .reduce((a, d) => a + d.balance, 0);
  const inCollectionsMine = state.debts
    .filter((d) => d.status === "collections" && d.owner === "me")
    .reduce((a, d) => a + d.balance, 0);
  const rollingBalances = state.debts
    .filter((d) => d.status === "rolling")
    .reduce((a, d) => a + d.balance, 0);

  const capitalReturned = income
    .filter((i) => i.returnOfCapital)
    .reduce((s, i) => s + toPeso(i, settings), 0);
  const { value: monthlyIncome, isOverride } = monthlyIncomeOf(state);
  // Household is everything; personal strips out a partner's earnings, which is
  // the figure that matters if the household ever has to run on one income.
  const monthlyIncomeMine = income
    .filter((i) => i.owner === "me")
    .reduce((s, i) => s + monthlyValue(i, settings), 0);
  const incomeIn = capitalReturned;

  return {
    total,
    count: transactions.length,
    days,
    perDay: total / days,
    projectedMonth,
    flexible,
    essential: total - flexible,
    debtPaid,
    oneOff,
    birthday,
    recurringBurn,
    unlabeled: sumWhere((t) => t.category === "other"),
    fixedMonthly,
    debtMonthly,
    paluwaganMonthly,
    paluwaganDue,
    nextPayout,
    committedMonthly,
    inCollections,
    inCollectionsMine,
    rollingBalances,
    collectionsCount: state.debts.filter((d) => d.status === "collections").length,
    incomeIn,
    capitalReturned,
    monthlyIncome,
    monthlyIncomeMine,
    incomeIsOverride: isOverride,
    netThisPeriod: incomeIn - total,
    savingsRate: monthlyIncome > 0 ? 1 - projectedMonth / monthlyIncome : null,
    monthlySurplus: monthlyIncome > 0 ? monthlyIncome - projectedMonth : null,
  };
}

export interface Insight {
  id: string;
  tone: "alert" | "warn" | "good" | "info";
  title: string;
  body: string;
}

export function buildInsights(state: FinanceState): Insight[] {
  const s = summarize(state);
  const out: Insight[] = [];
  const pct = (n: number) => `${(n * 100).toFixed(0)}%`;

  if (s.inCollections > 0) {
    out.push({
      id: "collections",
      tone: "alert",
      title: `You owe ${peso(s.inCollections)} that you stopped paying`,
      body: `${s.collectionsCount} accounts. Nothing is being paid on any of them, so they are not in your monthly budget — but they are the biggest problem you have.`,
    });
    out.push({
      id: "settle",
      tone: "info",
      title: "You can usually pay less than the full amount",
      body: "Old unpaid debt is often settled for a fraction of what the letters say. Ask each one in writing what they will accept to close the account for good. Never pay before you have that in writing.",
    });
  }

  if (s.committedMonthly > 0 && s.monthlyIncome > 0) {
    const share = s.committedMonthly / s.monthlyIncome;
    out.push({
      id: "committed",
      tone: share > 0.9 ? "alert" : "warn",
      title: `${pct(share)} of your money is spent before the month starts`,
      body: `${peso(s.monthlyIncome)} comes in. ${peso(
        s.committedMonthly
      )} is already promised. You have ${peso(s.monthlyIncome - s.committedMonthly)} left to play with.`,
    });
  }

  if (s.paluwaganMonthly > 0) {
    const when = s.nextPayout
      ? new Date(s.nextPayout.payoutDate).toLocaleDateString("en-PH", { month: "long", year: "numeric" })
      : "";
    out.push({
      id: "paluwagan",
      tone: "good",
      title: `${peso(s.paluwaganDue)} of paluwagan is coming back to you`,
      body: `You put in ${peso(s.paluwaganMonthly)} a month${
        s.nextPayout ? `, and the next ${peso(s.nextPayout.payout)} lands in ${when}` : ""
      }. This is savings, not a bill. Decide what each payout is for before it arrives.`,
    });
  }

  if (s.debtMonthly > 0 && s.monthlyIncome > 0) {
    out.push({
      id: "debt-service",
      tone: "warn",
      title: `${peso(s.debtMonthly)} a month goes to debt`,
      body: `That is ${pct(
        s.debtMonthly / s.monthlyIncome
      )} of what you earn, and it is barely shrinking what you owe. Ask each lender for the interest rate — some are costing you far more than others.`,
    });
  }

  if (s.monthlyIncome > 0 && s.fixedMonthly > 0) {
    out.push({
      id: "after-debt",
      tone: "good",
      title: `Debt-free, you would have ${peso(s.monthlyIncome - s.fixedMonthly)} spare every month`,
      body: "That is the prize. Everything you want — savings, school, a house, retiring — comes out of that number. Nothing else gets you there faster than clearing the debt.",
    });
  }

  if (s.monthlyIncomeMine > 0 && s.monthlyIncomeMine < s.monthlyIncome) {
    out.push({
      id: "single-income",
      tone: "info",
      title: `${peso(s.monthlyIncome - s.monthlyIncomeMine)} of your income is your husband's`,
      body: `On your own you bring in ${peso(
        s.monthlyIncomeMine
      )}. Worth knowing, because your bills are ${peso(s.committedMonthly)}.`,
    });
  }

  if (state.income.some((i) => i.currency === "USD")) {
    out.push({
      id: "fx",
      tone: "info",
      title: "You earn dollars and spend pesos",
      body: `Right now ₱${state.settings.usdPhpRate} to the dollar. If the peso gets stronger, your income drops without you doing anything. Keep an eye on it.`,
    });
  }

  if (s.unlabeled > 0) {
    out.push({
      id: "unlabeled",
      tone: "warn",
      title: `${peso(s.unlabeled)} of spending has no name on it`,
      body: "You cannot cut what you cannot see. Open the Spending list and name them while you still remember.",
    });
  }

  return out;
}

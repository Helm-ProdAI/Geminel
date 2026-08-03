import { CATEGORY_MAP, CATEGORIES } from "./seed";
import type { Cadence, CategoryId, FinanceState, Income, Settings, Transaction, TxCadence } from "./types";

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
  // Each line projects on its own cadence rather than the whole week being
  // multiplied up, so monthly installments are not counted four times over.
  const projectedMonth = transactions.reduce((acc, t) => acc + monthlyCost(t, days), 0);

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
  const cats = categoryTotals(state.transactions);
  const out: Insight[] = [];
  const top = cats[0];
  const pct = (n: number) => `${(n * 100).toFixed(0)}%`;

  if (s.monthlyIncome <= 0) {
    out.push({
      id: "no-income",
      tone: "info",
      title: "Add your income",
      body: "Everything else here is measurable, but savings rate and affordability are not. Log what comes in on the Income ledger and this page starts telling you whether the burn is sustainable.",
    });
  } else if (s.savingsRate !== null && s.savingsRate < 0) {
    out.push({
      id: "deficit",
      tone: "alert",
      title: "Your repeating costs exceed your repeating income",
      body: `Run-rate is ${peso(s.projectedMonth)} a month against ${peso(
        s.monthlyIncome
      )} of income that actually repeats. The gap of ${peso(
        s.projectedMonth - s.monthlyIncome
      )} every month has to come from savings, a lump sum, or new debt. This is the first thing to fix.`,
    });
  } else if (s.savingsRate !== null && s.savingsRate < 0.2) {
    out.push({
      id: "thin-margin",
      tone: "warn",
      title: `You are saving about ${pct(s.savingsRate)} of income`,
      body: `A 20% savings rate is the usual floor for building an emergency fund at a reasonable speed. Closing the gap means trimming roughly ${peso(
        s.monthlyIncome * 0.2 - (s.monthlySurplus ?? 0)
      )} a month from flexible spending.`,
    });
  } else if (s.savingsRate !== null) {
    out.push({
      id: "healthy-rate",
      tone: "good",
      title: `Saving about ${pct(s.savingsRate)} of income`,
      body: `That is a healthy rate, and it leaves ${peso(
        s.monthlySurplus ?? 0
      )} a month free. Point it at your highest-interest debt first, then the emergency fund.`,
    });
  }

  if (s.monthlyIncomeMine > 0 && s.monthlyIncomeMine < s.monthlyIncome) {
    const partner = s.monthlyIncome - s.monthlyIncomeMine;
    const soloSurplus = s.monthlyIncomeMine - s.projectedMonth;
    out.push({
      id: "single-income",
      tone: soloSurplus >= 0 ? "info" : "warn",
      title: `${peso(partner)} a month of this is your husband's`,
      body: `Your own sources come to ${peso(s.monthlyIncomeMine)}. Against a ${peso(
        s.projectedMonth
      )} run-rate that alone would leave ${
        soloSurplus >= 0 ? `${peso(soloSurplus)} spare` : `a ${peso(Math.abs(soloSurplus))} shortfall`
      }. Worth knowing which side of the line you are on before you commit to anything long-term.`,
    });
  }

  if (s.capitalReturned > 0) {
    out.push({
      id: "capital",
      tone: "warn",
      title: `The ${peso(s.capitalReturned)} paluwagan is not income`,
      body: `It is your own contributions coming back. It spends like income, which is exactly why it is dangerous to plan around — it arrives once and then it is gone. Give it a job now: a debt it clears, or a fund it starts. Otherwise it quietly becomes ordinary spending.`,
    });
  }

  out.push({
    id: "burn",
    tone: s.perDay > 15000 ? "alert" : s.perDay > 8000 ? "warn" : "info",
    title: `${peso(s.perDay)} a day across ${s.days} days`,
    body: `You logged ${peso(s.total)} over ${s.count} transactions. Strip out the ${peso(
      s.oneOff
    )} flagged as one-off and the repeating cost is ${peso(
      s.recurringBurn
    )}. Projecting each line on its own rhythm gives ${peso(
      s.projectedMonth
    )} a month. If something is filed under the wrong rhythm, change it in the ledger and every figure here corrects itself.`,
  });

  if (s.debtPaid > 0) {
    out.push({
      id: "debt",
      tone: "warn",
      title: `${peso(s.debtPaid)} went to debt in one week`,
      body: `That is ${pct(s.debtPaid / s.total)} of everything you spent, spread across ${
        new Set(state.transactions.filter((t) => t.category === "debt").map((t) => t.merchant)).size
      } lenders. Servicing several balances at once is the expensive way to carry debt — list every balance and APR under Debts, then pay them down highest-rate first and stop spreading payments evenly.`,
    });
  }

  if (s.birthday > 0) {
    out.push({
      id: "birthday",
      tone: "info",
      title: `The birthday cost ${peso(s.birthday)}`,
      body: `That single event is ${pct(
        s.birthday / s.total
      )} of the period. It is not a problem in itself — it is a problem if it was unplanned. Events like this want a sinking fund: set aside a twelfth of the budget each month so the next one is already paid for when it arrives.`,
    });
  }

  if (s.unlabeled > 0) {
    out.push({
      id: "unlabeled",
      tone: "warn",
      title: `${peso(s.unlabeled)} is unaccounted for`,
      body: `Several ledger lines had amounts but no merchant, including one you marked "?". You cannot cut spending you cannot see. Open the ledger, filter to Unlabeled, and name them while you still remember.`,
    });
  }

  if (top && top.flexible) {
    out.push({
      id: "top-flex",
      tone: "info",
      title: `${top.label} is your largest category`,
      body: `${peso(top.total)} across ${top.count} transactions, ${pct(
        top.share
      )} of the period. This is discretionary, so it is where a cut is actually available to you. A 25% trim here frees ${peso(
        top.total * 0.25
      )} a week.`,
    });
  }

  const flexShare = s.total > 0 ? s.flexible / s.total : 0;
  if (flexShare > 0.5) {
    out.push({
      id: "flex-share",
      tone: "warn",
      title: `${pct(flexShare)} of spending is discretionary`,
      body: `${peso(
        s.flexible
      )} of the period went to things you chose rather than things you owed. That is uncomfortable to read but it is good news: it means the fix is within your control and does not require earning more first.`,
    });
  }

  const earners = state.income.filter((i) => !i.returnOfCapital);
  if (earners.length > 1) {
    const biggest = earners.reduce((a, b) =>
      monthlyValue(b, state.settings) > monthlyValue(a, state.settings) ? b : a
    );
    const share = monthlyValue(biggest, state.settings) / s.monthlyIncome;
    if (share > 0.25) {
      out.push({
        id: "concentration",
        tone: "info",
        title: `${biggest.source} is ${pct(share)} of household income`,
        body: `Across ${earners.length} contracts that is your largest single dependency. Contract income has no notice period — losing this one costs ${peso(
          monthlyValue(biggest, state.settings)
        )} a month overnight. That is the case for an emergency fund sized in months, not pesos.`,
      });
    }
  }

  if (state.income.some((i) => i.currency === "USD")) {
    out.push({
      id: "fx",
      tone: "info",
      title: "You earn in dollars and spend in pesos",
      body: `Every figure here converts at ₱${state.settings.usdPhpRate} to the dollar. A five-peso move in that rate swings household income by about ${peso(
        state.income.filter((i) => i.currency === "USD" && i.cadence === "monthly").reduce((a, i) => a + i.amount, 0) * 5
      )} a month — up or down, without you doing anything. Keep the rate current, and treat a strong-peso month as the stress test.`,
    });
  }

  const cash = cats.find((c) => c.id === "cash");
  if (cash && cash.total > 0) {
    out.push({
      id: "cash",
      tone: "info",
      title: `${peso(cash.total)} withdrawn as cash`,
      body: "Cash leaves no trail, so it quietly becomes the biggest blind spot in any tracker. Either log what it goes to on the day, or move those purchases to card so they categorise themselves.",
    });
  }

  return out;
}

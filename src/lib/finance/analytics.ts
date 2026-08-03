import { CATEGORY_MAP, CATEGORIES } from "./seed";
import type { CategoryId, FinanceState, Transaction } from "./types";

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
  recurringBurn: number;
  unlabeled: number;
  savingsRate: number | null;
}

export function summarize(state: FinanceState): Summary {
  const { transactions, settings } = state;
  const total = transactions.reduce((s, t) => s + t.amount, 0);
  const days = daysInPeriod(settings.periodStart, settings.periodEnd);
  const sumWhere = (fn: (t: Transaction) => boolean) =>
    transactions.filter(fn).reduce((s, t) => s + t.amount, 0);

  const flexible = sumWhere((t) => CATEGORY_MAP[t.category].flexible);
  const debtPaid = sumWhere((t) => t.category === "debt");
  const oneOff = sumWhere((t) => t.category === "birthday");
  // What the week costs once the birthday is stripped out — the number that
  // actually repeats month to month.
  const recurringBurn = total - oneOff;

  return {
    total,
    count: transactions.length,
    days,
    perDay: total / days,
    projectedMonth: (recurringBurn / days) * 30,
    flexible,
    essential: total - flexible,
    debtPaid,
    oneOff,
    recurringBurn,
    unlabeled: sumWhere((t) => t.category === "other"),
    savingsRate:
      settings.monthlyIncome > 0
        ? 1 - (recurringBurn / days) * 30 / settings.monthlyIncome
        : null,
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

  if (s.savingsRate !== null) {
    if (s.savingsRate < 0) {
      out.push({
        id: "deficit",
        tone: "alert",
        title: "You are spending more than you earn",
        body: `At this pace your run-rate is ${peso(s.projectedMonth)} a month against income of ${peso(
          state.settings.monthlyIncome
        )}. That gap of ${peso(
          s.projectedMonth - state.settings.monthlyIncome
        )} has to come from savings or new debt every month. This is the first thing to fix.`,
      });
    } else if (s.savingsRate < 0.2) {
      out.push({
        id: "thin-margin",
        tone: "warn",
        title: `You are saving about ${(s.savingsRate * 100).toFixed(0)}% of income`,
        body: `A 20% savings rate is the usual floor for building an emergency fund at a reasonable speed. Closing the gap needs roughly ${peso(
          state.settings.monthlyIncome * 0.2 - (state.settings.monthlyIncome - s.projectedMonth)
        )} a month trimmed from flexible spending.`,
      });
    } else {
      out.push({
        id: "healthy-rate",
        tone: "good",
        title: `Saving about ${(s.savingsRate * 100).toFixed(0)}% of income`,
        body: "That is a healthy rate. Point the surplus at your highest-interest debt first, then the emergency fund.",
      });
    }
  } else {
    out.push({
      id: "no-income",
      tone: "info",
      title: "Add your monthly income",
      body: "Everything else here is measurable, but savings rate and affordability are not. Enter your income in Settings and this page starts telling you whether the burn is sustainable.",
    });
  }

  out.push({
    id: "burn",
    tone: s.perDay > 15000 ? "alert" : s.perDay > 8000 ? "warn" : "info",
    title: `${peso(s.perDay)} a day across ${s.days} days`,
    body: `You logged ${peso(s.total)} over ${s.count} transactions. Strip out the one-off birthday spend of ${peso(
      s.oneOff
    )} and the repeating cost is ${peso(s.recurringBurn)}, which annualises to about ${peso(
      s.projectedMonth * 12,
      { compact: true }
    )} a year. The birthday will not repeat; the rest will.`,
  });

  if (s.debtPaid > 0) {
    out.push({
      id: "debt",
      tone: "warn",
      title: `${peso(s.debtPaid)} went to debt in one week`,
      body: `That is ${((s.debtPaid / s.total) * 100).toFixed(
        0
      )}% of everything you spent, spread across ${
        new Set(state.transactions.filter((t) => t.category === "debt").map((t) => t.merchant)).size
      } lenders. Servicing several balances at once is the expensive way to carry debt — list every balance and APR under Debts, then pay them down highest-rate first and stop spreading payments evenly.`,
    });
  }

  if (s.oneOff > 0) {
    out.push({
      id: "birthday",
      tone: "info",
      title: `The birthday cost ${peso(s.oneOff)}`,
      body: `That single event is ${((s.oneOff / s.total) * 100).toFixed(
        0
      )}% of the period. It is not a problem in itself — it is a problem if it was unplanned. Events like this want a sinking fund: set aside a twelfth of the budget each month so the next one is already paid for when it arrives.`,
    });
  }

  if (s.unlabeled > 0) {
    out.push({
      id: "unlabeled",
      tone: "warn",
      title: `${peso(s.unlabeled)} is unaccounted for`,
      body: `Several ledger lines had amounts but no merchant, including one you marked "?". You cannot cut spending you cannot see. Open Transactions, filter to Unlabeled, and name them while you still remember.`,
    });
  }

  if (top && top.flexible) {
    out.push({
      id: "top-flex",
      tone: "info",
      title: `${top.label} is your largest category`,
      body: `${peso(top.total)} across ${top.count} transactions, ${(top.share * 100).toFixed(
        0
      )}% of the period. This is discretionary, so it is where a cut is actually available to you. A 25% trim here frees ${peso(
        top.total * 0.25
      )} a week.`,
    });
  }

  const flexShare = s.total > 0 ? s.flexible / s.total : 0;
  if (flexShare > 0.5) {
    out.push({
      id: "flex-share",
      tone: "warn",
      title: `${(flexShare * 100).toFixed(0)}% of spending is discretionary`,
      body: `${peso(
        s.flexible
      )} of the period went to things you chose rather than things you owed. That is uncomfortable to read but it is good news: it means the fix is within your control and does not require earning more first.`,
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

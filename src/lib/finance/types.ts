export type CategoryId =
  | "birthday"
  | "debt"
  | "shopping"
  | "food"
  | "groceries"
  | "transport"
  | "health"
  | "subscriptions"
  | "family"
  | "bills"
  | "cash"
  | "other";

export interface Category {
  id: CategoryId;
  label: string;
  color: string;
  /** Spending here is discretionary and can realistically be cut. */
  flexible: boolean;
}

export interface Transaction {
  id: string;
  /** ISO date (yyyy-mm-dd). */
  date: string;
  /** Positive number in PHP. */
  amount: number;
  merchant: string;
  category: CategoryId;
  note?: string;
  /**
   * True when the date came from the ledger period rather than a receipt.
   * The handwritten notebook recorded amounts without dates.
   */
  dateEstimated?: boolean;
  /**
   * How this spending repeats, which is what the run-rate projects from.
   * Defaults to "period" — assume it recurs as often as this period does.
   * A monthly installment that happened to land in this week is "monthly",
   * not "period", or projecting the week would count it four times over.
   */
  cadence?: TxCadence;
}

/** "period" means it recurs once per ledger period, whatever that period is. */
export type TxCadence = "once" | "period" | "weekly" | "monthly";

/** How often a money-in line repeats. */
export type Cadence = "once" | "weekly" | "semimonthly" | "monthly";

export type Currency = "PHP" | "USD";

/** Whose income it is. Household totals include both; personal totals do not. */
export type Owner = "me" | "partner";

export interface Income {
  id: string;
  date: string;
  /** In `currency`, not always PHP. Converted at settings.usdPhpRate. */
  amount: number;
  currency: Currency;
  owner: Owner;
  source: string;
  cadence: Cadence;
  /**
   * True when the money is your own capital coming back rather than new
   * earnings — a paluwagan payout, a matured savings pot, a repaid loan.
   * It spends the same but it cannot be counted on as income.
   */
  returnOfCapital?: boolean;
  note?: string;
  dateEstimated?: boolean;
}

export interface Debt {
  id: string;
  name: string;
  /** Outstanding balance in PHP; 0 when unknown. */
  balance: number;
  /** Paid during the current period. */
  paidThisPeriod: number;
  /** Annual interest rate as a percentage, when known. */
  apr?: number;
  note?: string;
}

export interface Goal {
  id: string;
  name: string;
  target: number;
  saved: number;
  /** ISO date the goal should be met by. */
  targetDate?: string;
  note?: string;
}

export interface Settings {
  /**
   * Manual override in PHP. When 0, income is derived from the recurring
   * entries on the Income ledger instead.
   */
  monthlyIncome: number;
  /** Pesos per US dollar. Every USD income line converts at this rate. */
  usdPhpRate: number;
  /** Monthly ceiling for flexible categories. */
  monthlyBudget: number;
  periodStart: string;
  periodEnd: string;
}

export interface FinanceState {
  transactions: Transaction[];
  income: Income[];
  debts: Debt[];
  goals: Goal[];
  settings: Settings;
}

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
  monthlyIncome: number;
  /** Monthly ceiling for flexible categories. */
  monthlyBudget: number;
  periodStart: string;
  periodEnd: string;
}

export interface FinanceState {
  transactions: Transaction[];
  debts: Debt[];
  goals: Goal[];
  settings: Settings;
}

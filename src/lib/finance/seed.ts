import type { Category, CategoryId, Debt, FinanceState, Goal, Settings, Transaction } from "./types";

export const PERIOD_START = "2026-07-28";
export const PERIOD_END = "2026-08-03";

export const CATEGORIES: Category[] = [
  { id: "birthday", label: "Birthday event", color: "#D47CAA", flexible: true },
  { id: "debt", label: "Debt & cards", color: "#E7C98A", flexible: false },
  { id: "shopping", label: "Shopping", color: "#7C82D4", flexible: true },
  { id: "food", label: "Food & dining", color: "#6FB8D4", flexible: true },
  { id: "groceries", label: "Groceries", color: "#6EC4A0", flexible: false },
  { id: "transport", label: "Transport", color: "#9C8AD4", flexible: false },
  { id: "health", label: "Health & wellness", color: "#5FD1C4", flexible: false },
  { id: "subscriptions", label: "Subscriptions", color: "#D49C6E", flexible: true },
  { id: "family", label: "Family & gifts", color: "#D4B86E", flexible: true },
  { id: "bills", label: "Bills & services", color: "#8FA3C8", flexible: false },
  { id: "cash", label: "Cash withdrawn", color: "#B0B8CC", flexible: false },
  { id: "other", label: "Unlabeled", color: "#6E7691", flexible: true },
];

export const CATEGORY_MAP: Record<CategoryId, Category> = Object.fromEntries(
  CATEGORIES.map((c) => [c.id, c])
) as Record<CategoryId, Category>;

/**
 * Transcribed from the handwritten ledger covering 28 Jul – 3 Aug 2026.
 * The notebook recorded amounts and merchants but no per-transaction dates,
 * so every row carries the period start and is flagged `dateEstimated`.
 * The struck-through "4017.68 Manam" duplicate is intentionally excluded —
 * that amount appears once, inside the birthday block.
 */
const RAW: Array<[string, number, CategoryId, string?]> = [
  // — Birthday block. The notebook's own subtotal, 42,365.45, reconciles exactly.
  ["Giveaway", 3600, "birthday"],
  ["Food and resort", 23000, "birthday"],
  ["Amare", 4103, "birthday"],
  ["Gift & clothes", 7644.77, "birthday"],
  ["Manam", 4017.68, "birthday"],

  // — Column 1
  ["Vaccine", 11600, "health"],
  ["Adobe", 598.14, "subscriptions"],
  ["CapCut", 3144.56, "subscriptions"],
  ["Gas", 3003.29, "transport"],
  ["Subway", 1250, "food"],
  ["Ken", 400, "family"],
  ["Maribank", 150, "debt"],
  ["Shopee", 2631, "shopping"],
  ["Grocery", 1100, "groceries"],
  ["North Park", 1300, "food"],
  ["PAL", 2000, "transport"],
  ["Grab", 576, "transport"],
  ["Resto", 1013, "food"],
  ["Toys", 1198, "shopping"],
  ["Unlabeled", 2295, "other", "Marked '?' in the ledger"],
  ["Mochi", 615, "food"],
  ["Pinkberry", 185, "food"],
  ["Marcel", 5000, "family"],
  ["Shopee loan", 5002.86, "debt"],

  // — Column 2
  ["Grocery — Unimart", 5018, "groceries"],
  ["Withdrawal", 8000, "cash"],
  ["Watsons", 3043.61, "health"],
  ["Starbucks", 700, "food"],
  ["Grab", 672.8, "transport"],
  ["Grab", 413, "transport"],
  ["PNB", 2658.2, "debt"],
  ["Shopee", 2031, "shopping"],
  ["FIT", 1259, "health"],
  ["Atome", 14506.8, "debt"],
  ["Cash", 935, "cash"],
  ["Unlabeled", 228, "other"],
  ["Unlabeled", 8354.45, "other"],
  ["Shopee", 232, "shopping"],
  ["Shopee", 812, "shopping"],
  ["Load", 181, "bills"],
  ["Mama", 500, "family"],
  ["Sarah", 300, "family"],
  ["Deus", 5000, "family"],
  ["Gelo", 1500, "family"],
  ["Kape", 610, "food"],
  ["Foot spa", 1600, "health"],
  ["Unlabeled", 599, "other"],
  ["Unlabeled", 755, "other"],
  ["Mama", 500, "family"],
  ["Sarah", 300, "family"],

  // — Column 3
  ["Unlabeled", 2000, "other"],
  ["Service", 5500, "bills"],
  ["RCBC", 160, "debt"],
  ["Shopee", 300, "shopping"],
  ["Clothes", 2625, "shopping"],
  ["Unlabeled", 424, "other"],
  ["Sarah", 800, "family"],
  ["Chat", 300, "other"],
  ["Unlabeled", 620, "other"],

  // — Stated separately by you, not in the notebook
  ["BPI credit card payment", 14000, "debt"],
];

export const SEED_TRANSACTIONS: Transaction[] = RAW.map(([merchant, amount, category, note], i) => ({
  id: `seed-${String(i + 1).padStart(3, "0")}`,
  date: PERIOD_START,
  amount,
  merchant,
  category,
  note,
  dateEstimated: true,
}));

/**
 * Balances are unknown from the ledger and start at 0 — set them in the app.
 * `paidThisPeriod` is derived from the transactions above.
 */
export const SEED_DEBTS: Debt[] = [
  { id: "bpi", name: "BPI credit card", balance: 0, paidThisPeriod: 14000, note: "₱14,000 paid this period" },
  { id: "atome", name: "Atome", balance: 0, paidThisPeriod: 14506.8 },
  { id: "shopee-loan", name: "Shopee loan", balance: 0, paidThisPeriod: 5002.86 },
  { id: "pnb", name: "PNB", balance: 0, paidThisPeriod: 2658.2 },
  {
    id: "rcbc",
    name: "RCBC",
    balance: 23704.99,
    paidThisPeriod: 160,
    note: "Balance read from the ₱23,704.99 figure bracketed beside RCBC — confirm this",
  },
  { id: "maribank", name: "Maribank", balance: 0, paidThisPeriod: 150 },
];

export const SEED_GOALS: Goal[] = [
  {
    id: "emergency",
    name: "Emergency fund",
    target: 150000,
    saved: 0,
    note: "Starter target — roughly 3 months of essential spending. Edit to fit your real costs.",
  },
  {
    id: "debt-free",
    name: "Clear revolving card debt",
    target: 23704.99,
    saved: 0,
    note: "Set to the RCBC figure. Add your other card balances once you have the statements.",
  },
];

export const SEED_SETTINGS: Settings = {
  monthlyIncome: 0,
  monthlyBudget: 0,
  periodStart: PERIOD_START,
  periodEnd: PERIOD_END,
};

export const SEED_STATE: FinanceState = {
  transactions: SEED_TRANSACTIONS,
  debts: SEED_DEBTS,
  goals: SEED_GOALS,
  settings: SEED_SETTINGS,
};

import type {
  Category,
  CategoryId,
  Debt,
  FinanceState,
  Goal,
  Commitment,
  Income,
  Owner,
  Paluwagan,
  Phase,
  Settings,
  Transaction,
  TxCadence,
} from "./types";

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
  ["Vaccine", 11600, "health", "Annual — flagged one-off"],
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

/**
 * Spending that will not repeat: the birthday block by definition, the vaccine
 * because it is annual.
 */
const ONCE = new Set(["Vaccine"]);

/**
 * Lines that are monthly commitments which merely happened to land inside this
 * week. Without this, projecting the week would bill each of them four times a
 * month and overstate the run-rate badly — card and loan installments are the
 * worst offenders because they are large.
 */
const MONTHLY = new Set([
  "BPI credit card payment",
  "Atome",
  "Shopee loan",
  "PNB",
  "RCBC",
  "Maribank",
  "Adobe",
  "CapCut",
]);

function cadenceFor(merchant: string, category: CategoryId): TxCadence {
  if (category === "birthday" || ONCE.has(merchant)) return "once";
  if (MONTHLY.has(merchant)) return "monthly";
  return "period";
}

export const SEED_TRANSACTIONS: Transaction[] = RAW.map(([merchant, amount, category, note], i) => ({
  id: `seed-${String(i + 1).padStart(3, "0")}`,
  date: PERIOD_START,
  amount,
  merchant,
  category,
  note,
  dateEstimated: true,
  cadence: cadenceFor(merchant, category),
}));

/**
 * Recurring income by source, in the currency it is actually paid in.
 * The four USD contracts are yours; the last two are your husband's, so the
 * app can show household and personal totals separately.
 *
 * The paluwagan is the one PHP line and the one that is not earnings — it is
 * your own contributions maturing, so it is excluded from every projection.
 */
export const SEED_INCOME: Income[] = [
  { id: "inc-mla", date: PERIOD_START, amount: 1900, currency: "USD", owner: "me", source: "My Legal Academy", cadence: "monthly" },
  { id: "inc-thrive", date: PERIOD_START, amount: 2300, currency: "USD", owner: "me", source: "Thrive Academy", cadence: "monthly" },
  { id: "inc-wfmo", date: PERIOD_START, amount: 2500, currency: "USD", owner: "me", source: "WFMO", cadence: "monthly" },
  { id: "inc-superiorpro", date: PERIOD_START, amount: 500, currency: "USD", owner: "me", source: "SuperiorPro", cadence: "monthly" },
  { id: "inc-h-wfmo", date: PERIOD_START, amount: 1280, currency: "USD", owner: "partner", source: "WFMO", cadence: "monthly" },
  { id: "inc-h-mla", date: PERIOD_START, amount: 640, currency: "USD", owner: "partner", source: "My Legal Academy", cadence: "monthly" },
];

/**
 * The monthly budget as written down. `fixed` lines are living costs; `debt`
 * lines are what is being serviced each month on accounts still rolling.
 * Together they are the run-rate, which is real evidence rather than a
 * projection from one week of receipts.
 */
export const SEED_COMMITMENTS: Commitment[] = [
  ...(
    [
      ["Rent", 35000],
      ["Car", 26342],
      ["Water", 800],
      ["Electricity", 12000],
      ["Gas", 7000],
      ["Grocery", 25000],
      ["School service", 5500],
      ["Globe WiFi", 1699],
      ["Converge WiFi", 1898],
      ["Church", 8000],
      ["Child support", 16000],
      ["HMO", 8000],
      ["Insurance", 10000],
      ["PhilHealth", 1000],
      ["Wants", 10000],
      ["Eat out", 10000],
      ["Nanny", 10000],
      ["Subscriptions", 10000],
      ["Deus (manpower)", 20000],
    ] as Array<[string, number]>
  ).map(([name, amount], i) => ({
    id: `comf-${String(i + 1).padStart(2, "0")}`,
    name,
    amount,
    kind: "fixed" as const,
    owner: "me" as const,
  })),

  // Installment loans, each with a known end. Unlike the cards these cannot be
  // cleared early by simply not spending — they run their term out.
  ...(
    [
      ["Tonik", 3110.93, 13, 24],
      ["Atome", 5603.89, 5, 9],
      ["MAC", 16165, 2, 6],
    ] as Array<[string, number, number, number]>
  ).map(([name, amount, paymentsMade, paymentsTotal], i) => ({
    id: `comd-${i + 1}`,
    name,
    amount,
    kind: "debt" as const,
    owner: "me" as const,
    paymentsMade,
    paymentsTotal,
  })),
];

/**
 * Paluwagan slots. The contribution leaves every cycle; the payout lands once,
 * on a date that is already known. Those dates are the only large sums this
 * household has coming, so they are worth planning around rather than
 * discovering.
 */
export const SEED_PALUWAGAN: Paluwagan[] = (
  [
    // Already collected during the ledger period — kept for the record.
    ["Earlier slot", 0, "monthly", 141872, "2026-08-01", "Received 28 Jul – 3 Aug; contribution not recorded"],
    ["B7 40K", 4000, "biweekly", 40000, "2026-09-15"],
    ["B11 50K", 12500, "monthly", 50000, "2026-10-01"],
    ["B12 50K", 12500, "monthly", 50000, "2026-11-01"],
    ["B8 40K", 8000, "biweekly", 40000, "2026-11-01", "Written as Oct–Nov — confirm the month"],
    ["B 150K", 15000, "monthly", 150000, "2027-02-01"],
    ["B19 100K", 20000, "monthly", 100000, "2027-03-01"],
    ["B13 50K", 12500, "monthly", 50000, "2027-04-01"],
    ["B10 100K", 20000, "monthly", 100000, "2027-05-01"],
  ] as Array<[string, number, "monthly" | "biweekly", number, string, string?]>
).map(([name, contribution, cadence, payout, payoutDate, note], i) => ({
  id: `pal-${i + 1}`,
  name,
  contribution,
  cadence,
  payout,
  payoutDate,
  note,
  received: contribution === 0,
}));

/**
 * Credit lines carrying a balance. The plan is to clear each in full and stop
 * using them, so these are one-time payoffs rather than a monthly commitment —
 * which is why none of them appear in the run-rate.
 */
const CARDS: Array<[string, number, Owner]> = [
  ["BPI", 132000, "me"],
  ["UB", 62000, "me"],
  ["Atome — Ella", 28900, "me"],
  ["Maya — Ella", 21900, "me"],
  ["SPay — Gelo", 22500, "partner"],
  ["Atome — Gelo", 17500, "partner"],
  ["Maya — Gelo", 7600, "partner"],
];

/**
 * Already defaulted and with recovery agents. Face value is what is claimed,
 * not necessarily what settles — collections accounts are usually negotiable,
 * which is exactly why they need listing rather than avoiding.
 */
const COLLECTIONS: Array<[string, number, string?]> = [
  ["Revi", 200000],
  ["Home Credit 2", 137414.27],
  ["GCredit", 51887.43],
  ["GGives", 38625.94],
  ["Tokcash", 34214],
  ["FT Lending", 35000],
  ["BOO", 30000],
  ["Home Credit 3", 30351.1],
  ["Juanhand", 28000],
  ["Tala", 27346.2],
  ["Tonik", 26611.32],
  ["Salmon", 25000],
  ["Cashalo", 20304.47],
  ["Cashalo 2", 20000],
  ["Bluease", 20000],
  ["GGives B", 19371.3],
  ["Home Credit 1", 15599.21],
  ["Quarta 4", 13044.45],
  ["GGives A", 5931.35],
];

/** Gelo's accounts, tracked separately so household and personal stay distinct. */
const COLLECTIONS_GELO: Array<[string, number]> = [
  ["CIMB Revi", 208000],
  ["CIMB Loan", 50000],
  ["GGives 1", 50000],
  ["GGives 2", 20000],
  ["GGives 3", 15000],
  ["GCredit", 10000],
];

export const SEED_DEBTS: Debt[] = [
  {
    id: "car-loan",
    name: "Car loan",
    balance: 633137.46,
    paidThisPeriod: 26362,
    status: "rolling",
    owner: "me",
    note: "₱738,136 over 28 months; ₱633,137.46 to settle early",
  },
  ...CARDS.map(([name, balance, owner], i) => ({
    id: `card-${i + 1}`,
    name,
    balance,
    paidThisPeriod: 0,
    status: "rolling" as const,
    owner,
    note: "Clear in full, then stop using it",
  })),
  ...COLLECTIONS.map(([name, balance, note], i) => ({
    id: `col-${i + 1}`,
    name,
    balance,
    paidThisPeriod: 0,
    status: "collections" as const,
    owner: "me" as const,
    note,
  })),
  ...COLLECTIONS_GELO.map(([name, balance], i) => ({
    id: `colg-${i + 1}`,
    name,
    balance,
    paidThisPeriod: 0,
    status: "collections" as const,
    owner: "partner" as const,
  })),
];

/**
 * Sequenced, not parallel. Every figure is an estimate to be replaced with a
 * real quote — the point is the order and the rough scale, which is what
 * decides where the next peso goes.
 */
export const SEED_GOALS: Goal[] = (
  [
    [
      "Settle collections",
      565851,
      1,
      "Half of the ₱1,131,701 face value — a realistic settlement estimate. Every peso here buys back roughly two of debt, which no investment will ever match.",
    ],
    [
      "Clear the cards",
      292400,
      1,
      "All seven balances, paid in full and then left alone. About 1.6 months of your surplus.",
    ],
    [
      "Term life for both of you",
      60000,
      2,
      "Six children and no cover is the single largest unhedged risk here. Buy plain term, not VUL — roughly ₱15–30k a year each for ₱10M of cover.",
    ],
    [
      "Emergency fund — floor",
      1454754,
      2,
      "Six months of living costs. This is the number that actually stops the next emergency becoming the next loan.",
    ],
    [
      "College — eldest",
      700000,
      2,
      "Needed in about two years. The only goal here with a deadline you cannot move.",
    ],
    ["Annulment", 350000, 2, "Estimate — get three quotes. Filing, counsel and psychological evaluation."],
    [
      "Emergency fund — full",
      3236688,
      3,
      "Your stated 6× income. Worth reaching, but only after the floor above and the eldest's tuition.",
    ],
    ["Wedding", 250000, 3, "After the annulment, and sized to what is left rather than what is dreamed."],
    [
      "College — the other five",
      3500000,
      3,
      "Ages 12, 8, 7, 2 and 1. Staggered, so it funds over a decade rather than at once.",
    ],
    ["House down payment", 2400000, 3, "20% on a ₱12M 4BR. Reachable once debt-free — not before."],
    ["Passive income portfolio", 5000000, 4, "Index funds and dividend equities. At ~4% this covers a third of current living costs."],
    ["Retirement", 15000000, 4, "You have no employer pension. This is entirely self-funded."],
    ["Land investment", 1500000, 4, "Illiquid — only after the portfolio above is running."],
    ["Business capital", 500000, 4, "The hedge against freelance income. Fund it from surplus, never from debt."],
  ] as Array<[string, number, Phase, string]>
).map(([name, target, phase, note], i) => ({
  id: `goal-${String(i + 1).padStart(2, "0")}`,
  name,
  target,
  saved: 0,
  phase,
  note,
}));

/**
 * Derived from the peso amounts that actually landed this period: SuperiorPro's
 * ₱29,574.29 against $500 gives 59.15, and the WFMO and Thrive receipts match
 * at roughly a half-month each on the same rate. Confirm against your own
 * post-remittance rate.
 */
export const DEFAULT_USD_PHP = 59.15;

export const SEED_SETTINGS: Settings = {
  monthlyIncome: 0,
  usdPhpRate: DEFAULT_USD_PHP,
  monthlyBudget: 0,
  periodStart: PERIOD_START,
  periodEnd: PERIOD_END,
};

export const SEED_STATE: FinanceState = {
  transactions: SEED_TRANSACTIONS,
  income: SEED_INCOME,
  commitments: SEED_COMMITMENTS,
  paluwagan: SEED_PALUWAGAN,
  debts: SEED_DEBTS,
  goals: SEED_GOALS,
  settings: SEED_SETTINGS,
};

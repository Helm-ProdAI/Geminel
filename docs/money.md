# Money — personal ledger

A mobile-first spending tracker at `/money`. Built for the 28 Jul – 3 Aug 2026 period
transcribed from a handwritten notebook, then usable ongoing.

## Using it on a phone

Open `/money` on the deployed site, then **Share → Add to Home Screen** (iOS) or
**⋮ → Install app** (Android). It launches full-screen without browser chrome via
`public/money.webmanifest`.

## Storage

Everything lives in `localStorage` under `geminel.money.v1` — no database, no
network calls, no account. That means:

- Data stays on the device that entered it, and is not shared between phone and laptop.
- Clearing site data wipes it. **Export JSON** in Settings makes a backup.
- Nothing about your finances leaves the device.

Moving to Supabase later means swapping `useFinance` in `src/lib/finance/store.ts`
for a data layer with the same shape; nothing else needs to change.

## Tabs

| Tab | What it does |
| --- | --- |
| Overview | Period total, daily rate, debt vs one-off split, monthly run-rate, category breakdown |
| Ledger | Two sides. **Spending**: search, filter, tap a row to edit or delete. **Income**: sources with a cadence that decides what counts as repeating |
| Debts | Accounts ordered highest-APR-first (avalanche). Enter balances and rates to make the order meaningful |
| Goals | Targets with progress, and months-to-target computed from your monthly surplus |
| Advice | Generated findings and a five-step plan, recomputed from whatever is currently in the ledger |

## How the run-rate is computed

Projecting a single week by multiplying it by 30/7 is wrong whenever the week
contained monthly commitments. This ledger did — roughly ₱36k of card and loan
installments landed inside it — and naive scaling billed each of them four times
over.

So every line carries its own `cadence` and projects on its own rhythm:

| Cadence | Monthly contribution |
| --- | --- |
| `once` | 0 — excluded entirely |
| `period` (default) | `amount × 30 / periodDays` |
| `weekly` | `amount × 52 / 12` |
| `monthly` | `amount` |

Income works the same way, which is what keeps a one-off lump sum from being
multiplied into recurring income that does not exist. Income lines also carry
`returnOfCapital` for money that is your own savings coming back rather than
earnings — a paluwagan payout is the case here. It spends like income but must
never be planned around, so it is excluded from every projection.

Monthly income is derived from the income ledger. `settings.monthlyIncome` is a
manual override, used only when non-zero.

## The seeded data

`src/lib/finance/seed.ts` holds the transcribed ledger. Two things worth knowing:

- **No dates.** The notebook recorded amounts and merchants but not dates. Every seeded
  row carries the period start and is flagged `dateEstimated`, which the UI shows as
  "date not recorded". Editing a row's date clears the flag.
- **One exclusion.** A struck-through `4017.68 Manam` line appears in the notebook a
  second time; it is excluded, since that amount is already counted in the birthday block.
- **Seeded cadences are judgement calls.** Card and loan lines (BPI, Atome, Shopee
  loan, PNB, RCBC, Maribank) plus the two subscriptions are seeded `monthly`; the
  birthday block and the vaccine are `once`. Everything else defaults to `period`.
  All of it is editable per row.

The birthday block reconciles exactly against the subtotal written in the notebook
(₱42,365.45), which is the check that the transcription of that section is correct.

Balances were not in the notebook, only payments — so every debt starts at 0 except
RCBC, which is seeded from the ₱23,704.99 figure bracketed beside it and marked for
confirmation.

## Adding a category

Add an entry to `CATEGORIES` in `src/lib/finance/seed.ts` and the union in
`src/lib/finance/types.ts`. The `flexible` flag drives the discretionary-share
calculations in `analytics.ts` and the "flex" tags in the UI — set it to `true` only
for spending that can realistically be cut.

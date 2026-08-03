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
| Ledger | All transactions — search, filter by category, tap any row to edit or delete, `+ Add` for new |
| Debts | Accounts ordered highest-APR-first (avalanche). Enter balances and rates to make the order meaningful |
| Goals | Targets with progress, and months-to-target computed from your monthly surplus |
| Advice | Generated findings and a five-step plan, recomputed from whatever is currently in the ledger |

## The seeded data

`src/lib/finance/seed.ts` holds the transcribed ledger. Two things worth knowing:

- **No dates.** The notebook recorded amounts and merchants but not dates. Every seeded
  row carries the period start and is flagged `dateEstimated`, which the UI shows as
  "date not recorded". Editing a row's date clears the flag.
- **One exclusion.** A struck-through `4017.68 Manam` line appears in the notebook a
  second time; it is excluded, since that amount is already counted in the birthday block.

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

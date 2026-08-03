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
| Ledger | Three sides. **Monthly**: the written budget — living costs and debt servicing. **Spending**: the transaction ledger. **Income**: sources with a cadence |
| Debts | Split by status. **Collections** (defaulted, largest first) and **Rolling** (serviced monthly, highest-APR first) |
| Goals | Targets with progress, and months-to-target computed from your monthly surplus |
| Advice | Generated findings and a five-step plan, recomputed from whatever is currently in the ledger |

## How the run-rate is computed

**When commitments exist they are the run-rate.** A written monthly budget is far
better evidence than extrapolating one week of receipts, so `summarize` uses the
sum of `commitments` whenever any are present. The projection below is the
fallback for a state with none.

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

## Currency

Income is earned in USD and spent in PHP, so each income line carries its own
`currency` and converts at `settings.usdPhpRate`. Spending is PHP throughout.

The seeded rate, 59.15, is derived rather than guessed: SuperiorPro's $500 landed
as ₱29,574.29 in the period, and the WFMO and Thrive receipts reconcile at roughly
a half-month each on the same rate. It is editable in the Income tab and should be
set to the post-remittance rate actually received, not mid-market.

Income lines also carry an `owner` (`me` / `partner`) so the app can separate
household income from what the primary earner brings in alone — the figure that
matters if the household ever has to run on one income.

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

## Debt status

Accounts carry a `status`:

- **`rolling`** — being serviced monthly. Ordered highest-APR-first, the standard
  avalanche, because interest compounds hardest at the top.
- **`collections`** — already defaulted and with recovery agents. Ordered largest
  first instead, because these are settled rather than amortised and a negotiated
  discount on a big balance frees more than clearing several small ones.

Collections balances are excluded from the run-rate — nothing is being paid on
them — but surfaced prominently on Overview, since leaving them out of the monthly
figures makes the position look far better than it is.

Debts also carry an `owner`, so household and personal exposure stay distinct.

## Adding a category

Add an entry to `CATEGORIES` in `src/lib/finance/seed.ts` and the union in
`src/lib/finance/types.ts`. The `flexible` flag drives the discretionary-share
calculations in `analytics.ts` and the "flex" tags in the UI — set it to `true` only
for spending that can realistically be cut.

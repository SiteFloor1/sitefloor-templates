# The lease-return check

| | |
|---|---|
| Feature id | `lease-return` (page `lease-return`), Signature |
| Config | `leaseReturn`: `{ kicker?, title, intro, photo?, body?, message, note? }`; `leasePrices`: `{ source: "sheet"\|"simulated", csvUrl }` |
| Files | `lease-return.njk`, `.css`, `.js`, `sheet-provider.js`; the items, source and sums in `src/kits/detailing/lib/lease.js`; the page template `src/kits/detailing/pages/lease-return.njk` |

## What it shows
What an end-of-lease inspection usually looks at on a car, grouped (paint and body, wheels and tyres, glass and
lights, inside, keys and papers), each in one plain line. The visitor ticks what their car has; the studio's
"from" prices add up, items it hasn't priced say "Ask us", and items a detailer doesn't fix (tyres, windscreen,
mirrors, burns and tears, keys and papers) say so and carry no price. "Send this on WhatsApp" sends the ticked items,
their prices, what to quote and the return date if given.

## The source (checked 5 November 2026)
The BVRLA's [Fair Wear & Tear Standard for Cars](https://www.bvrla.co.uk/resource/bvrla-s-fair-wear-tear-standard-for-cars-updated.html)
was last updated in December 2022 ([Fleet News, 19 December 2022](https://www.fleetnews.co.uk/news/fleet-industry-news/2022/12/19/bvrla-fair-wear-and-tear-standard-for-cars-updated));
no later car edition was found. The full guide is sold to BVRLA members, so the lines are taken from summaries UK
lease companies publish, and a limit is given only where they agree:
[TrustFord](https://leasing.trustford.co.uk/media/vzohwe1p/fair-wear-tear.pdf),
[The AA](https://www.theaa.com/leasing/leasing-guides/understanding-the-fair-wear-and-tear-standards) and
[Leasing Options](https://leasingoptions.co.uk/advice/vehicle-care/bvrla-fair-wear-and-tear-guide). Three limits are given:
scratches over 25mm or through to the primer (The AA, Leasing Options and TrustFord), more than two dents on a panel
(all three) and wheel scuffing over 50mm around the rim (The AA and TrustFord; Leasing Options gives no figure).
Dent sizes differ between them (10mm and 15mm), so the page gives none. The EV line (charging cables) is from the BVRLA's own note on
the 2022 update. The page links the BVRLA, names the edition and the day it was checked, and says the lease company's
own guide and inspector decide. Re-check the source when the BVRLA announces a new car edition, and update
`LEASE_SOURCE` in `lib/lease.js`.

## The studio's sheet
One row per item it fixes: `item` (scratches, chips, dents, bumpers, wheels, lights, stains) and `price` ("from",
whole pounds). Other ids, items a detailer doesn't fix and non-whole prices are skipped. Unreadable means every
item says "Ask us". Client sites must read the studio's sheet; `simulated` is for the demo
(`src/demo/lease-prices-provider.js`).

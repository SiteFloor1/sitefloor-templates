# residences-homes: free now and free from (every plan)

The operator's free homes, from its own Google Sheet, read on the visitor's phone: a card for each (photo, size, the
date it is free, the all-in price a night for its shortest stay or the rent a month) opening its detail: the total for
the stay with every mandatory fee in it, the tenancy terms with their GOV.UK sources, and "Ask about…" by WhatsApp.

## Settings (`homes` in site.json)
| Key | |
|---|---|
| `source` | `"sheet"` on a client site (`"simulated"` on a demo) |
| `csvUrl` | the sheet's published CSV link (File → Share → Publish to web → CSV) |
| `staleAfterHours` | after this long without an update nothing is shown as free (1–72, default 36) |
| `ask` | the start of the WhatsApp message ("Hello Sevrell, I'd like to ask about") |
| `photos` | `{ ref: { src, small, width, height, alt, credit } }`: the operator's own photo of each home |
| `plans`, `tours` | the floor plan and the Matterport link of each home (residences-plans, residences-tour) |

## The sheet
One row per home, columns in `src/kits/residences/lib/homes.js`. `status` is `free`, `booked` or `let`; only `free`
rows show. A home is shown only with whole-pound prices for the stays it offers (`night`, `clean`, `min_nights` for
short stays; `rent_pcm` for a tenancy), a readable `free_from` ("now" or YYYY-MM-DD) and its size. `updated_at` as
`2026-11-26 09:15` (UK time) or ISO. **Every row's `updated_at` must stay within `staleAfterHours`, let and booked
homes included**, or the whole list hides: refresh every row daily (a sheet formula such as `=NOW()` copied as a
value each morning, or the operator's daily check), not only the free homes.

## Prices
The nightly rate already holds service and VAT, and the cleaning charge is added once per stay, so every figure is a
total (CMA: no drip pricing). A long let is a rolling tenancy, priced by the month; the deposit caps are worked out
from the rent (Tenant Fees Act), and above £100,000 a year nothing is worked out (not an assured tenancy).

## Fails closed
A sheet that can't be read in 6 seconds lists nothing and says to ask, and so does one where any row's own
`updated_at` is unreadable, more than an hour ahead or older than `staleAfterHours` (each row is judged by its own
date, so an old "free" row can't ride on a fresh one). On the demo, add `#stale` to the address to see it.

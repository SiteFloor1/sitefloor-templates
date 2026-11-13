# Your stain, day by day

| | |
|---|---|
| Feature id | `stain-days` |
| Plan | signature (needs `mehndi-dates` and `darkest-day`); client photos only |
| Config | `stainDays`: `stages` (2–4, `{ day, label, text, photo }`: `day` counts from the mehndi evening, 0, 1, 2…, each a real photograph of the same stain on that day), `text?`; heading in `sections.stain` |

## How it works
One stain, photographed by the artist on the evening of the mehndi and each day after, side by side. When the bride
picks her wedding date in the date check, every photograph gets its date (the mehndi evening is the wedding less the
artist's `darkest.daysBefore`), and the line beneath names the darkest day: "Darkest on Saturday 12 June 2027, your
wedding day."

## Client photos only
No free photo set shows one stain on day 0, 1 and 2, and a mix of different hands would show a stain that never
existed, so the demo doesn't carry this section (`clientOnly` in `kit.js`; the client test site covers it). Sell it as
**"your own stain photos, day 0 to 2"**: the artist photographs one bride's (or her own) stain on the mehndi evening and
the two days after, in the same light, and it goes on her site with the bride's agreement.

## When something is missing or fails
Without JavaScript, or before a date is chosen, the photographs show "The evening", "Day 1", "Day 2". The photographs
must be one stain on one person: the artist's own, taken in the same light. Never a mix of different hands presented
as one.

Registered in `src/kits/mehndi/kit.js`. Add to a site by listing the id in `features` in its `site.json`.

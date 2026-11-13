# Walk-in queue

| | |
|---|---|
| Feature id | `walk-in-queue` |
| Plan | signature (sell as an add-on below that) |
| Config | `queue`: `source` (`sheet`; `simulated` on demos only), `csvUrl`, `staleAfterMinutes` (default 15), `chairs`, `minutesPerCut`, `busyness`, `busynessSource`; `sections.queue` |
| Files | `walk-in-queue.njk`, `.css`, `.js`, `sheet-provider.js`; logic in `src/core/lib/queue.js` |

## How it works
**Right now:** people waiting, a little line of figures with "you" at the end, the estimated wait
(`ceil(waiting ÷ chairs) × minutesPerCut`) and the time you'd be in the chair. Staff update one number from their
phone: a Google Form with a single "Waiting" question, its responses sheet published as CSV. The newest row counts.
If the shop's site has the Street hero, the hero ticket shows the same live line.

**Usually:** a week heatmap (quiet / steady / busy / very busy per hour) from `busyness`: for each open day, one level
0–3 per hour starting at the opening hour (`"mon": [0, 1, 1, 2, 3, 2, 1, 1, 2, 2]` for 9am–7pm). Validation checks
the count against the opening hours. Today and this hour are marked, with the quietest hour left today.
Say where the levels came from in `busynessSource` (e.g. "Google popular times for the shop, checked Oct 2026");
it is printed under the chart.

## When something is missing or fails
A sheet that can't be read, or a number older than `staleAfterMinutes`, hides the live part and shows
"ask how long it is" (WhatsApp) instead. It never shows an old number as current. The heatmap is built into the
page and works without JavaScript. When the shop is closed, the live part says so.

## Notes
Registered in `src/features/registry.js`. Any trade with walk-ins can use it (barbers, key cutting, phone repair).

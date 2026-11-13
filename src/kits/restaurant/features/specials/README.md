# Today's specials

| | |
|---|---|
| Feature id | `specials` |
| Plan | starter and above |
| Config | `tonight`: `source` (`sheet`, or `simulated` on demos), `csvUrl` (published Google Sheet CSV), `staleAfterMinutes?` (walk-in and busy lines, default 45), `demo?` (simulated rows, demos only: `{ kind, name, price?, note?, at: "HH:MM" or ago: minutes }`); optional `counter` (a café's bakes, below); `sections.specials` |
| Files | `specials.njk`, `specials.css`, `specials.js`, `sheet-provider.js` (shared with `tonight`); logic in `src/kits/restaurant/lib/tonight.js`; demo `src/demo/tonight-provider.js` |

## How it works
One Google Sheet, published as CSV, that staff edit from a phone:

| kind | name | price | note | updated_at |
|---|---|---|---|---|
| special | Lamb neck shawarma | 19 | Until it's gone | 2026-10-29 11:05 |
| soldout | whole-bream | | | 2026-10-29 19:12 |
| tables | few | | Bar seats free | 2026-10-29 18:40 |

The slip lists today's specials and what's sold out (a dish by its id or its name). **Only rows updated today show**:
yesterday's specials never carry over. If the sheet can't be read, the slip says "Ask us what's on today". The result
is shared with the menu (sold-out marks) and the live board, and read again every two minutes.

## Cafés: the counter
With `counter.sections` (menu sections in the glass case), the slip also lists each bake with a tag from the same
sheet: a `fresh` row (its time is when the tray came out) reads "Fresh out 8:10am" for `counter.freshForMinutes`
(default 60), then "Baked 8:10am"; a `soldout` row reads "Sold out" until a later `fresh` row puts it back. The same
states reach anything on the page marked `data-bake` (the Counter look's hero, the glass case, Your usual's bake chips).
With `counter.board` (a drinks section), the home band shows it beside the slip as the coffee board. The sheet can also
carry `busy` rows (How busy is it now?) and `board` rows (the regulars' board); restaurants that don't use them see no
change.

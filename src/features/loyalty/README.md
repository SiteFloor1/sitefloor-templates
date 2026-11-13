# Loyalty card

| | |
|---|---|
| Feature id | `loyalty` |
| Plan | starter and above |
| Config | `loyalty`: `stamps` (3–20, the last is the reward), `reward`, `rules` (short lines), `compareService` (a `services` id; on the restaurant kit, a menu dish or drink id), optional `card` (`paper` or `app`); `sections.loyalty` |
| Files | `loyalty.njk`, `.css`, `.js`; maths in `src/core/lib/savings.js` |

## How it works
Shows the shop's stamp card in its accent colour; the stamps fill in one by one when it scrolls into view.
Beside it, "I come in every N weeks" (1–8) works out cuts a year (cafés and restaurants: "N times a week" (1–7) and free coffees a year from the menu item's price) and the whole free cuts that earns, valued at the
shop's own price for `compareService`. Only whole free cuts are counted, so the saving is never rounded up.

The site does not track anyone's stamps: the card itself lives in the shop (paper, or the shop's own app).

## When something is missing or fails
Without JavaScript the card shows unstamped and the sentence shows the 3-week example.

## Notes
Registered in `src/features/registry.js`.

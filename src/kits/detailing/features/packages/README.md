# Packages by size (DET1)

| | |
|---|---|
| Feature id | `packages` |
| Plan | starter |
| Config | `sizes` (`id`, `name`; 2 to 6, the first is shown first), `packages` (`note?`, `items`: `id`, `name`, `line`, `includes?`, `days`, `prices`: `{ <size id>: whole pounds }`, `photo?`); `sections.packages` |
| Files | `packages.njk`, `packages.css`, `packages.js`; prices in `src/kits/detailing/lib/packages.js` |

## How it works
The sizes are a switch above a ruled list of the studio's packages. Each package shows what it includes, its "from"
price for the chosen size and how many working days the car stays. Every size's price is in the page, so switching
only swaps text and nothing moves. The chosen size is shared with the builder and the coverages, so they show the
same car. A size the studio hasn't priced for a package says "Ask us" rather than a guess.

## Honesty
Prices are the studio's own "from" prices. `packages.note` says how the final price is set (after seeing the paint).
Without JavaScript the first size's prices show.

# Art page

| | |
|---|---|
| Feature id | `art-page` |
| Plan | plus and above |
| Config | `art` (`message`, `levels`: `{ id, name, text }`, `items`: `{ id, name, level, shape, length, minutes, price, from?, photo }`); `artPage` |

## How it works
The salon's sets by shape and length, each with its level, time and price and "Ask for this" on WhatsApp. The levels are explained once above the sets.

## When something is missing or fails
Without JavaScript every set shows.

Registered in `src/features/registry.js`. Add to a site by listing the id in `features` in its `site.json`.

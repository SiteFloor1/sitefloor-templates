# Shades page

| | |
|---|---|
| Feature id | `shades-page` |
| Plan | plus and above |
| Config | `shades.items` (`id`, `no`, `name`, `hex`, `system`, `finish`, `family`, `note?`); `shadesPage` |

## How it works
Every shade as a flat swatch with its number, name, system and finish, filtered by family; each one's Book is in its own colour and names it. A line says screen colours are close, not exact.

## When something is missing or fails
Without JavaScript every shade shows and the chips stay hidden.

Registered in `src/features/registry.js`. Add to a site by listing the id in `features` in its `site.json`.

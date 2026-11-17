# The menu (the board)

| | |
|---|---|
| Feature id | `stalls-menu` |
| Plan | starter and above |
| Config | `menu`: `items` [{ `id`, `name`, `line?`, `price`, `allergens` ("G E M", or "" for none), `vegan?`, `photo?` }], `note?`, `key?`, `photo?` (beside the board on the home page); `sections.menu` |

Each item with its price and a short line, and the UK's 14 allergens by code from the stall's own chart (G gluten,
E egg, M milk, N tree nuts, S soya, P peanuts, Se sesame and the rest: `ALLERGENS` in `lib/stalls.js`). The key under
the board lists only the codes the menu uses. Screen readers hear the allergens in words. Sold out today and Save the
board hook into this markup when those features are on. Prices and allergens are the stall's own; the build refuses
an unknown code.

Registered in `src/kits/stalls/kit.js`.

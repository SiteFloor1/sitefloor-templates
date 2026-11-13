# Commissions (numbered cakes)

| | |
|---|---|
| Feature id | `commissions` |
| Plan | starter and above |
| Config | `pieces.items[]`: `id`, `no` (the studio's own number, optional), `name`, `kinds` (wedding, celebration, corporate, dessert-table), `sizes` (tier diameters in inches, top to bottom), `serves`, `from` (whole pounds), `made` (one line on how it's made), optional `flavours` (ids from `flavours.items`), `photo`; `sections.pieces` |
| Files | `commissions.njk`, `commissions.css` |

## How it works
Each cake shows large with its number, name, tiers, how many it served and its "from" price. The home page shows three
(never the hero's own cake, `hero.piece`, already on the screen), as compact rows on a phone; with `commission-pages`
on, each links to its own page and the section ends with a link to all of them, which the commissions page lists.

## When something is missing
Every cake needs a photo, its tiers, servings and price; validation refuses a cake without them.

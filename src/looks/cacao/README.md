# Look: Cacao

A chocolatier's flagship after dark: the shop's own film of chocolate pouring first, then the counter as shelves of
tubs, pieces and cakes, edge to edge, a pistachio ticket under each with its price. For chocolatiers, gelaterias and
dessert houses that sell abundance. Used by the bakery kit; demo: Velvet Spoon (`sites/demos/dessert`).
The full design system (grid, type scale, spacing, image ratios, motion, copy) is in `sitefloor-internal/docs/design/velvet-spoon.md`.

## Palette: a cacao pod, split open
| Token | Colour | From the pod |
|---|---|---|
| `--bg` | #140B09 | the roasted nib: the page |
| `--surface`, `--surface-2` | #24130F, #2E1912 | the raw bean: raised bands |
| `--shell` | #3E241C | the bean's shell: the gaps between pieces on a shelf |
| `--text` | #F1E7DA | the pulp |
| `--accent` | #B3BF7A | pistachio, the one colour: the ribbon, tickets, prices, the action |

A client's accent can replace pistachio; `look.json` lists alternatives and checks contrast.

## Type
DM Serif Display, very large, for names only; Archivo for reading, its expanded capitals (wdth 125) for labels and prices.
Self-hosted, latin only, with size-matched fallbacks in `fonts.css`.

## What the look owns
- **Header** (`header.njk`): a pistachio grosgrain ribbon across the top, the round seal (`parts/seal.njk`) tied on at
  the left, the wordmark, the pages and "Order". On phones, "Menu" opens the pages full screen.
- **Hero** (`hero.njk`): the shop film fills the screen (kit feature `shop-film`), one line and two links at its foot.
- **Section openings** (`section-head.njk`): the name large in DM Serif Display, a line or today's date small on the right.
- **Phone bar** (`mobile-bar.njk`): the ribbon again at the foot of the screen: "Order" and "Find us".
- **Footer** (`footer.njk`): the seal large, the address, the week's hours, the pages, the credit.
- **Shared features** (`features/*.njk`): reviews as a line of quotes, questions in two columns, visit with the
  address large, vouchers as the card tied to a box, Payment Links as receipt rows, plan your visit.
- The kit's shelves, box, tasting flight, vote and pages are drawn in `look.css`.

## Motion
The film loops slowly; a piece settles into the box; a chosen piece drops into the flight. Nothing is tied to
scrolling, and nothing moves with reduced motion or after the Pause button.

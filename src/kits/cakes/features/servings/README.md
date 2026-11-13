# How many are you feeding? (servings calculator)

| | |
|---|---|
| Feature id | `servings` |
| Plan | plus and above |
| Config | `servings`: `tiers[]` (`size` in inches, `finger` and `dessert` portions from the studio's own chart), `maxTiers`, `prices[]` (`tiers`, `from` in whole pounds), `height` (the tier height its chart assumes, e.g. "about 5 in"), optional `note`; `sections.servings` |
| Files | `servings.njk`, `.js`, `.css`; the choice is `planCake` in `src/kits/cakes/lib/cakes.js` |

## How it works
Guests (slider or ±10) and how it's served (with coffee: finger portions; as the dessert) choose the smallest cake
of consecutive tier sizes from the studio's chart, at most `maxTiers`, that feeds everyone; on a tie, more tiers.
The answer is drawn as the tier sizes in type, one line per tier, each line sized to the tier's width and stacked
like the cake, with the portions and the studio's "from" price for that many tiers. With the order page on, it links
there with the guests filled in. It shares the answer as `cake`.

## When something is missing
More guests than the studio's biggest cake feeds says "Ask us"; a tier count with no "from" price says "Ask us".
Without the script it shows the cake for 120 guests.

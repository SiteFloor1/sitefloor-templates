# Packs and memberships

| | |
|---|---|
| Feature id | `pack-calculator` |
| Plan | plus and above |
| Config | `packs`: `single` (one class, the studio's price), `items` (`{ id, name, classes, price, months }`), `memberships` (`{ id, name, monthly, classes or "unlimited", minMonths? }`), `terms` (cancellation and minimum term, in the studio's words); `sections.packs` |
| Files | `pack-calculator.njk`, `.js`, `.css`; maths `packOptions` in `src/kits/pilates/lib/members.js` |

## How it works
"How often will you come?" (1–4 a week) and every way of paying, cheapest first: what it costs a month and a class. A
pack that would expire before it's used is counted as bought every time it runs out, and says how many classes are
lost; classes beyond a membership's allowance are counted at the single price. Every number is the studio's own.

## When something is missing or fails
Without JavaScript the prices show as a plain list.

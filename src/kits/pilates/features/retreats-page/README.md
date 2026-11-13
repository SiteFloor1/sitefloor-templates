# Retreats (PIL-8)

| | |
|---|---|
| Feature id | `retreats-page` |
| Plan | signature |
| Config | `retreats`: `kicker`, `title`, `intro`, `items` (`{ id, name, place, from, to, text, includes, price?, places?, depositLink?, photo?, days?: [{ title, text }], rooms?: [{ name, text, price? }], placesLeft? with placesChecked (the date counted), balanceDue? }`), optional `formUrl` (the studio's Google Form), `photo` |
| Files | `retreats-page.njk`, `.js`, `.css`; the page is `src/kits/pilates/pages/retreats.njk` |

## How it works
Each retreat: dates and place, a line, what's included, places and price (only if the studio gives them), and a
deposit through the studio's own Stripe link. Finished retreats drop off by themselves. "Join the retreat list"
opens the studio's Google Form.

## A retreat's own page
`retreat-<id>.html` (pages/retreat.njk, `retreat.njk`): day by day, the rooms with the studio's prices, what's
included, places left **as at the date the studio counted them** (never presented as live), the deposit link, and
"in 162 days" until the balance is due, worked out on the visitor's own day. Once the retreat has finished, the page
says so and the deposit link goes.

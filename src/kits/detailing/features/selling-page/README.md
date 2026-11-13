# The Selling your car? page

| | |
|---|---|
| Feature id | `selling-page` (page `selling-your-car`), Plus and above |
| Config | `sellingPage`: `{ kicker?, title, intro, photo?, body?, includes, steps, prices? or priceFrom?, message }` |
| Files | `selling-page.njk`, `selling-page.css`; the shared `src/kits/detailing/partials/service-page.njk`; the page template `src/kits/detailing/pages/selling-your-car.njk` |

The page's opening, then what's included (2 to 10 lines) and how it goes (2 to 6 steps, each `{ name, text }`) side by
side, then "from" prices by car size and "Ask us on WhatsApp" with `message`. Prices are the studio's own: either
`prices` by size on the page, or `priceFrom: { "addOn": "<id>" }` / `{ "package": "<id>" }` to show that extra's or
package's prices, so a price is set in one place. With neither, the page shows no prices and the question still works.
The packages' `note` shows under the prices.

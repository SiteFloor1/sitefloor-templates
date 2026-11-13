# Prices (page)

| | |
|---|---|
| Feature id | `price-page` |
| Plan | plus and above |
| Config | `priceList` (shared with the home price list), `pricesPage`: `{ kicker, title, intro?, footnote? }` |
| Files | `price-page.njk`, `price-page.css`; page template `src/core/pages/prices.njk` |

## How it works
The whole menu as tables, one per group, with how long each service takes. Lines that point at the cut builder (`{ "service": "skin" }`) take their name, price and time from it. When this page is on, the home page shows a shorter list (the first two lines of each group) with a link here.

Registered in `src/features/registry.js`. Add to a site by listing the id in `features` in its `site.json`.

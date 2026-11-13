# Price list

| | |
|---|---|
| Feature id | `price-list` |
| Plan | starter and above |
| Config | `priceList`: groups of lines. A line is `{ "service": "skin", note? }` or `{ "extra": "beard", note? }` (name and price come from the cut builder, optional `name` to relabel), or `{ name, price, note? }` for things the builder doesn't sell (bundles, concessions). `sections.prices` |
| Files | `price-list.njk`, `price-list.css` |

## How it works
Rendered at build time. No JavaScript. When the site has the cut builder, a written-out line with the same name as a builder service is rejected, so a price is only ever entered once.

## When something is missing or fails
None needed: static HTML.

Registered in `src/features/registry.js`. Add to a site by listing the id in `features` in its `site.json`.

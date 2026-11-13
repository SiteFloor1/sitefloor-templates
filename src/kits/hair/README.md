# Hair kit (hair salons)

Kit `hair`, look `length`, demo `sites/demos/hair` (Selwyn Orr). Everything here is the salon's own: prices, times,
levels, the skin-test rule, products, the wedding timings. Plan by tier and what was built: `docs/trades/hair/playbook.md`.
Customer questions: `docs/trades/hair/questions.md`. Design notes: `sitefloor-internal/docs/design/hair.md`.

| Plan | Features |
|---|---|
| Starter | `length-price` (the photograph cut at your length, price by length and level), `stylists` (work, level, next free day from the salon's sheet), `skin-test` |
| Plus | `my-usual`, `textures`, `colour-year`, pages: `hair-services`, `colour-page`, `stylists-page`, `look-book`, `group-pages` (a collection), `textured-page`, `colour-consult`, `upkeep-page`, `product-shelf`, `hair-journal`, `hair-vouchers` (gift vouchers on their own page), `blowdry-pass` (a pack of visits on the salon's Stripe link) |
| Signature | `stylist-match`, `chairs-today` (live blow-dry and walk-in slots from the salon's sheet), `consent-pairs` (before and after, consent only; client sites only), `wedding-hair` |

- Logic with no DOM: `lib/hair.js` (unit tests in `tests/unit/hair.test.js`); browser tests in `tests/e2e/hair.spec.js`.
- Checks: `config.js`. Home sections and what a look may move to a page: `home.js`. Each feature has its README.
- A new client: `npm run new-client -- --kit hair --slug <slug> --plan <plan>`, then make the cut photograph's two
  layers from the salon's own photograph (`features/length-price/README.md`).

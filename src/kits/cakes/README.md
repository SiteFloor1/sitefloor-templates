# Kit: cakes (celebration cake designers)

For studios that make wedding and celebration cakes to commission: consultation, sketch, deposit, delivery and
set-up. Not the `bakery` kit, which sells the day's stock from a counter. Look: `atelier`. Demo: Pastillage
(`sites/demos/cakes`, Signature). Client fixture: `tests/fixtures/sites/test-cakes-client` (Plus).
Customer questions, plan and design record: `docs/trades/cakes/`.

| Plan | Features |
|---|---|
| Starter | `commissions` (numbered cakes with tiers, servings, "from"), `lead-time`, `cake-date-check` (the studio's diary sheet; fails closed), `allergens` |
| Plus | `servings` (how many are you feeding; the tiers built in type), `flavours` (choose by the slice), `tasting-box`, `cake-care`, `brief-builder` (page `order`), `flavours-page`, `allergens-page` |
| Signature | `seasonal-flavours`, `consultation`, `venue-check`, `how-it-works`, `servings-page`, `tasting-page`, `delivery-page`, `cake-care-page`, `how-it-works-page`, `commission-pages` (a page per cake), `weddings-page`, `celebrations-page`, `corporate-page`, `dessert-tables-page` |

- Logic with no DOM: `lib/cakes.js` (the cake for a guest count, the diary sheet, postcodes, seasons, the brief).
  Unit tests: `tests/unit/cakes.test.js`; browser tests: `tests/e2e/cakes.spec.js`.
- Validation: `config.js`. Every portion, price, date, area and allergen is the studio's own; a simulated diary is
  refused on client sites; the tasting box takes only the studio's own Stripe link (test mode on demos).
- Home sections and which a look may move to a page: `home.js`. Template filters: `eleventy.js`.
- Live data: the diary (`features/cake-date-check/sheet-provider.js`; the demo's is `src/demo/cake-dates-provider.js`).
  Tell every studio: keep at least one dated row in the diary sheet and update its `updated_at` when you check it,
  even with nothing booked; otherwise every date says "ask us".
- No free-from claims: validation refuses "<allergen>-free" and "-friendly" for all 14 allergens and their common
  words (wheat, lactose, shellfish…), "free from", "free of", "safe for" and "suitable for coeliacs" anywhere in the
  studio's text, including the visit details, page links, seasons and business description. Honest warnings pass ("not
  safe for nut allergies", "we cannot make a cake free from nuts"). A flavour can be marked vegan, or made with
  gluten-free flour, never "gluten-free".
- A new client: `npm run new-client -- --kit cakes --slug <slug> --plan <plan>`, then fill `site.json` from
  `client-template.json` (every REPLACE_ME is refused until filled).

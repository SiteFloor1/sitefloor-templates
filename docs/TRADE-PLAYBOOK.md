# Trade playbook

What to build for each trade. Before building a trade, read only that trade's section. These are ideas: pick the best, propose a
plan for each trade, and improve on them.

GROUND RULES (all trades)
- £0 running cost per client beyond hosting and domain. No paid APIs, servers or databases.
  One owner-approved exception (29 Oct): the wear kit's `wear-today` is a paid add-on that needs the brand's own
  Open-Meteo plan. Before selling it, tell the brand that every page view showing it uses their quota and that the key
  is visible in the page.
  Use what's free and proven:
  - Google Sheet or Form as live data (shop owners update from their phone);
  - WhatsApp messages with pre-filled text;
  - Behold for Instagram (our Pro account);
  - Stripe Payment Links for deposits and vouchers (the client's own Stripe account; fees
    only per sale);
  - links out to the shop's existing booking app;
  - everything else in the browser: SVG, canvas, CSS and small JS.
- Every live-data feature fails safe: old or missing data is never shown as current.
- Showpieces must feel like an app but stay light. Draw with SVG and CSS rather than
  heavy 3D, measure the speed, and pass the phone layout-shift test.
- Never invent facts: prices, legal claims, accreditations and reviews come from the client.
- Each trade gets its own design. Different layout and hero idea, not a recolour (rule 4).
- Reuse shared features before building new ones: price list, visit / Plan your visit,
  gallery and Our work, reviews, questions, seasonal banners, team, general pages,
  gift vouchers, loyalty card, memberships, before/after slider, walk-in queue,
  "Will I make it?".

SHARED FEATURES WORTH BUILDING ONCE, FOR EVERY TRADE
- Live status board (generalised from the barber walk-in board): a Google Form updates it.
  Use it for "spaces left", "sold out", "slots this week" and units free.
- Deposit or pay-now button: a Stripe Payment Link per service; no backend.
- "Add to calendar" files for appointments, infills and reminders (made in the browser,
  nothing stored).
- Postcode checker for delivery and service areas (a list of postcode districts, no API).
- Live price builders: one shared engine (options to price and time to a WhatsApp
  summary) that each trade's showpiece draws on top of.

ORDER: one trade at a time (the order is kept in SiteFloor1/sitefloor-internal). Real future clients never appear in
demos; demos stay fictional. For each trade:
1. its customer questions in `docs/trades/<trade>/questions.md` first (`npm run docs` lists it in docs/CUSTOMER-QUESTIONS.md);
2. a short plan for me (features per plan, the showpiece, how the design differs) in `docs/trades/<trade>/playbook.md`;
3. build, test, measure and publish the demo link;
4. the auditor message. The auditor writes the report into `SiteFloor1/sitefloor-internal` `audits/reports/` and the
   builder commits it there (never on the PR branch). Handovers, design rounds and VISION-REFERENCES are read from
   sitefloor-internal too.

A NEW KIT, STEP BY STEP (it never edits a shared file; `npm run rules` fails if a shared build file names a kit)
1. `src/kits/<kit>/kit.js`, the kit's one entry file. Copy the shape of an existing one and export:
   - `features`: the kit's own registry entries (`kits: ["<kit>"]`, `dir: "src/kits/<kit>/features/<id>"`). Each new id
     starts with the kit's name (`<kit>-services`, never a bare `services`); `npm run rules` fails if a shared feature,
     another kit, or another kit on an open branch already has the id;
   - `uses` (optional): shared features open only to the trades that ask (price list, loyalty, pay link, date range…);
     `refuses` (optional): shared features the trade never offers;
   - `settings` (optional): top-level site.json keys no feature lists (a feature's own keys go in its `requires` or
     `optional`); any key not allowed for the kit is refused;
   - `check`: the kit's site.json checks, written in `src/kits/<kit>/config.js` (unknown keys refused, demo data
     refused on clients), returning early when `site.kit` is another kit;
   - `pageData` (optional): what the kit's browser scripts read from the page, only for the features that are on;
   - `buildData` (optional): values its templates read from `build`;
   - `providers` (optional): live data, each with a simulated module in `src/demo/` and the client's sheet module.
   - `csp` (optional): `{ sheets: true }` when it reads a published Google Sheet, plus any other sources its pages
     load (a forecast API, a badge frame); never edit `src/core/lib/seo.js`.
2. Pages, features, `lib/`, `client-template.json`, optional `eleventy.js`, `kit.css`, `demo.json` in `src/kits/<kit>/`.
3. A new look in `src/looks/<look>/` (`look.json` names the kit in `kits`).
4. A demo in `sites/demos/<demo>/`, a client fixture in `tests/fixtures/sites/`, its spec in `tests/e2e/<kit>.spec.js`.
5. Docs in `docs/trades/<trade>/` only: `trade.json` (`{ "name": "…", "kit": "<kit>" }`), `questions.md`, `playbook.md`,
   `demo-map.md` (your rows and what your demo takes), `speed.md` (your numbers), `fonts.md` (your claimed fonts). Then
   `npm run docs`: it rebuilds every shared index and link list. Never edit a generated file; a case study writes only
   `case-studies/<slug>/` (`index.html`, a `README.md` entry, `fonts.md` with its demo's trade: it may reuse its own
   demo's fonts, nothing else that is claimed).
6. `npm run check`. On a pull request CI then tests only this kit, plus a smoke test of every site.

EACH TRADE (one file per trade, so trades never edit the same lines)
<!-- trades:start (generated by npm run docs from docs/trades/*/playbook.md; don't edit) -->
- Bakers and cake makers: [`docs/trades/baker/playbook.md`](trades/baker/playbook.md)
- Bridal salons: [`docs/trades/bridal/playbook.md`](trades/bridal/playbook.md)
- Cafés: [`docs/trades/cafe/playbook.md`](trades/cafe/playbook.md)
- Celebration cake designers: [`docs/trades/cakes/playbook.md`](trades/cakes/playbook.md)
- Car hire: [`docs/trades/car-hire/playbook.md`](trades/car-hire/playbook.md)
- Car studios (tint, wrap, PPF, detailing): [`docs/trades/car-studio/playbook.md`](trades/car-studio/playbook.md)
- Construction and building firms: [`docs/trades/construction/playbook.md`](trades/construction/playbook.md)
- Car detailing: [`docs/trades/detailing/playbook.md`](trades/detailing/playbook.md)
- Electricians: [`docs/trades/electrician/playbook.md`](trades/electrician/playbook.md)
- Florists: [`docs/trades/florist/playbook.md`](trades/florist/playbook.md)
- Garage and parking rentals: [`docs/trades/garage/playbook.md`](trades/garage/playbook.md)
- Grand cafés and tea rooms: [`docs/trades/grand-cafe/playbook.md`](trades/grand-cafe/playbook.md)
- Hair salons: [`docs/trades/hair/playbook.md`](trades/hair/playbook.md)
- Fine jewellers: [`docs/trades/jeweller/playbook.md`](trades/jeweller/playbook.md)
- Garden designers and landscapers: [`docs/trades/landscaping/playbook.md`](trades/landscaping/playbook.md)
- Law firms (private client): [`docs/trades/law/playbook.md`](trades/law/playbook.md)
- Lingerie boutiques: [`docs/trades/lingerie/playbook.md`](trades/lingerie/playbook.md)
- Mehndi and henna artists: [`docs/trades/mehndi/playbook.md`](trades/mehndi/playbook.md)
- Clothing brands (menswear, running and outerwear): [`docs/trades/menswear/playbook.md`](trades/menswear/playbook.md)
- Nail, lash and beauty salons: [`docs/trades/nails/playbook.md`](trades/nails/playbook.md)
- Personal trainers and small gyms: [`docs/trades/personal-trainer/playbook.md`](trades/personal-trainer/playbook.md)
- Reformer Pilates studios: [`docs/trades/pilates/playbook.md`](trades/pilates/playbook.md)
- Restaurants: [`docs/trades/restaurant/playbook.md`](trades/restaurant/playbook.md)
- Sneaker and crep cleaners: [`docs/trades/sneaker-cleaner/playbook.md`](trades/sneaker-cleaner/playbook.md)
- Tailors: [`docs/trades/tailor/playbook.md`](trades/tailor/playbook.md)
- Teeth whitening and aesthetic dentistry: [`docs/trades/teeth/playbook.md`](trades/teeth/playbook.md)
- Videographers and photographers: [`docs/trades/videographer/playbook.md`](trades/videographer/playbook.md)
- Wealth managers: [`docs/trades/wealth/playbook.md`](trades/wealth/playbook.md)
- Wedding films: [`docs/trades/wedding-film/playbook.md`](trades/wedding-film/playbook.md)
<!-- trades:end -->

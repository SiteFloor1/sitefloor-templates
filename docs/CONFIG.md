# site.json reference (schema version 4)

Validated by `src/core/lib/config.js` before every build. Errors name the exact field.

| Field | Required | Notes |
|---|---|---|
| `schemaVersion` | yes | `4` |
| `id` | yes | lowercase-dashes; unique |
| `mode` | yes | `"demo"` or `"client"` |
| `plan` | yes | `starter` / `plus` / `signature` |
| `kit`, `look` | yes | e.g. `barber`, `barber-noir` or `barber-street` |
| `url` | yes | `https://domain` (no trailing slash). Used for canonical URLs, sitemap, JSON-LD |
| `indexable` | yes | `false` for demos (enforced). Client sites are only indexed in production builds |
| `lang` | yes | `en-GB` |
| `business` | yes | `name`, `schemaType` (schema.org type, e.g. `BarberShop`), `description`, `priceRange?`, `sameAs?` |
| `contact` | yes | `whatsapp` E.164 digits without `+`; `phone` `"+44 …"`; `email` (required on client sites: UK E-Commerce Regulations). Fictional 07700 900xxx numbers are rejected on client sites |
| `booking` | no | Where every Book button goes. `provider`: `whatsapp` (default), `booksy`, `fresha`, `other` (+ `name`), `phone`. `url` for booksy/fresha/other: the shop's own booking page (https, on that provider's domain). We link out and never embed a provider's widget (no third-party scripts or cookies). WhatsApp stays for questions |
| `location` | yes | `streetAddress`, `locality`, `postcode`, `country: "GB"`, `area?`, `directionsUrl?` (https; defaults to a Google Maps search for the address), `geo?`, `region?` (`england-wales`, `scotland`, `northern-ireland`: bank holidays; worked out from the postcode when left out) |
| `hours` | yes | `timezone`, `weekly` (`mon`…`sun`: list of `["HH:MM","HH:MM"]`, `[]` = closed, overnight allowed), `exceptions?` (`date`, `ranges`, `note?`) |
| `nav` | yes | `{ label, href }` (in-page anchor) or `{ label, page }`; `feature` hides the item when that feature is off, unless `fallback` (e.g. `#prices`) gives a home-page anchor to use instead |
| `features` | yes | ids from `src/features/registry.js`; must fit the plan (or be in `addons`); each feature's `requires` keys must exist; `visit` is required |
| `addons` | no | feature ids sold on top of the plan; each must also be in `features` |
| `addonPages` | no | extra pages sold on top of the plan (whole number); each general page counts as one. A generated collection (a fleet with its class and car pages) counts as one page; unlisted utility pages (a deposit status) don't count |
| `reviews` | with `reviews` | `source` (`google` on client sites), `items`: `text`, `author` (first name + initial), `rating` (that review's own stars, 1–5), `date` (`YYYY-MM` or `YYYY-MM-DD`, never "2 weeks ago") |
| `chairBoard` | with `chair-board` | `source` (`sheet` on client sites), `csvUrl`, `staleAfterMinutes?` (default 20). See the feature README for the sheet format |
| `queue` | with `walk-in-queue` | `source` (`sheet` on client sites), `csvUrl`, `staleAfterMinutes?` (default 15), `chairs`, `minutesPerCut`, `busyness` (`mon`…`sun`: one level 0–3 per open hour from the opening hour), `busynessSource`. See the feature README |
| `loyalty` | with `loyalty` | `stamps` (3–20), `reward`, `rules`, `compareService` (a `services` id), `card?` (`paper`/`app`) |
| `memberships` | with `memberships` | `compareService`, `plans` (1–4: `name`, `price` a month, `cuts` 1–8 or `"unlimited"`, `includes?`, `featured?`), `terms` (cancelling, minimum term, payment), `join?` |
| `beforeAfter` | with `before-after` | `items`: `before`, `after` (photos in `img/`), `alt`, `beforeLabel?`, `afterLabel?`, `caption?`, `by?`. Same client, with permission |
| `vouchers` | with `vouchers` | `amounts` (1–6, whole pounds, up to £2,500), `custom?` (`min` up to £2,500, `max` up to £10,000), `validMonths`, `howToBuy`, `terms` |
| `styleGuide` | with `style-guide` | `updated`, `reviewedBy?` (only if that person has read and approved the guide) |
| `gallery` | with `gallery` | `{ source: "behold"\|"photos", feedUrl?, profile?, handle?, filters?, photos? }`; see `src/features/gallery/README.md` |
| `work` | with `work` | `{ kicker, title, intro? }` |
| `questions` | with `questions` | `[{ topic, q, a, home? }]`; questions end with `?` |
| `visitInfo` | with `plan-visit` | `{ kicker, title, intro?, checked, journeys?, parking?, access?, accessNote?, payment? }` (at least one). `checked` (`YYYY-MM`, the month the facts were checked with the business) is required on client sites. Car parks with charging hours need `bankHolidays` (`sunday`, `normal`, `free`); `open` and dated `exceptions` are optional. See `src/features/plan-visit/README.md` |
| `brand` | no | The client's own look on top of the look: `accent` (`#RRGGBB`, must be readable on the look, 4.5:1), `type` (one of the look's type options, e.g. Noir: `classic`, `garamond`, `modern`; Street: `classic`, `plain`), `logo` (`img/…svg`/`.webp`/`.png`, under 40 KB, no script). See `src/core/lib/brand.js` |
| `pages` | with `custom-pages` | General pages: `[{ slug, title, kicker?, description, intro?, blocks }]`; blocks are `text` (`heading?`, `body` with blank lines between paragraphs), `photo` (`src` WebP in `img/`, `alt`, `caption?`), `list` (`heading?`, `items`), `book` (`text`, `label?`). Each page counts towards the plan |
| `pricesPage` | with `price-page` | `{ kicker, title, intro?, footnote? }` |
| `seasons` | with `seasonal` | `[{ name, from, to, banner, link?, tint? }]`; `npm run seasons -- --year N` suggests dates |
| `team.showcase`, `team.bookLine`, `team.yearsLabel` | no | Trades where you book the business, not a person: no "Book with …" per person, one booking line instead |
| `team.filters` | no | `[{ tag, label }]` with `staff[].tags`, e.g. hair types; also writes a "who's best for…" question |
| `hero` | yes | `kicker`, `title`, `intro`; `stats?` as `["value", "label"]` pairs (client-supplied figures only); `secondaryCta?` `{ label, href, feature? }` |
| `sections` | yes | `sections.<key>.title` for every enabled feature that has a heading (`prices`, `visit`, `gallery`, `reviews`, `chairs`, `cut`); `kicker?`, `intro?` |
| `messages` | yes | `general`: the pre-filled WhatsApp message |
| `services`, `extras` | with `build-your-cut` | `id` (unique), `name`, `price` (number of pounds), `minutes` (whole number) |
| bakery kit keys | with the feature | `desserts`, `bakes`, `lateNight`, `delivery`, `cakes`, `collect`, `parties`, `box`, `flight`, `gelato`, `vote`, `favours`, `advent`, `post`, `tubs`, `boxMonth`, `payLinks`, `cakesPage`, `partiesPage`, `menuPage`, `boxPage`, `hero.photo`, `hero.film`. Payment Links take `"kind": "monthly"` for a Stripe subscription link. Checked in `src/kits/bakery/config.js`; each feature README shows its shape |
| bridal kit keys | with the feature | `appointment`, `designers`, `gowns`, `gownsPage`, `diary`, `trunkShows`, `fittingsPage`, `shortlist`, `bridesPage`, `giftPage`, `hero.mirror`, `gowns.items[].editorial`, `appointment.room` / `detail` / `intro`; the look moves sections to pages with `look.json` → `onPages`. Checked in `src/kits/bridal/config.js`; each feature README shows its shape |
| law kit keys | with the feature | `regulation` (always: `legalName`, `entity`, `sraNumber`, `badgeFrame` on clients, `insurance`), `complaints` (always), `practice`, `people`, `pricing` (required when an area lists `sraServices`), `firstContact`, `arrival`, `insights`, `guides`, `matters`, `meetingPack`, `succession`, `hero.photo`, and (second round) `glossary`, `matterSteps`, `bereavement`, `gather`, `yourHours`, `willReminder`, `estimator` (answers can never leave the published range), `intestacy`, `house`, `matterCode` (sheet holds only code, stage, time); `practice.items[].asked`, photos on insights and guides. Demos use SRA numbers 000000 and no badge. Checked in `src/kits/law/config.js`; each feature README shows its shape |

Headlines support `*italic*` and `|` line breaks; all other markup is escaped. Links (`nav[].href`, `hero.secondaryCta.href`) must be `#anchor`, `/path` or `https://`. `business.schemaType` must be in the list in `src/core/lib/config-content.js`. `features` must include `visit`. The build also fails if any page ends up with an empty `<h1>`, `<h2>` or title part.

Feature-specific keys are documented in each feature's README (`src/**/features/<id>/README.md`).

Placeholders: any `REPLACE_ME`, `TODO` or "lorem ipsum" fails validation.

## Car studio settings (`kit: "car"`)
Checked in `src/kits/car/config.js`; unknown keys are refused. Each feature README has an example.
- `vehicles`: `[{ id, name, body: "hatch"|"saloon"|"suv"|"van", example? }]`: the sizes the studio prices by (the 3D Showroom shows one studio car for every size; prices follow the visitor's size).
- `jobs`: `[{ id, name, prices: { <vehicle id>: pounds }, hours: { <vehicle id>: hours }, note? }]`: every price and time, once. Price-list lines can point at one: `{ "job": "tint-rear" }` shows "from £…".
- `tint`: `{ shades: [{ id, name, light, sheen? }], jobs: { rear, fronts, windscreen? }, measured }`. `light` is the light through the glass as fitted, as the studio measures it; `sheen` (#RRGGBB) marks a chameleon film and its colour cast.
- `wrap`: `{ colours: [{ id, name, hex }], finishes: [{ id: gloss|satin|matte|chrome, name, job, note? }] }`.
- `showroom`: `{ wheels?: { job, colours }, dechrome?: job id, start? }`; the first build must be legal.
- `protection`: `{ panels: [{ id, name, job }], packs?: [{ name, job, panels }], start? }`. Panel ids: bumper, lights, grille, bonnet, wings, mirrors, doors, sills, roof, quarters, taillights, rear.
- `tintPage` (adds optional `windscreen` and `lights`: `{ body, points? }`), `ppfPage` (`kicker`, `title`, `intro?`, `message`, `films: [{ name, about, best?, finish, hex? }]`, `filmsNote?`, `details?: [{ src, alt, caption? }]`, `points?`).
- `quote`, `aftercare`, `aftercarePage`, `bay` (Google Sheet, `staleAfterHours`, Stripe Payment Link deposit: test-mode links on demos only, never on clients), `models` (makes and models by hashtag, `priceJobs`).
- `messages.likeThis` (any kit): the WhatsApp opening line under an enlarged photo.

## Restaurant settings (`kit: "restaurant"`)
Checked in `src/kits/restaurant/config.js`; unknown keys are refused. Each feature README has an example.
- `menu`: `{ sittings, statement, chartChecked, sections }`. Sittings `{ id, name, days, from, to, lastOrders?, mood: "day"|"evening" }`
  (same day only). Sections `{ id, name, note?, sittings, drinks?, dishes }`. Dishes `{ id, name, desc?, price, diets?, allergens, spice?,
  share?, takeaway?, kids?, pairs?, pass?, photo? }`: `allergens` from the restaurant's own chart (the 14: celery, gluten, crustaceans, eggs,
  fish, lupin, milk, molluscs, mustard, peanuts, sesame, soya, sulphites, nuts), `[]` if none, never left out; `diets` from halal,
  vegetarian, vegan (vegan with an animal allergen is refused).
- `tonight`: `{ source: "sheet"|"simulated", csvUrl, staleAfterMinutes? }` (simulated on demos only). `tableRequest`, `delivery`,
  `order`, `menuPage`, `events`, `privateDining`, `table`, `room`, `pass`, `menuBook`, `menuPdf`, `heroFilm`: see each feature's README.

## Unknown top-level settings
Each site may carry only the top-level keys its own kit allows (`topKeys(kit)` in `src/core/lib/config.js`):
- the core settings every trade shares (`CORE_KEYS`; never put a trade's key there, `npm run rules` checks the file names no kit);
- the keys its features, shared and its kit's own, list in `requires` (needed when on) or `optional` (read if present,
  e.g. a restaurant's `menuPage`, a clothing brand's `sizeGuide`);
- the keys its `src/kits/<kit>/kit.js` lists in `settings`: trade settings no single feature owns (a restaurant's
  `menuPdf`, a lingerie shop's `shop`). Check them in the kit's `config.js` as usual.

Anything else is refused, so a misspelt key, or another trade's setting, fails the build instead of being ignored. A
leftover block for one of the site's own features that is switched off is still accepted.

## Changing the schema
1. Bump `SCHEMA_VERSION` in `config.js` and describe the change below.
2. Update every `site.json` in `sites/` and `tests/fixtures/` in the same commit (the build refuses old versions).
3. Add tests for the new rules.

| Version | Change |
|---|---|
| 1 | Initial schema (October 2026) |
| 2 | Reviews need `rating` and `date` (`when` removed). `location.mapLabels` removed with the drawn map. `styleGuide.author`, `authorInitial`, `cutsPerYear` replaced by optional `reviewedBy` (October 2026) |
| 4 | New: `brand` (accent, type, logo), `pages` (general pages), `visitInfo.checked`, car-park `bankHolidays`, `open`, `exceptions`, `location.region`. Template facts must be filled in (October 2026) |
| 3 | `gallery` became an object (`source`: Instagram through Behold, or stored `photos`). New: `questions`, `visitInfo`, `pricesPage`, `seasons`, `work`, `addons`, `team.filters`, `staff[].tags`, nav `fallback` (October 2026) |

## Café settings (restaurant kit, trade/cafe)
All optional; each is required only when its feature is on (see the feature's README). Unknown keys are refused.
- `counter`: `{ sections, freshForMinutes?, photo?, spots?, board?, hold?, note? }`: the menu sections in the glass case
  (fresh-out and sold-out tags from the specials sheet), the counter photo and the bakes marked on it (Counter look),
  the coffee board (a drinks section), the "put one aside" WhatsApp line.
- `usual`: Your usual's price list: `message`, `prepMinutes`, `sizes`, `drinks` (prices per size, `pour`), `milks`
  (price, allergens, `shade`), `defaultMilk`, `extraShot`, `maxShots`, `syrups?`, `decaf?`, `ownCup?`, `note?`.
- `busy`: `{ basis, from, week, laptopMax? }`: the café's own busyness numbers, a level (0–3, or null when closed) an hour.
- `workHere`: `{ answers, photos?, rules? }` for Can I work here?.
- `seats`: `{ width, height, places, marks?, note? }` for the seat finder.
- `brunch`: `{ plates, sides, maxPlates, note? }` (menu dish ids) for the brunch builder.
- `tableRequest.sittings?`: the sittings that take bookings (e.g. only weekend brunch).
- `tonight.demo?`: rows for the simulated sheet (demos only).
- The specials sheet also reads optional `fresh`, `busy` and `board` rows (see the specials README).
No schema version change: every new key is optional and old sites build unchanged.

## Grand café settings (restaurant kit, trade/grand-cafe)
All optional; each is required only when its feature is on (see the feature's README). Unknown keys are refused.
- `hero.room`: `{ day, evening }`, each `{ src, srcSmall, width, height, alt }`: the room by day and by candlelight
  (Salon look); `srcSmall` is the phone crop. The page's day/evening comes from the menu sittings' `mood`.
- `tea`: `{ sitting, tiers, services, swaps, library, note? }`: afternoon tea's sitting, the menu sections on the stand
  (bottom tier first), how a guest can take it (`services`: name and price each), whether the kitchen makes pieces
  differently for diets and allergies (`swaps`), and the tea library (`kind`, `caffeine`, optional `strength`, `milk`,
  `pairs`, `origin`, `notes`, `steep`).
- `stand`: `{ photos, maxGuests, champagne?, note? }`: one photo per tier, the most guests, and the champagne table
  (`{ bottles, photo?, note? }`: bottles from the drinks list, poured at the table).
- `giveSitting`: `{ gifts, message, validMonths, terms, note? }`; each gift has the shop's Stripe Payment Link at its
  price (`https://buy.stripe.com/test_…` on demos, a live link on client sites).
- `music`: `{ sets, note?, photo? }`; `dressCode`: `{ summary, rules, etiquette?, checked }`.
- `order.daysAhead?` (cakes to order: collection up to that many days ahead), `order.deposit?` (`{ from, amount, link }`:
  a fixed deposit by the shop's Stripe link once an order reaches `from` pounds), and a dish's `leadDays?` (notice needed).
- `window`: `{ sections, boxes, message, photo?, note? }`: the menu sections in the pâtisserie window (every piece with a
  photo) and the boxes (`count`, `price`, the shop's Stripe Payment Link at that price); `photo` is the box, for the
  gifts page.
- `salonPlan`: `{ photo, spots, note? }`; each spot `{ id, label, x, y, note? }`, `x`/`y` in percent of the photo.
- `tea.seasons`: `[{ id, name, from, to, price, text, photo? }]`, dates as YYYY-MM-DD.
- `teaPage`, `giftsPage`: `{ kicker, title, intro? }` for the afternoon tea and gifts pages.
- `sections`: `tableRequest.photo?` and `.detail?` (Salon's afternoon tea spread), `yourTable`, `sittings`, `sommelier`
  (with optional `photo`), `giveSitting`, `music`, `dressCode`, `window`, `salonPlan`, `seasonalTea`.
- A look can move home sections onto their own page when that page is on: `look.json` → `onPages`
  (`{ "tea-page": [...], "gifts-page": [...], "plan-visit": [...], "events": [...] }`, only the sections in
  `src/kits/restaurant/home.js` `HOSTABLE`). Salon moves the salon plan, seasonal stands and sommelier to afternoon tea,
  Give a sitting to gifts, the dress code and questions to Plan your visit, and music to What's on.
No schema version change: every new key is optional and old sites build unchanged.

## Car hire settings (`kit: "hire"`)
| Key | When | Notes |
|---|---|---|
| `hero.photo`, `hero.photoTall` | always | one car in detail at night, 16:9 and 4:5 |
| `fleet` | always | `{ lead, classes: [{ id, name, line?, photo, photoTall }], range: [2–4 car ids], cars, imported }`. **Import `cars` from the client's Sheet:** `node src/kits/hire/tools/import-fleet.js --site clients/<slug> --url "<published CSV>"` (or `--csv`). Columns are listed in `src/kits/hire/lib/import.js`; lists in a cell separated by `\|`. The import fails, leaving site.json untouched, on an unknown column, an unreadable cell, a missing photo or any car missing a rule |
| car rules | self-drive cars | `rates.day` (+ `weekend`, `week`, `month`), `deposit`, `driver { minAge, licenceYears, maxPoints }`, `insurance { cover, excess, reduction: { price, per, to } or false }`, `miles { perDay or "unlimited", extra }`, `fuelPolicy`, `lateReturn`, `delivery`; optional `payLink` (a deposit Payment Link with `"holds": "request"` and the same amount) |
| chauffeur cars | `class: "chauffeur"` or `chauffeurOnly` | `chauffeur { hourly, minHours }` |
| tuned cars | `class: "tuned"` | `power` and `tuned { mods, insurance, driver? }`; needs `tuned-class` |
| `hire.dates` | always | the shared date-range rules (`horizonDays`, `bankHolidays`, `leadHours`, `minDays`, `maxDays`, `slots`) |
| `hire.rates` | always | `{ weekDays, monthDays, weekend?: { pickUp, returnOn, maxDays } }` |
| `hire.deposit`, `hire.extras`, `hire.delivery` | always | `{ how, when }`; `[{ id, label, price, per }]`; `{ collect, zones: [{ name, fee, districts }], note? }` |
| `hire.availability` | always | `{ source: "sheet", csvUrl, staleAfterHours }` (tab: exactly `car,from,to,updated_at`; a published tab is public, so no names: any other column is refused); `"simulated"` on demos only |
| `hire.deposits` | `deposit-status` | the deposits tab (exactly `ref,status,date,updated_at`, names on an unpublished tab; any other column is refused), `example` on demos only |
| `hire.handover`, `hire.airports`, `hire.chauffeur`, `hire.driverForm`, `hire.bring`, `hire.events`, `hire.longTerm`, `hire.check`, `hire.film` | with their features | see each feature's README |
| `fleetPage`, `chauffeurPage`, `eventsPage`, `longTermPage`, `depositPage`, `beforePage`, `checkPage` | with their pages | `{ kicker, title, intro?, description?, photo?, photoTall? }` |

## Jeweller settings (`kit: "jeweller"`, trade/jeweller)
Validation in `src/kits/jeweller/config.js`. **Nothing about a piece is guessed**: every fact and price is the
client's own; a field left empty shows nothing.
- `hero`: also `piece` (the id the home page opens on), `photo` (16:9, ~2880 wide) and `photoTall` (3:4, ~1170 wide).
- `pieces`: `{ collections: [{ id, name, line? }], items: [...] }`, optional `demoData: true` (demo sites only: specs
  and prices made up for the demo; refused on a client site). Each item: `id`, `name`, `collection`, `photo` (4:5,
  ~1400×1750, plus a 900×1125 card copy at `img/c/<same name>`), optional `photos` (macros, 1:1), `line`, `story`
  (paragraphs), `price` (whole pounds) with optional `priceFrom: true`, or `onRequest: true`; `facts` (any of metal,
  stones, carat, cut, setting, size, dimensions, hallmark, certificate, sourcing: the client's own words; hallmark,
  certificate and sourcing are refused on demos); `occasions`, `months` (1–12), `shape`, `band`, `engrave`, `gift`,
  `hand` (`{ photo, widthMm?, size? }`), `pairs` (band ids).
  Claim words (hallmarked, assay, GIA/IGI/certified, ethical, conflict-free, recycled, lab-grown, guarantee, lifetime…)
  are refused anywhere in a piece, collection line, box, guide, bespoke, stone or story except the matching fact field.
- `piecesPage`, `bridal` (+ `collections`, `words?`, `photo?`), `engagementGuide` (+ `metals`, `settings`, `sizing`),
  `weddingBands` (+ `collection`, `notes`), `bespoke` (+ `steps` with `when`, `timing`, `brief`, `deposit?` with a
  `payLinks` id, `photo?`), `family` (+ `pairs` of `before`/`after`, `keep`, `start`), `gifts` (+ `bands` of
  `{ label, min?, max? }`, `wrapping`), `occasions` (+ `items` `{ id, name, from, to, line, pieces? }`, and `pages` `{ id, name, photo, photoPhone, line, story?, by?, pieces, reminder?, birthstones? }`: an occasion with its own page at `/occasion-<id>`; an `id` matching an item shows its dates), `party` (`{ title, intro, photo, photoPhone, pieces, roles, max, lead? }`, the `/bridal-party` page), `giftNote` (`{ line, max, sample? }`, the gift arranged), `birthstones`
  (+ twelve `months` `{ stone, line? }`), `ringSizer` (+ `postal`, `message`), `aftercare` (+ `items`, `reminder`),
  `stories` (+ `items` with `steps` of `{ photo, caption }`): each page `{ title, intro, description? }`.
- `appointments`: `{ message, reasons, when?, reply?, notice?, horizon?, slots?, minutes?, bankHolidays? }`. With the
  shared `date-range` feature on, the request asks for a day on a calendar: `slots` (the house's own times) and
  `bankHolidays` (`"closed"` or `"open"`) are required, `notice` is days ahead (0–30), `horizon` how far ahead (7–365),
  and `when` is no longer needed. `room`, `box`, `prepared`, `anniversary` (`weeks`, `line`), `stones`,
  `thePiece` (`piece`, `film` `{ wide, tall, poster, posterTall, credit? }`), `engraving` (`max`, `styles`, `photo`,
  `path`, `note`), `proposal` (`line`, `styles`, `budgets`).
- Page addresses: `/pieces`, `/piece-<id>`, `/bridal`, `/engagement`, `/wedding-bands`, `/bespoke`, `/stories`,
  `/family-pieces`, `/gifts`, `/occasions`, `/birthstones`, `/ring-size`, `/aftercare`, `/collection-<id>`. Another kit
  may use the same page name: the build only skips pages of features in the site's own kit (`scripts/lib/render.js`).
- `business.schemaType` may be `JewelryStore`.
No schema version change: the kit is new and every key is the jeweller's own.

# Changelog

## Unreleased (car hire: hire kit, Datum look, Datum Hire demo)
- **Plans, every kit:** a generated collection (a fleet with its class and car pages; later a jeweller's pieces, a bridal
  shop's gowns) counts as ONE page; unlisted utility pages are free like Plan your visit. The build lists, checks and
  budgets pages in folders (`/fleet/<class>`, `/cars/<car>`).
- New kit **`hire`** with 26 features of its own (see `docs/FEATURES.md`), the fleet Sheet import, live availability and deposits
  from the client's Sheet; new look **Datum**; demo **Datum Hire**. `date-range` and `pay-link` now list `"hire"`.

## Unreleased (jeweller kit, Nacre look, Aldous Marr demo)
- Jeweller additions: the appointment request asks for a real day on the shared date picker (the house's notice,
  hours, closed days, bank holidays and its own times; Starter); occasion pages with their own photograph, the set and
  their tools (Plus, part of occasions); bridal party orders (Plus); three within your budget on the anniversary
  reminder and occasion pages, carried in the calendar file (Signature); the vitrine on the pieces page (Signature); the
  gift, arranged, with the card written on the house's card (Signature). Calendar files now fold long lines.
- Shared: `date-range` lists `jeweller` in its kits (registry only; no change to the picker).
- New kit `jeweller` for fine jewellers and goldsmiths. Starter: collections, one piece at a time, the private
  appointment request, drop a hint, the room, in the box, your visit. Plus: a page for every piece, bridal, the
  engagement guide, wedding bands, bespoke (deposit by Payment Link), family pieces, gifts, occasions, birthstones,
  the ring sizer, aftercare reminders, your tray, anniversary reminders, the stone guide, collection pages.
  Signature: the piece in detail, on a hand at true size, pair it, from sketch to ring, inside the band, a proposal.
- Facts and prices are only ever the client's; claim words are refused outside their own field, and a demo can't carry
  hallmarks, certificates or sourcing claims (`src/core/lib/config-jeweller.js`).
- New look `nacre`: a pearl ground with conch pink as the one bold colour (the box band, the appointment button, the
  phone bar), Italiana and Albert Sans, a centred monogram, one still piece with no headline, a six-section home page
  (the rest on Plan your visit or their own pages: look.json `visitOrder`).
- New demo **Aldous Marr** (`sites/demos/jeweller`).
- `JewelryStore` added to the schema.org types; `pay-link` available to the jeweller kit.
- Shared: a page is skipped only when no enabled feature brings it, so two kits can use the same page name
  (`scripts/lib/render.js`; the jeweller's `/gifts` and `/aftercare`). Gift cards: preset amounts up to £2,500 and a
  custom amount up to £10,000 (`src/core/lib/config-extras.js`).
## Unreleased (shared: date picker and request deposits)
- New shared feature **`date-range`**: a start-and-end (or one-date) picker any kit can put inside its own feature.
  Month calendar with one ARIA grid and named days ("Saturday 14 November, free"), the business's own times, closed
  days, bank holidays, notice, a booking horizon and days taken on its Sheet (an unreadable Sheet blocks nothing and
  says to ask). The business's UK clock, never the visitor's. Plain date inputs without JavaScript; no layout shift.
  Logic in `src/core/lib/date-range.js` (no prices). Not on any kit yet: the hire and jeweller kits add themselves.
- **`pay-link`**: a deposit can be `"holds": "request"`: it says it holds a request the business confirms with you,
  never a booking, and can carry a reference to the request as Stripe's `client_reference_id`
  (`src/core/lib/pay-ref.js`). Every existing Payment Link renders exactly as before.

## Unreleased (restaurant kit: Salon look, Grenat demo, grand café features)
- New look **Salon** (baroque grand café): its own header, hero, footer, phone bar, section heads and markup for the
  table request (a concierge card), menu, menu page, PDF link, specials, cakes to order, private hire and visit.
  The room changes between day and candlelight with the sittings, on every plan.
- New features: `sittings` (starter), `music` and `dress-code` (plus), `your-table`, `tea-sommelier` and
  `give-a-sitting` (signature). The order page can take cakes to order (`order.daysAhead`, each dish's `leadDays`,
  `order.deposit` by Stripe Payment Link). The table request can use a `<select>` for times.
- New demo **Grenat** (`sites/demos/grand-cafe`).
- Settings: `hero.room`, `tea` (strength, milk, pairs), `stand`, `giveSitting`, `music.photo`; all optional.
- New features: `the-window` and `salon-plan` (signature), `seasonal-tea`, `tea-page` and `gifts-page` (plus). Salon
  markup for candlelight tonight, Plan your visit and What's on. Settings `window`, `salonPlan`, `tea.seasons`,
  `teaPage`, `giftsPage`; a look's `onPages` moves home sections to their page.

## Unreleased (bakery kit, Cacao look, Velvet Spoon demo)
- A look can supply its own header, footer, phone bar, section intros and any feature's markup (PR #13).
- New kit `bakery` for chocolatiers, dessert shops, gelaterias, pâtisseries, bakeries and cake makers: the gelato wall,
  today's counter from a Google Sheet (optional `left` count), the menu with allergens and eggless/vegan/halal filters,
  open late, delivery links, the shop film (Starter); menu page, celebration cakes, collect, private hire, Payment
  Links, the flavour vote (Plus); the box with its gift link, and the tasting flight (Signature).
- New look `cacao`: one cacao pod split open (roasted nib ground, pulp text, pistachio as the one colour), DM Serif Display and
  Archivo, a pistachio ribbon with the shop's seal across every page, shelves with tickets instead of cards, the film
  hero, and one "Order" ribbon bar on phones.
- More for chocolatiers: from the kitchen today (Starter); take-home gelato tubs, posted boxes, a box a month and
  favours by quantity (Plus); your seal on the favour lid and the advent box (Signature).
- The image budget is split: what loads straight away stays under 400 KB a page, everything on a page under 2 MB.
- A feature can bring more than one page (`morePages` in the registry; the box brings the gift page).

## Unreleased (restaurant kit, Carte look, Saffron & Ash demo)
- New kit `restaurant` with 13 features: menu (sitting on now, diet and allergy filters, the 14 allergens on every dish), today's
  specials and sold-out (Google Sheet), table request, delivery links (Starter); menu page with allergen chart, live walk-in board,
  takeaway with total and allergens, pairings, events, private dining (Plus); The Table, The Room and The Pass (Signature).
- New look `carte`: a printed menu card, Bodoni Moda and Schibsted Grotesk; day colours by day, candlelight for evening sittings,
  set before the first paint by a fixed inline script allowed in the CSP by its hash (`src/core/lib/daypart.js`).
- New look `maison` (the demo's look): always dark, bottle green, ivory and saffron, Cormorant Garamond and Jost; a full-screen
  hero film of the restaurant's own photos. Carte stays for daytime cafés (used by the client fixture).
- New: PDF menu (Starter; generated at build time from the menu with pdfkit, set in the look's print fonts, the allergen
  chart on the last page; or the restaurant's own PDF), hero film (Starter), the Menu Book (Plus: turns its pages, specials
  on a slip inside the cover). The Table and The Room now sit in drawers after the table request; The Pass is swipeable
  stories on phones.
- Maison's hero is now the Menu Book on the table with the grill burning out of focus behind it (`hero-film` gained a
  `video` mode: a short loop whose still paints first and which starts after the page has loaded). The book drops a dish's
  photo onto the page like a polaroid, and its cover changes with the season (set before the first paint by the head script,
  which now also sets `data-season`). Dishes can have a `photo`. The demo has a new, darker photo set at twice the size.
- A shared Pause button (`core/partials/motion-pause.njk`, WCAG 2.2.2) for hero parts that move by themselves: the hero film
  and Noir's barber pole. Remembered for the visit; a paused visit doesn't download the loop.
- Features start in short slices (core.js yields every ~40 ms), so start-up never blocks a phone in one long task.
- A kit can run a step after the build (`src/kits/<kit>/build.js` → `afterBuild`).
- The 14 allergens moved into `src/core/lib/allergens.js` (shared, for bakeries and cafés later).
- Price list, prices page and before/after are now listed for barbers and car studios only.
- Demo `sites/demos/restaurant` (Saffron & Ash, fictional, Manchester) and client fixture `test-restaurant-client` (Starter with
  the live board and The Table as add-ons, own accent and type).

## Unreleased (barber: Street look, Swift Cuts demo, five new features)
- New look `barber-street`: daylight paper and enamel blue, Bricolage Grotesque and Figtree, pill buttons, rounded ink-outlined cards, a street-name plate and a live "today" ticket (status, queue, top prices) in the hero.
- New demo `sites/demos/barber-street`: Swift Cuts, an express walk-in shop on Boar Lane, Leeds, with its own barbers, copy and licence-free photos (credited in `img/CREDITS.md`).
- Signature feature "Will I make it?" (`fit-a-cut`): done-by time, cut and where you are coming from give a yes/no, a walk-wait-cut-walk timeline and a leave-by time from the live queue; otherwise the best time left today with a calendar reminder.
- New features, usable by any trade: walk-in queue (live wait from a one-question Google Form, usual-busyness heatmap, quietest hour left today), loyalty card (free cuts a year slider), memberships (savings calculator), before/after slider, gift vouchers (make one, order on WhatsApp).
- A look can lead with different home sections (`look.json` → `homeOrder`, every section once; unit-tested). Noir's order is unchanged.
- Demos no longer each need every feature: between them, a kit's demos must show every feature (`npm run rules`), so each demo can show a different set.
- `parseCsv` and `parseSheetTime` moved to `src/core/lib/sheet.js` (shared by the chair board and the queue; still exported from `chairs.js`).
- Audit B fixes: the security policy now allows the queue's Google Sheet (the test server applies each site's `_headers`, so a policy that blocks something fails tests); waits come only from the live queue (busyness shown as words); "Will I make it?" plans from opening time before opening; controls that need JavaScript are hidden without it (`data-js-only`, `data-no-js`, `data-ready` set by core); reminders in UTC; before/after demo photos labelled as an example only.
- Client fixture `test-barber-street` (Plus with the queue as an add-on, own accent and type).

## 0.4.0 — 2026-10-23 (barber: 6 pages, Instagram, seasons, add-ons)
- Instagram gallery (schema 3): home strip and Our work page with hashtag filters, endless scrolling and an enlarged view with booking; live through Behold or from stored photos.
- Seasonal modes with UK date presets (`npm run seasons`).
- Pages from customer questions: Before you come in (home), Plan your visit (free on every plan: live arrival board, live parking, journeys with Google Maps directions, leave-by helper, access checklist), Prices with times, team filter by speciality (e.g. hair type); `docs/CUSTOMER-QUESTIONS.md` for every trade.
- Add-ons (features above the plan, sold singly) and page limits per plan.
- Looks describe themselves (`look.json`); diagram colours come from look tokens; house rules scan kit code for colours.
- Layout shift fixed with size-matched fallback fonts (home page on phones 0.175 → 0.000).

## 0.3.0 — 2026-10-23 (before the first client)
- Booking setting: Book buttons go to the shop's Booksy, Fresha, WhatsApp or phone (linked, never embedded).
- Chair board repositioned as an optional walk-in add-on: reads a Google Form's responses, newest answer per barber, "updated N min ago" on each card.
- Validation covers hero, nav, messages, section headings, menu prices and times, links, schema type and dates; errors name the field; builds fail on blank headings.
- One price source: price-list lines can point at the cut builder; no pre-ticked paid extras.
- Privacy page on every site; favicon per look; 404 has no canonical; HSTS without includeSubDomains.
- Photo credits required for every site's images (`img/CREDITS.md`); `new-client` works from any folder; budget fails on a missing build.

## 0.2.0 — 2026-10-23 (audit A, barber: fixes)
- Chair board judges each barber's row on its own; never offers a past time; reads UK-format Google Sheet timestamps; "busy until" needs one update per cut.
- Reviews show each review's own star rating and month (schema 2: `rating`, `date`).
- Drawn map replaced by an address panel with a real Google Maps link (schema 2: `mapLabels` removed).
- Style guide published under the business's name; a barber is named only as having checked it (schema 2: `reviewedBy`).
- Copy that overclaimed removed: plan page counts, "this week in the chair", "we'll keep the first slot".
- Release gate: CI promotes green `main` to `production`; Cloudflare builds `production` with `npm run release`.
- Tests run at a fixed time; accessibility checked with the shop open and closed; closed-state contrast fixed; new tests for the header Book and phone WhatsApp buttons.
- House-rules check (`npm run rules`); feature CSS moved fully onto tokens.
- CI skips docs-only changes and draft pull requests, and cancels superseded runs.

## 0.1.0 — 2026-10-22
- Kit structure: shared core, features with registry, barber kit, Barber Noir look, demo layer.
- Barber demo (Fade District) rebuilt from config: home, team page, style guide.
- Config validation (schema v1), build verification, unit and end-to-end tests, size budget, CI.

## Café (trade/cafe) — 2026-10-28
- New look **Counter** (restaurant kit): the café's counter photo in a brass-lined arch with each bake tagged live, Gloock and Onest, order-ticket buttons, a teal tile frieze. Demo **Morrow** (fictional, Gloucester Road, Bristol).
- New café features: Your usual, the glass case, how busy is it now, the seat finder and the brunch builder (Signature); Can I work here? and the regulars' board (Plus).
- The specials sheet reads optional `fresh`, `busy` and `board` rows; a café's bakes show fresh-out and sold-out tags, and the coffee board sits beside the slip. Restaurants' sheets read as before.
- Table requests can be limited to some sittings (`tableRequest.sittings`) and carry a brunch pre-order.
- Café sections a look doesn't list (Carte, Maison) appear just before the page links when switched on.
- The loyalty card works on the restaurant kit: it compares against a menu item, "N times a week" (barbers unchanged).


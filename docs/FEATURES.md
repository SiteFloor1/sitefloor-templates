# Features

The source of truth is `src/features/registry.js` (shared features) and each kit's `src/kits/<kit>/kit.js` (its own). Each feature folder has a README with its config and failure behaviour.

| Feature | Plan | Trades | README |
|---|---|---|---|
| Seasonal modes | starter | all | `src/features/seasonal/README.md` |
| Price list | starter | all | `src/features/price-list/README.md` |
| Visit (hours + address) | starter | all | `src/features/visit/README.md` |
| Before you come in (questions) | starter | all | `src/features/questions/README.md` |
| Gallery (Instagram or photos) | starter | all | `src/features/gallery/README.md` |
| Reviews | starter | all | `src/features/reviews/README.md` |
| Plan your visit page (free on every plan) | starter | all | `src/features/plan-visit/README.md` |
| Our work page | plus | all | `src/features/work/README.md` |
| Team page (with speciality filter) | plus | all | `src/features/team/README.md` |
| Prices page | plus | all | `src/features/price-page/README.md` |
| General pages (About us, Services, Gift vouchers…; each counts as a page) | plus | all | `src/features/custom-pages/README.md` |
| Photo band | plus | all | `src/features/photo-band/README.md` |
| Page links | plus | all | `src/features/page-links/README.md` |
| Style guide page | signature | barber | `src/kits/barber/features/style-guide/README.md` |
| Build your cut | signature | barber | `src/kits/barber/features/build-your-cut/README.md` |
| Walk-in board (optional) | signature | barber | `src/kits/barber/features/chair-board/README.md` |
| Loyalty card (with free-cuts slider) | starter | all | `src/features/loyalty/README.md` |
| Memberships (with savings calculator) | plus | all | `src/features/memberships/README.md` |
| Before / after slider | plus | all | `src/features/before-after/README.md` |
| Gift vouchers (make one, order on WhatsApp) | plus | all | `src/features/vouchers/README.md` |
| Walk-in queue (live wait + usual busyness) | signature | all | `src/features/walk-in-queue/README.md` |
| Will I make it? (fit a cut in before your train) | signature | all | `src/features/fit-a-cut/README.md` |

**Which demo shows what:** Fade District (Noir) shows the chair board, build your cut, style guide, team, our work, photo band,
page links and general pages; Swift Cuts (Street) shows Will I make it?, the walk-in queue, memberships, loyalty card, before/after and gift vouchers.
Both show prices, visit, plan your visit, questions, gallery, reviews and seasons. Every feature works with either look.

**Pages per plan** (counting home; Plan your visit and privacy don't count): Starter 1, Plus 5, Signature unlimited.
The same limit for every kit, and two rules that keep it fair:
- **A generated collection counts as one page.** A fleet (index + class pages + a page per car), a jeweller's pieces or a
  bridal shop's gowns are made from the client's own list, so 3 items or 300 they count once (`collection` in the registry).
- **Unlisted utility pages are free**, like Plan your visit, privacy and 404: pages reached only by a link the business
  sends (a deposit status, "your car, live") never count (`unlisted` in the registry).
Every general page in `pages` counts as one, so a Plus barber can have home, our work, the barbers, prices and one general page
(`PAGE_LIMITS` in the registry).

**Add-ons**: any feature above the site's plan can be sold on its own. List it in both `features`
and `addons`; validation then allows it, and add-on feature pages don't count towards the page limit. General pages are sold one at a time with `addonPages: N`.

Always on (core): header with live open/closed status, mobile menu, footer with privacy link, mobile
call/booking bar, booking buttons (`booking`), privacy page, SEO (titles, canonical, Open Graph,
LocalBusiness JSON-LD, sitemap, robots), security headers.

## Car studio kit (`kit: "car"`)

Walk-in queue, Will I make it?, loyalty and memberships are barber-only for now (their wording is about cuts).

| Feature | Plan | Trades | README |
|---|---|---|---|
| Wrap swatch library | starter | car | `src/kits/car/features/swatches/README.md` |
| PPF page | plus | car | `src/kits/car/features/ppf-page/README.md` |
| WhatsApp quote | starter | car | `src/kits/car/features/quote/README.md` |
| Aftercare reminder card | starter | car | `src/kits/car/features/aftercare-card/README.md` |
| Have you done my car? (model finder) | plus | car | `src/kits/car/features/model-finder/README.md` |
| Next free bay + deposit | plus | car | `src/kits/car/features/next-bay/README.md` |
| Aftercare page | plus | car | `src/kits/car/features/aftercare/README.md` |
| Window tint page | plus | car | `src/kits/car/features/tint-page/README.md` |
| The Showroom | signature | car | `src/kits/car/features/showroom/README.md` |
| Driver's seat view | signature | car | `src/kits/car/features/driver-view/README.md` |
| Protection planner (PPF) | signature | car | `src/kits/car/features/protection-planner/README.md` |
| Stone chip test | signature | car | `src/kits/car/features/chip-test/README.md` |
| Your car, live (private progress page) | signature | car | `src/kits/car/features/job-tracker/README.md` |

The car kit's Prices page (`price-page`) shows every job for every vehicle size, with times (`src/kits/car/features/car-prices.njk`).

## Restaurant kit (`kit: "restaurant"`)

Generous below Signature: everything a diner asks is answered on Starter and Plus; Signature keeps the three showpieces.
Price list, prices page and before/after are for barbers and car studios only (the menu carries prices and allergens).

| Feature | Plan | Trades | README |
|---|---|---|---|
| The menu (sitting on now, diet and allergy filters, the 14 allergens on every dish) | starter | restaurant | `src/kits/restaurant/features/menu/README.md` |
| Today's specials and sold-out (Google Sheet) | starter | restaurant | `src/kits/restaurant/features/specials/README.md` |
| Book a table (WhatsApp request) | starter | restaurant | `src/kits/restaurant/features/table-request/README.md` |
| Delivery and collection links | starter | restaurant | `src/kits/restaurant/features/delivery/README.md` |
| PDF menu (generated from the menu, or the restaurant's own) | starter | restaurant | `src/kits/restaurant/features/menu-pdf/README.md` |
| Hero film (a short loop of the restaurant's footage, or its photos, full screen) | starter | restaurant | `src/kits/restaurant/features/hero-film/README.md` |
| Menu page with the allergen chart | plus | restaurant | `src/kits/restaurant/features/menu-page/README.md` |
| Right now (walk-in tables, live board) | plus | restaurant | `src/kits/restaurant/features/tonight/README.md` |
| Takeaway (order for collection) | plus | restaurant | `src/kits/restaurant/features/order/README.md` |
| What to drink with it | plus | restaurant | `src/kits/restaurant/features/pairings/README.md` |
| Events page | plus | restaurant | `src/kits/restaurant/features/events/README.md` |
| Private dining page | plus | restaurant | `src/kits/restaurant/features/private-dining/README.md` |
| The Menu Book (a menu that turns its pages; dish photos as polaroids; the season on the cover) | plus | restaurant | `src/kits/restaurant/features/menu-book/README.md` |
| The Table (group diet planner) | signature | restaurant | `src/kits/restaurant/features/the-table/README.md` |
| The Room (where to sit) | signature | restaurant | `src/kits/restaurant/features/the-room/README.md` |
| The Pass (plates up close) | signature | restaurant | `src/kits/restaurant/features/the-pass/README.md` |

| Desserts with allergens and eggless / vegan / halal filters | starter | bakery | `src/kits/bakery/features/desserts/README.md` |
| Today's counter (shelves of what's in, from a Google Sheet; "Only 2 left today") | starter | bakery | `src/kits/bakery/features/bakes/README.md` |
| Gelato wall (today's tubs with prices; sold out says "Back tomorrow") | starter | bakery | `src/kits/bakery/features/gelato-wall/README.md` |
| From the kitchen today (one line from the Sheet, quiet after six hours) | starter | bakery | `src/kits/bakery/features/kitchen-line/README.md` |
| Shop film (the hero clip: plays after the page, pauses with reduced motion or data saver) | starter | bakery | `src/kits/bakery/features/shop-film/README.md` |
| Open late (closing time, last orders counting down, seats) | starter | bakery | `src/kits/bakery/features/late-night/README.md` |
| Delivery links | starter | bakery | `src/kits/bakery/features/delivery-links/README.md` |
| Dessert menu page with the allergen chart | plus | bakery | `src/kits/bakery/features/dessert-menu/README.md` |
| Celebration cakes page (sizes, earliest day, request on WhatsApp, reminder for next year) | plus | bakery | `src/kits/bakery/features/celebration-cakes/README.md` |
| Collect (order for collection within today's hours) | plus | bakery | `src/kits/bakery/features/collect/README.md` |
| Private hire and parties page (guest calculator from the shop's sizes) | plus | bakery | `src/kits/bakery/features/parties/README.md` |
| Take-home gelato (a tub, its flavours from today's wall) | plus | bakery | `src/kits/bakery/features/gelato-tubs/README.md` |
| Posted boxes ("order by noon Thursday, with them Friday", worked out live) | plus | bakery | `src/kits/bakery/features/post-box/README.md` |
| A box a month (gift subscription on the shop's own Stripe link) | plus | bakery | `src/kits/bakery/features/box-month/README.md` |
| Favours (boxes by quantity, price breaks, earliest date) | plus | bakery | `src/kits/bakery/features/favours/README.md` |
| Flavour vote (this week's vote through the shop's Google Form; shares from its sheet) | plus | bakery | `src/kits/bakery/features/flavour-vote/README.md` |
| Payment Links (the shop's own Stripe links) | plus | bakery | `src/features/pay-link/README.md` |
| The box (choose each piece, tie the ribbon, write the card; send it as a gift with its own link) | signature | bakery | `src/kits/bakery/features/dessert-box/README.md` |
| Your seal (the shop's seal redrawn live on the favour lid with their initials) | signature | bakery | `src/kits/bakery/features/favours/README.md` |
| The advent box (24 windows; one more opens each day in December) | signature | bakery | `src/kits/bakery/features/advent-box/README.md` |
| Tasting flight (choose the pieces; the shop's tasting order and notes) | signature | bakery | `src/kits/bakery/features/tasting-flight/README.md` |

The Carte look turns to its evening colours for an evening sitting, set before the first paint (`src/core/lib/daypart.js`).


## Café features (restaurant kit)
| Feature | Plan | Kits | README |
|---|---|---|---|
| On the counter (fresh-out and sold-out tags on the café's bakes, the coffee board) | starter | restaurant | `src/kits/restaurant/features/specials/README.md` |
| Can I work here? (wifi, sockets, laptops, dogs, access; today's laptop hours) | plus | restaurant | `src/kits/restaurant/features/work-here/README.md` |
| The regulars' board (pinned cards from the sheet, a week each) | plus | restaurant | `src/kits/restaurant/features/regulars-board/README.md` |
| Your usual (a glass that fills as you choose; saved on the phone; order ahead) | signature | restaurant | `src/kits/restaurant/features/your-usual/README.md` |
| The glass case (bakes light up when fresh out; put one aside) | signature | restaurant | `src/kits/restaurant/features/the-case/README.md` |
| How busy is it now? (staff's word or the café's usual numbers) | signature | restaurant | `src/kits/restaurant/features/busy-now/README.md` |
| Seat finder (sockets, window, sofa, dog, buggy) | signature | restaurant | `src/kits/restaurant/features/seat-finder/README.md` |
| Brunch builder (plates per person, pre-ordered with the table request) | signature | restaurant | `src/kits/restaurant/features/brunch-builder/README.md` |

## Grand café features (restaurant kit)
| Feature | Plan | Kits | README |
|---|---|---|---|
| The sittings with open now (breakfast to candlelight, the one being served marked) | starter | restaurant | `src/kits/restaurant/features/sittings/README.md` |
| Live music now (the café's sets; who is playing or who is next) | plus | restaurant | `src/kits/restaurant/features/music/README.md` |
| The dress code and etiquette card | plus | restaurant | `src/kits/restaurant/features/dress-code/README.md` |
| Cakes to order (the earliest day after each cake's notice; a deposit by Stripe link) | plus | restaurant | `src/kits/restaurant/features/order/README.md` |
| Your table (afternoon tea set guest by guest, sent with the table request) | signature | restaurant | `src/kits/restaurant/features/your-table/README.md` |
| The tea sommelier (three questions, one tea) | signature | restaurant | `src/kits/restaurant/features/tea-sommelier/README.md` |
| Give a sitting (the gift card set as you write; Stripe link and WhatsApp) | signature | restaurant | `src/kits/restaurant/features/give-a-sitting/README.md` |
| The pâtisserie window and the house box (sold-out from the sheet; Stripe link per box; WhatsApp to collect) | signature | restaurant | `src/kits/restaurant/features/the-window/README.md` |
| The salon plan (the room's photograph with its places; the choice goes with the table request) | signature | restaurant | `src/kits/restaurant/features/salon-plan/README.md` |
| Seasonal stands (the year's seasonal teas; the one served now or next leads) | plus | restaurant | `src/kits/restaurant/features/seasonal-tea/README.md` |
| Afternoon tea page | plus | restaurant | `src/kits/restaurant/features/tea-page/README.md` |
| Gifts page | plus | restaurant | `src/kits/restaurant/features/gifts-page/README.md` |
| New season (the shop's newest pieces on models, each named collection · style · colour with its swatches and price) | starter | lingerie | `src/kits/lingerie/features/new-season/README.md` |
| Shop by category (tall photographs of women wearing each category (bras, briefs, suspenders, bodies, nightwear, bridal)) | starter | lingerie | `src/kits/lingerie/features/category-doors/README.md` |
| Chapter openers (a full-width close crop (a strap, a hip, a lace edge) with one line, the price and a link, between sections) | starter | lingerie | `src/kits/lingerie/features/chapters/README.md` |
| Size guide (every band and cup the shop stocks or orders in, as a grid, and how its fitters measure; never works out a size) | starter | lingerie | `src/kits/lingerie/features/size-guide/README.md` |
| Private fitting request (what for, the day and time of day, guests, a name; sent on WhatsApp for the shop to confirm (a video fitting for online brands)) | starter | lingerie | `src/kits/lingerie/features/private-fitting/README.md` |
| Gift wrap (how the shop wraps, and the card written on the page, sent on WhatsApp with the order) | starter | lingerie | `src/kits/lingerie/features/gift-wrap/README.md` |
| Discreet packaging (the box, the plain outer box and the name on the bank statement, in the shop's own words, beside its packaging photograph) | starter | lingerie | `src/kits/lingerie/features/discreet/README.md` |
| Ask the shop (each service (fitting, bridal, personal shopping…) as one line that opens WhatsApp with its own message) | starter | lingerie | `src/kits/lingerie/features/services/README.md` |
| Stockists (online brands) (the shops that carry the brand, by city, with their links) | starter | lingerie | `src/kits/lingerie/features/stockists/README.md` |
| Tell us about her (her size if he knows it, what she wears, the budget, the wrap and the card, sent as one WhatsApp message; the shop sets pieces aside) | plus | lingerie | `src/kits/lingerie/features/tell-us-about-her/README.md` |
| Fit finder (what's wrong with the bra she wears now (the band rides up, the cup gaps…), what the shop's fitters say that usually means, and what to ask at a fitting; never gives a size) | plus | lingerie | `src/kits/lingerie/features/fit-finder/README.md` |
| Drop a hint (on any piece, a WhatsApp message she sends to whoever she likes, with the piece, its price, her size if she adds it, and the link) | plus | lingerie | `src/kits/lingerie/features/hint-sheet/README.md` |
| The tray (up to three pieces she'd like ready at her fitting, chosen on any piece and sent with the fitting request; the phone remembers them) | plus | lingerie | `src/kits/lingerie/features/the-tray/README.md` |
| The drop (online brands) (a countdown to the next collection in the shop's time zone, the waitlist, then the link to shop it while it's live) | plus | lingerie | `src/kits/lingerie/features/drop/README.md` |
| Pre-orders (online brands) (pieces not yet made, each with when it ships and the brand's own Stripe Payment Link) | plus | lingerie | `src/kits/lingerie/features/preorders/README.md` |
| Under the dress (pick the dress (backless, plunge, strapless, sheer) and see what the shop says works underneath, with its pieces; a guide and an editorial on one page) | plus | lingerie | `src/kits/lingerie/features/under-the-dress/README.md` |
| The fitting (what happens, how a bra should fit, the size guide, the fit finder and the request, as a guide and an editorial) | plus | lingerie | `src/kits/lingerie/features/fitting-page/README.md` |
| Bridal (when to start, what to bring, the wedding-morning pieces; the wedding dates on Signature) | plus | lingerie | `src/kits/lingerie/features/bridal-page/README.md` |
| Buying for her (Tell us about her, gift wrap, gift vouchers, and on Signature the fit passport and the gift concierge) | plus | lingerie | `src/kits/lingerie/features/for-her-page/README.md` |
| The founders' story (online brands), in their own words and photographs. () | plus | lingerie | `src/kits/lingerie/features/founder-page/README.md` |
| Fit passport (after a fitting she gets a private code; the page shows her sizes from the shop's sheet, and whoever she gives it to can ask the shop for pieces in them. No names on the sheet) | signature | lingerie | `src/kits/lingerie/features/fit-passport/README.md` |
| Gift concierge (her birthday, your anniversary and Valentine's saved to his calendar, each with reminders weeks before, and a message to the shop to set something aside) | signature | lingerie | `src/kits/lingerie/features/gift-concierge/README.md` |
| The private evening (the evenings the shop closes for one client, free or taken, from its sheet (hidden if the sheet is old); choose one and ask on WhatsApp, the deposit by the shop's Stripe link) | signature | lingerie | `src/kits/lingerie/features/private-evening/README.md` |
| The lace, close (a large photograph of the lace with a loupe that follows the finger or the pointer, the shop's notes on how it's made) | signature | lingerie | `src/kits/lingerie/features/lace-viewer/README.md` |
| Wedding dates (one wedding date in, the shop's own steps out (first fitting, the fitting with the dress, collection), past ones marked, all in one calendar file) | signature | lingerie | `src/kits/lingerie/features/bridal-timeline/README.md` |
| A page for each collection (its own campaign of photographs, its story and every piece in it) | signature | lingerie | `src/kits/lingerie/features/collection-pages/README.md` |
| A page for each piece (its photographs, colours, price, sizes and fit notes, and set aside in my size, the tray and the hint) | signature | lingerie | `src/kits/lingerie/features/piece-detail/README.md` |
| Fuller bust (the shop's range, the shapes that hold, the fitters' notes, as a guide and an editorial) | signature | lingerie | `src/kits/lingerie/features/fuller-bust-page/README.md` |
| Stockings and suspenders (sizes, a belt or hold-ups, how to fasten, care, as a guide and an editorial) | signature | lingerie | `src/kits/lingerie/features/stockings-page/README.md` |
| Care (washing and keeping silk and lace, in the shop's own words) | signature | lingerie | `src/kits/lingerie/features/care-page/README.md` |
| The lace (the craft (how the shop's lace is made and where), with the lace close-up viewer) | signature | lingerie | `src/kits/lingerie/features/lace-page/README.md` |

| Gift takeover (Valentine's and Christmas open the home page: the campaign, an order-by countdown, the edit to give, hints) | plus | lingerie | `src/kits/lingerie/features/gift-takeover/README.md` |
| Bridal party evening (the bride and her party on one of the private evenings; names and wedding date to WhatsApp) | signature | lingerie | `src/kits/lingerie/features/party-evening/README.md` |
**Lingerie (Marese):** the demo shows every lingerie feature; toggles in the demo strip switch between boutique and online brand, and preview the Valentine's and Christmas takeovers, (drop, pre-orders, stockists, founders story). Collection, piece and guide pages never repeat a photograph already on the page.


## Jeweller features (jeweller kit)
| Feature | Plan | Kits | README |
|---|---|---|---|
| Collections as doors (a piece worn; each opens its collection's page) | starter | jeweller | `src/kits/jeweller/features/collections/README.md` |
| One piece at a time (full screen, facts and price as the client gives them; swipe and arrow keys) | starter | jeweller | `src/kits/jeweller/features/piece-viewer/README.md` |
| Visit and appointment (address and hours beside the request: what for, when suits, pieces to have ready; WhatsApp) | starter | jeweller | `src/kits/jeweller/features/appointment-request/README.md` |
| Drop a hint (share sheet or WhatsApp, no number) | starter | jeweller | `src/kits/jeweller/features/drop-a-hint/README.md` |
| The room (one photograph of the private room) | starter | jeweller | `src/kits/jeweller/features/private-room/README.md` |
| In the box (a band of the signature colour with the client's own box) | starter | jeweller | `src/kits/jeweller/features/in-the-box/README.md` |
| Your visit (what happens at an appointment, how long, what to bring) | starter | jeweller | `src/kits/jeweller/features/visit-prepared/README.md` |
| The pieces page, a page for every collection and every piece (counts as one page) | plus | jeweller | `src/kits/jeweller/features/jewel-pages/README.md` |
| Bridal page | plus | jeweller | `src/kits/jeweller/features/bridal/README.md` |
| Engagement guide page (shapes, metals, settings, size) | plus | jeweller | `src/kits/jeweller/features/engagement-guide/README.md` |
| Wedding bands page | plus | jeweller | `src/kits/jeweller/features/wedding-bands/README.md` |
| Bespoke page (process with timings, deposit by Payment Link, brief on WhatsApp) | plus | jeweller | `src/kits/jeweller/features/bespoke/README.md` |
| Family pieces page (before and after, what can be kept) | plus | jeweller | `src/kits/jeweller/features/family-pieces/README.md` |
| Gifts page (by the client's price bands, wrapping, hint, gift card) | plus | jeweller | `src/kits/jeweller/features/gifts/README.md` |
| Occasions page (the next leads; past ones drop off) | plus | jeweller | `src/kits/jeweller/features/occasions/README.md` |
| Birthstones (this month on the home page; a page month by month) | plus | jeweller | `src/kits/jeweller/features/birthstone/README.md` |
| Ring size page (string, a ring on a calibrated screen, a sizer by post; dated UK chart) | plus | jeweller | `src/kits/jeweller/features/ring-sizer/README.md` |
| Aftercare page with a yearly clean-and-check reminder (.ics) | plus | jeweller | `src/kits/jeweller/features/aftercare-reminder/README.md` |
| Your tray (set aside up to three; sent with the request) | plus | jeweller | `src/kits/jeweller/features/your-tray/README.md` |
| Anniversary reminder (.ics, yearly, weeks before) | plus | jeweller | `src/kits/jeweller/features/anniversary-reminder/README.md` |
| The stone guide (each shape in the house's photographs, with its pieces) | plus | jeweller | `src/kits/jeweller/features/stone-guide/README.md` |
| The piece in detail (macro photographs on piece pages) | signature | jeweller | `src/kits/jeweller/features/the-piece/README.md` |
| On a hand at true size (matched once to a bank card) | signature | jeweller | `src/kits/jeweller/features/on-a-hand/README.md` |
| Pair it (ring beside each suggested band) | signature | jeweller | `src/kits/jeweller/features/pair-it/README.md` |
| From sketch to ring (stories page and a section) | signature | jeweller | `src/kits/jeweller/features/sketch-to-ring/README.md` |
| Inside the band (engraving set along the band as they type) | signature | jeweller | `src/kits/jeweller/features/inside-the-band/README.md` |
| Planning a proposal (sent privately on WhatsApp) | signature | jeweller | `src/kits/jeweller/features/proposal-brief/README.md` |
| Bridal party pieces (each role, its piece and how many; the total at the client's prices) | plus | jeweller | `src/kits/jeweller/features/bridal-party/README.md` |
| Occasion pages (anniversaries, birthdays, Valentine's…: the photograph, the set, three within a budget) | plus (part of occasions) | jeweller | `src/kits/jeweller/features/occasions/README.md` |
| Three within your budget (on the anniversary reminder and occasion pages; in the calendar file) | signature | jeweller | `src/kits/jeweller/features/gift-shortlist/README.md` |
| The vitrine (the pieces page as a cabinet of drawers) | signature | jeweller | `src/kits/jeweller/features/vitrine/README.md` |
| The gift, arranged (the piece, the day and the card in the box, written on the house's card) | signature | jeweller | `src/kits/jeweller/features/the-card/README.md` |
Shared features with jeweller looks: `pay-link` (the commission deposit) now lists `jeweller`.
| Date picker (start and end or one date, the business's own times, closed days, bank holidays, notice, days taken on its Sheet) | starter (a part of another feature) | jeweller (the appointment request); hire to come | `src/features/date-range/README.md` |
| Date picker (start and end or one date, the business's own times, closed days, bank holidays, notice, days taken on its Sheet) | starter (a part of another feature) | none yet (hire, jeweller to come) | `src/features/date-range/README.md` |

## Car hire kit (`kit: "hire"`, look `datum`, demo Datum Hire)
Every rule and price is the client's own (the build refuses a car that leaves one out). Requests and deposits only.

| Feature | Plan | What it does | README |
|---|---|---|---|
| `fleet` | starter | Class rail with counts, the leading class (one large car, two beside it, each with its rules), the range strip, "free this weekend?" from the Sheet | `src/kits/hire/features/fleet/` |
| `handover` | starter | The car at your door at night, the key passed over, delivery, collection and the deposit | `…/handover/` |
| `postcode` | starter | Delivery postcode checker: the client's zones and fees | `…/postcode/` |
| `hire-request` | starter | WhatsApp request with the car and dates | `…/hire-request/` |
| `bring-list` | starter | What to bring, with a checklist to save (in the questions and on every car page) | `…/bring-list/` |
| `fleet-page` | plus | The fleet (filters without JavaScript, search, sort, dates), a page per class and per car: ONE page of the plan | `…/fleet-page/` |
| `hire-quote` | plus | A car's calendar and quote with every part; deposit reference | `…/hire-quote/` |
| `fleet-calendar` | plus | A fortnight at a time, a row per car, free or taken from the Sheet | `…/fleet-calendar/` |
| `meet-greet` | plus | Named airports and fees, in the quote | `…/meet-greet/` |
| `driver-check` | plus | "You can request this car if…", never a decision | `…/driver-check/` |
| `driver-form` | plus | The client's own Google Form for licence details; the DVLA check code rule from gov.uk | `…/driver-form/` |
| `tuned-class` | plus | A Tuned class with the client's stated power, modifications and insurance note | `…/tuned-class/` |
| `compare` | plus | Compare two cars line by line | `…/compare/` |
| `first-ten` | plus | The first ten minutes: the client's notes on that car | `…/first-ten/` |
| `chauffeur-page` | plus | Chauffeur services, cars with hourly rate and minimum, quote request | `…/chauffeur-page/` |
| `events-page` | plus | Weddings and events | `…/events-page/` |
| `longterm-page` | plus | Monthly rates and an account request | `…/longterm-page/` |
| `deposit-status` | plus | Where's my deposit, by reference only (unlisted, free on the page count) | `…/deposit-status/` |
| `delivered-tonight` | signature | Showpiece: the car arrives at the door at night as the quote assembles; the confirmation | `…/delivered-tonight/` |
| `journey-planner` | signature | Showpiece: chauffeur stops and times, hours from the client's rate and minimum, a card to share | `…/journey-planner/` |
| `spec-dial` | signature | Showpiece: one control filtering the whole fleet into a row of night photographs | `…/spec-dial/` |
| `handover-check` | signature | The handover checklist at collection and return, kept on the customer's phone (unlisted) | `…/handover-check/` |
| `before-page` | signature | Before your hire as a full page | `…/before-page/` |
| `hire-film` | signature | The client's own film in the hero, with Pause | `…/hire-film/` |

Shared features the kit uses: `date-range`, `pay-link` (deposits with `"holds": "request"`), and the usual `visit`,
`plan-visit`, `questions`, `gallery`, `work`, `reviews`, `photo-band`, `page-links`, `team`, `custom-pages`, `vouchers`, `seasonal`.

| The first appointment (card and request) | starter | bridal | `src/kits/bridal/features/appointment/README.md` |
| Designers stocked | starter | bridal | `src/kits/bridal/features/designers/README.md` |
| Gowns page with the finder | plus | bridal | `src/kits/bridal/features/gowns-page/README.md` |
| Trunk shows and sample sales | plus | bridal | `src/kits/bridal/features/trunk-shows/README.md` |
| Fittings, alterations and veils | plus | bridal | `src/kits/bridal/features/fittings-page/README.md` |
| The gown diary | signature | bridal | `src/kits/bridal/features/gown-diary/README.md` |
| The mirror | signature | bridal | `src/kits/bridal/features/gown-mirror/README.md` |
| The shortlist | signature | bridal | `src/kits/bridal/features/shortlist/README.md` |
| Brides page (reviews as quotes, latest photos) | plus | bridal | `src/kits/bridal/features/brides-page/README.md` |
| Gift page (vouchers, page links) | plus | bridal | `src/kits/bridal/features/gift-page/README.md` |

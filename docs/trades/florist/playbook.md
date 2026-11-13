# Florists: playbook

What to build for this trade (kit `florist`, look `mantel`, demo Ambry). The ground rules and the steps for a new kit: [`docs/TRADE-PLAYBOOK.md`](../../TRADE-PLAYBOOK.md).

## The plan (from the original trade list)

5. FLORISTS. Demo: fictional
   Customers ask: Can you deliver today to my postcode? What's good for a funeral, wedding
   or birthday? Can I add a card? How long will they last?
   Core: shop by occasion; prices; questions; care tips.
   Plus: weddings and funerals pages (sensitive, plain wording); subscriptions.
   SIGNATURE, "Same-day":
   - a postcode checker against the delivery zones;
   - a countdown to today's cut-off ("Order in the next 2h 14m for delivery today");
   - a bouquet builder: pick a palette, size and stems on a drawn bouquet, with the price;
   - a message-card preview in handwriting style;
   - order on WhatsApp or by Payment Link.
   Extras: a remembering-dates reminder (adds to the customer's own calendar, no data
   stored by us).

## Built (kit `florist`, look `mantel`, demo Ambry; PR #37)

Everything lives in `src/kits/florist/` (one entry file, `kit.js`) and `src/looks/mantel/`. Handover for agents:
[`sitefloor-internal/docs/HANDOVER-FLORIST.md`](https://github.com/SiteFloor1/sitefloor-internal/blob/main/docs/HANDOVER-FLORIST.md); design record: [`sitefloor-internal/docs/design/florist.md`](https://github.com/SiteFloor1/sitefloor-internal/blob/main/docs/design/florist.md).

- **Starter:** this week's flowers (which set the site's colour), the honest same-day line and postcode check, choose
  the delivery day, the florist's weekly note, in the room / to your door, the wrap, shop by occasion.
- **Plus:** in season now, the card composer, flowers every week, the care card by QR, rooms we dress, the sympathy
  order, gifts to add, pre-order windows, a page per occasion, a page per delivery area, funeral flowers.
- **Signature showpieces:** name the stems, follow your order, the flower calendar, our work as stories, hotels,
  restaurants and offices (with each client's private page), remember the date, weddings and events with a palette
  from a swatch, workshops with places left, gift a season, the bouquet builder from real stems.
- **Second look:** built (Tissue, Laleh): see "Built: second look" below.

**Deployment note:** the same-day line closes on bank holidays (when the florist does) from a list worked out at build
time for this year and next. Rebuild every florist site at least once a year (any publish does it).

## Second look: social-first bouquet florists

The second look on the `florist` kit, for florists who sell through Instagram and TikTok: young, often a home studio or
a small shopfront, selling the day's bouquets and timed "drops" through DMs, with same-day delivery by car or bike. This
updates the brief in `sitefloor-internal/docs/VISION-REFERENCES.md` (PR #32: "shop-first, hand-tied bouquets and rose boxes, same-day,
drops for Valentine's and Mother's Day") into a plan. **Design is not decided here:** no colours, fonts or layouts. A
different agent designs it from its own references, so it inherits nothing visible from Mantel (golden rule 4). Their
customers' questions: [`questions.md`](questions.md#social-first-bouquet-florists-the-kits-second-look).

### 1. How their customers differ from Ambry's
| | Ambry (Mantel) | Social-first florist |
|---|---|---|
| How they arrive | Google, a recommendation, the address | a reel or a story, on a phone, often from a link in bio |
| What they buy | this week's one arrangement, rooms, weddings, contracts | one of today's bouquets, a drop, a rose box, a gift with balloons |
| When | planned, often days ahead | today, often within hours; drops sell out in minutes |
| Price | starts at £65 | mostly £30–£90, compared on the phone against other accounts |
| How they ask | WhatsApp or a call | Instagram or TikTok DMs ("price?", "available today?", "can you do this?") |
| What reassures them | the room, the name, the craft | it's in stock now, it'll arrive today, it looks like the post, real reviews |
| Where the florist works | a studio people visit | often a home studio: collection only by arrangement, the address not published |

### 2. What the kit already does, and what needs new logic
**Reused as they are** (logic and validation already in `src/kits/florist/`; the new look lays each out itself):
| Feature | Tier | What it does for this florist |
|---|---|---|
| `same-day` | Starter | the cut-off countdown and postcode check: the most asked question, answered honestly |
| `deliver-on` | Starter | a later delivery day, checked against the florist's own days |
| `weekly-note` | Starter | a line from the florist ("roses came in at 6am, the pink ones are going fast") |
| `shop-by-occasion` | Starter | birthday, anniversary, sorry, new baby, by price |
| `card-composer` | Plus | the card preview, as it's typed (the gift-message preview) |
| `gifts-to-add` | Plus | balloons, chocolates, candles, vases at the florist's prices |
| `pre-order` | Plus | Valentine's and Mother's Day windows with the florist's own order-by dates |
| `occasion-pages`, `delivery-areas` | Plus | a page per occasion and per delivery area (local search) |
| `follow-order` | Signature | being made, on its way, delivered, with the photo of the actual bouquet |
| `gift-a-season`, `every-week` | Plus/Signature | a bouquet a week or a month, paid by the florist's own Payment Links |
| `remember-date` | Signature | birthdays into the customer's own calendar with an order-by reminder |
| shared `gallery` (Behold), `reviews`, `vouchers`, `questions`, `plan-visit` | as now | the feed (photos and videos), Google reviews, gift vouchers, questions |

**Needs new logic** (each a kit feature with unit tests; the studio Sheet gains row kinds, failing closed as now):
| Feature | Tier | New logic |
|---|---|---|
| `todays-bouquets` | Starter | several bouquets for today from the Sheet (`bouquet,<id>,price/status/photo`): available, "2 left", sold out; each with its own order message. Today's list replaces "this week's one arrangement" for this look |
| `order-channel` | Starter | one order button that fits how they sell: WhatsApp with the order written out, or Instagram (`ig.me` links can't carry text, so the order is copied and the page says "paste it in the DM") |
| `make-this` | Starter (the easy win) | "Can you do this one?": paste a TikTok, Instagram or Pinterest link (checked against those hosts), a budget and a date; one message to the florist. No image is fetched or stored |
| `studio-collection` | Plus | collection for home studios: the site shows the area and the hours only; the exact address goes in the florist's reply. Needs one shared decision first: plan-visit, the footer and the business structured data publish the full street address today |
| `reel-shop` | Plus | each post in the feed (Behold, with videos) gets "Ask for this one", sending the post's link in the order message |
| `live-dates` | Plus | the florist's next TikTok or Instagram LIVE and pre-order sessions from the Sheet, added to the customer's calendar |
| `the-drop` | Signature | a timed release: a countdown to the drop time, then "12 left / sold out" live from the Sheet (re-read every minute while open), "next drop Friday 9am" after; a Google Form for "tell me next time". A Sheet older than the florist's limit says "check our Instagram" instead of a number |
| `wrap-builder` | Signature | build your bouquet from the florist's real photographs: stems by the stem or bunch, a wrap and ribbon colour, a size; the price from the florist's own price list; the preview is the nearest real photo (never drawn), labelled when it differs |
| `delivery-slots` | Signature (alternative) | morning/afternoon/evening slots with how many are left today, from the Sheet |
| `share-card` | Signature (alternative) | after ordering, a ready-made image for the customer's story ("sent with love, delivered today"), drawn in the browser from the order, nothing uploaded |

### 3. Showpieces
**Best three (Signature):**
1. **The drop.** The thing these florists already do, made honest: the drop opens at the florist's time, the count is
   the florist's own, sold out means sold out, and a stale Sheet never shows a number. It turns "is it still
   available?" DMs into orders.
2. **Build your bouquet from real stems and wraps.** Stems, wrap and ribbon as the florist photographed them, priced
   from their list. It answers "how much for something like this in my budget?" without a DM.
3. **Follow your order, with the photo (and a story card).** Already built for Ambry; here it carries the moment the
   customer wants to post: the bouquet before it left, and an optional story image.

**Alternatives** (alongside or instead): a reel wall where every post can be ordered (`reel-shop`, Plus); "make this
one" from a TikTok link (Starter, the easy win); a delivery-today checker by postcode and cut-off (built, Starter);
delivery slots with places left (Signature); the next LIVE and pre-order sessions (Plus); the gift-message preview
(built, Plus); a bouquet-of-the-day countdown to the cut-off on the home page (Starter, from `same-day`); "rose
boxes and balloons" as a builder mode (Signature).

### 4. Pages
- **Starter** (home + Plan your visit): home with today's bouquets, the drop line if any, same-day and the postcode
  check, "make this one", reviews, the feed; Plan your visit (or collection, once the address decision is made).
- **Plus** (up to 5 including home): Shop (every bouquet, filtered by price and colour), Occasions (with Valentine's
  and Mother's Day pre-orders), Delivery and collection (areas, cut-offs, charges), From our feed (`reel-shop`), and
  the free Plan your visit.
- **Signature** (up to 20): adds The drop, Build your bouquet, Wraps and add-ons, Subscriptions (every week / gift a
  season), Gift vouchers, LIVE and pre-order dates, Your order (unlisted, free), a page per occasion and per delivery
  area (collections, one page each), Care, and Events and pop-ups.

### 5. References (research for the designer, not a design)
Facts as reported by the sources, with their dates; check each account before using it.
| Florist | What it does well |
|---|---|
| **Petalon** (began in east London, now Cornwall; petalon.shop) | the drop model: two bouquets launch every Friday and, once sold out, they're gone; started with bike delivery; affordable, sustainable ([Time Out, Jan 2021](https://www.timeout.com/london/news/five-fab-indie-florists-in-london-to-support-this-valentines-day-012821); [Luxury London](https://luxurylondon.co.uk/lifestyle/interiors/best-independent-florists-in-london/)) |
| **Oh So Floral** (Worcestershire, husband and wife) | sells on TikTok Shop LIVE: over 50 hours of LIVE sessions in the week before Valentine's 2026, each for pre-orders; orders up 85% in two weeks ([Retail Times, 10 Feb 2026](https://retailtimes.co.uk/fresh-flower-sales-grow-by-triple-digits-on-tiktok-shop-driven-by-live-shopping-ahead-of-valentines-day/)) |
| **Sage Flowers** (Peckham) | founded by two people with no floristry background; experimental bouquets and a large following; seasonal bouquets online, delivered from the shop ([Luxury London](https://luxurylondon.co.uk/lifestyle/interiors/best-independent-florists-in-london/)) |
| **Paradise Blooms** (Birmingham) | local delivery only, so customers check their postcode first; Valentine's bundles with balloons ([Stylist, Feb 2021](https://stylist.co.uk/life/best-places-to-buy-flowers-online-florists/387818)) |
| **Bramble and Willow** (Wandsworth) | a plain same-day promise: SW London if ordered before 3pm, other postcodes by 1pm for the next day ([Time Out, Jan 2021](https://www.timeout.com/london/news/five-fab-indie-florists-in-london-to-support-this-valentines-day-012821)) |

Context: TikTok Shop reported its UK flowers and gardening category up 440% year on year and LIVE shopping sessions up
75% before Valentine's 2026 (same Retail Times article). The designer should also look at three or four of these
accounts' own Instagram and TikTok grids, and at one real small shopfront, before proposing anything.

## Built: second look (look `tissue`, demo Laleh, branch `trade/florist-social`)

Approved screen 4 Nov 2026 ([`sitefloor-internal/docs/design/laleh.md`](https://github.com/SiteFloor1/sitefloor-internal/blob/main/docs/design/laleh.md)). Demo `sites/demos/florist-social/`:
Laleh, a home studio in Digbeth, Birmingham; Signature; 19 pages (home, the drop, build your bouquet, occasions and five
occasion pages, delivery and four area pages, collect and visit, our story, care (unlisted), your order (unlisted),
privacy, 404).

| Tier | Features this demo shows | New logic |
|---|---|---|
| Starter | `todays-bouquets` (the feed: ranges, pinned post, what's left, the order for WhatsApp or an Instagram DM), `same-day`, **`make-this`** (the easy extra: send a TikTok, Instagram or Pinterest link with a budget and a day), `plan-visit` | `lib/social.js`: `bouquetStatus`, `postLink`, `makeThisMessage`, `igDm` |
| Plus | **`live-dates`** (the easy extra: the next LIVE sessions into the customer's calendar), `occasion-pages`, `delivery-areas`, `care-card`, `custom-pages` | `upcomingLives`, `liveIcs` |
| Signature | **`the-drop`** (showpiece: countdown, then a fresh count or none), `bouquet-builder` (showpiece: real photographs of each colour and size), `follow-order` (showpiece: the photo of the actual bouquet) | `dropWindow`, `dropState`, `sheetTime`, `eventIcs` |

The studio Sheet gains two row kinds: `bouquet,<id>,few:2 | sold | available | hidden` with `bouquet,updated,<time>`
(counts and "sold" show only while it's recent), and `drop,left,12` / `drop,updated,2026-11-06 19:20`. Each look lays
out only the kit features listed for it in `src/kits/florist/looks.js`; the kit refuses the rest. A drop count older than `staleMinutes` (default 10), missing or impossible is never
shown; a client's site.json can't carry one (`drop.left` is demo only). `same-day` no longer needs `this-week`: it
sits under today's bouquets in this look (`config.js` checks one of the two is on).

**Not built (alternatives, from the plan):** `reel-shop` (Behold posts with "Ask for this one"), `studio-collection`
(needs the shared address decision; Laleh has a small studio unit instead), `wrap-builder` (wraps and ribbons as their
own choice; the builder here chooses colour and size), `delivery-slots`, `share-card`.

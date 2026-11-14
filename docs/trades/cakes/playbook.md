# Celebration cake designers: playbook

Commission studios: wedding and celebration cakes made to order, sold by consultation, sketch and deposit. Not the
`bakery` kit (daily stock, counters, sold-out flags). Kit `cakes`, branch `trade/cakes`. Ground rules and the steps for
a new kit: [`docs/TRADE-PLAYBOOK.md`](../../TRADE-PLAYBOOK.md). Customer questions: [`questions.md`](questions.md).
Design directions: [`directions.md`](https://github.com/SiteFloor1/sitefloor-internal/blob/main/docs/trades/cakes/directions.md).

Status: built 9 Nov 2026 on `trade/cakes`: kit `cakes`, look `atelier` (the owner's pick), demo Pastillage
(`sites/demos/cakes`, Signature, 22 pages), client fixture `tests/fixtures/sites/test-cakes-client` (Plus).
Demo link (published copy with `.html` links): https://sitefloor1.github.io/sitefloor-templates/cakes/

## What makes it sell or fail
- The cake is the product: one cake shown huge on the first screen, never a drawn or 3D cake.
- Couples arrive with three questions: is our date free, how big for our numbers, what will it roughly cost. A site
  that answers those in the first minute gets the enquiry; one that says "get in touch for a quote" loses it.
- The enquiry is the conversion. Everything ends in a WhatsApp message the designer can quote from without a call.
- Fails if: prices are hidden, allergens are vague, or the site promises delivery somewhere the designer won't go.

## Features by plan (approved codes CAKE-1 to CAKE-8, plus pitched extras marked NEW)
Built as: Starter `commissions`, `lead-time`, `cake-date-check`, `allergens`; Plus `servings`, `flavours` (choose by the
slice), `tasting-box`, `cake-care`, `brief-builder` (the order page), `flavours-page`, `allergens-page`; Signature
`seasonal-flavours`, `consultation`, `venue-check`, `how-it-works`, `servings-page`, `tasting-page`, `delivery-page`,
`cake-care-page`, `how-it-works-page`, `commission-pages`, `weddings-page`, `celebrations-page`, `corporate-page`,
`dessert-tables-page`. Allergens are on every plan: orders placed remotely need allergen information before the order.

| Plan | Features | Notes |
|---|---|---|
| Starter £99 | CAKE-1 gallery, "from" prices, servings · CAKE-2 lead time · **easy extra NEW: date check** | Date check: the designer marks booked weekends in a Google Sheet; a couple picks a date and sees "free", "one place left" or "booked". Fails safe: stale or missing data says "ask us", never "free". |
| Plus £199 | Starter + CAKE-3 brief builder · CAKE-4 servings calculator · CAKE-5 tasting box · **easy extra NEW: care card** | Brief builder: date, guests, tiers, flavours per tier, finish, venue, references, sent as one WhatsApp message. Servings calculator as a clear table tool. Tasting box: what's in it, next posting date, the client's Payment Link. Care card: storing, carrying, cutting and keeping the top tier, in the studio's words (a drawn cutting plan is a later add-on). |
| Signature £349 | Plus + CAKE-6 design consultation · CAKE-7 venue delivery checker · CAKE-8 seasonal flavours, and 2–3 showpieces below | |

### Signature showpieces (pick 2–3)
1. **The commission** (recommended lead). The servings calculator and brief builder become one flow on top of a real
   photograph: type your guests and the tiers in the photo re-size (Tally screen); pick a flavour per tier; choose a
   consultation slot (CAKE-6). It sends one tidy WhatsApp brief with a reference number. Plus keeps the plain versions.
2. **Venue delivery checker** (CAKE-7). Postcode district or one of the venues the designer has set up at before
   (a Sheet: venue, set-up notes, arrival time, marquee rules, own photo from that venue). Answers "do you come to us,
   what does it cost, when do you arrive". Unknown districts ask for the venue rather than guess.
3. **The flavour calendar** (CAKE-8). Choose your wedding month; see what's in season then, each flavour shown by its
   own cut (Strata screen). Feeds the brief builder.

### Alternative showpieces (alongside or instead)
- **To scale:** the chosen cake beside a real cake table and a standing guest, in real photos, so a couple sees how tall
  four tiers really is. SVG measuring lines, no 3D.
- **The sketch wall:** past commissions as sketch then finished cake side by side (the client's own scans and
  photos), filterable by season, flavour and size.
- **Anniversary keeper:** after the wedding, a calendar file reminding the couple to defrost the saved tier, plus a
  first-anniversary cake offer by the client's Payment Link.
- **Dessert table planner:** guests and style in, pieces per guest and a suggested table out, sent with the cake brief.
- **Party cake drop:** a monthly limited run of celebration cakes (spaces left from a Sheet), for studios that also do
  birthdays.

## Pages
Approved CAKE pages (29 Oct): 1★ Home · 2★ Wedding cakes · 3★ Celebration cakes · 4★ Flavours · 5★ Order a cake ·
6 Tasting boxes · 7 Servings guide · 8 Delivery and set-up · 9 Corporate and brand cakes · 10 Seasonal flavours ·
11 Dessert tables · 12 Allergens. Plus takes the five ★ pages.

Built for Signature (16 real pages, plus privacy): the twelve approved (Seasonal flavours is the flavour calendar on the
Flavours page) and How a commission works, Commissions (a page for each cake: one collection), Caring for your cake
and Plan your visit. Proposed but not built: The studio, Weddings by season, Journal.

## How the design differs
The owner chose Atelier (9 Nov) from two round-two screens: [`directions.md`](https://github.com/SiteFloor1/sitefloor-internal/blob/main/docs/trades/cakes/directions.md). The statement cake fills
the left of the first screen; beside it the servings calculator builds the cake in type.

## Demo
Fictional studio **Pastillage**, Clerkenwell, London. Companies House (9 Nov 2026): nothing called Pastillage. The
earlier name, Marchpane, was dropped: an active company, E. W. Marchpane Limited (a Sheffield second-hand shop), uses
it. Prices, dates, flavours, delivery areas and reviews in the demo are demo data.

## Open point for the owner
`docs/trades/baker/` still lists "Bakers and cake makers" with no kit. This trade only covers commission studios; the
`bakery` kit covers counters. I've left the baker file as it is.

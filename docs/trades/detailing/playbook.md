# Car detailing: playbook

What to build for this trade (kit `detailing`). The ground rules and the steps for a new kit: [`docs/TRADE-PLAYBOOK.md`](../../TRADE-PLAYBOOK.md).

## Premium car detailing (new `detailing` kit, look `mackerel`, demo Varnell) — built 4 Nov 2026
- Customer: an owner of a car they care about, comparing studios on a phone. The site's job: show the finish, price
  the work by car size, offer a start date, and earn trust while the car is in the bay.
- Its own kit, focused only on detailing (not the car studio kit). Demo brand **Varnell** (fictional; searched, no
  detailer uses it), Weybridge. Design contract, references and comparisons: `sitefloor-internal/docs/design/detailing.md`. Handover:
  `sitefloor-internal/docs/HANDOVER-DETAILING.md`.
- **Starter:** `packages` (DET1, by size), `availability` (DET2, the diary sheet, fails closed), `first-wash` (new:
  the studio's care steps into the calendar), `due-check` ("Is my car due?": the studio's interval from the last
  visit, a 9am reminder file and a WhatsApp to book).
- **Plus:** `coating-explained` (DET5), `package-builder` (DET3, WhatsApp quote, unpriced extras "to quote"), `before-after`
  (DET4, shared), `maintenance` (DET7: a calendar file, and a monthly plan joined through the studio's own Stripe
  Payment Link), `collection` (collection and delivery by postcode district and day, from a sheet, fails closed);
  pages `packages-page`, `coating-page`, `film-page`, `book-page`, and the service pages `wheels-page`,
  `interior-page`, `new-car-page`, `selling-page` (one shared partial: included, steps, "from" prices, a question).
- **Signature:** showpieces `car-progress` (DET6, by code from the sheet, no names), `correction-3d` (DET9) and
  `protection-3d` (DET10, the film-coverage builder: package × car priced from the studio's sheet, covered panels lit
  on the 3D car, sent on WhatsApp), both on Sitefloor's shared SUV, saloon and hatch (the visitor picks; SUV first),
  photo first, loaded on tap; `paint-chart` (the visitor's colour on the 3D car, from the studio's
  paint chart sheet, "approximate on screen"); `lease-return` (what an end-of-lease inspection usually looks at, from
  the BVRLA Fair Wear & Tear Standard for Cars, updated December 2022, checked 5 Nov 2026; priced from the studio's
  sheet, "Ask us" when missing); `paint-request` (DET8); the hero
  option `inspection-light` (only with the client's own matched pair; `clientOnly`, so no demo shows it); pages
  `correction-page`, `maintenance-page`, `aftercare-page`, `results-page`, `care-journal` (one page); the gallery by car
  type (the shared `work` page with car-type filters); general pages for supercars and classics, the studio. The demo
  has 20 pages (the journal counted once), the home page about 5.6 phone screens of sections (7.1 with the footer).
- **Alternatives (not built):** paint depth map (the studio's gauge readings on the car's panels, before and after);
  handover file (a private page per car at collection); a torch over the studio's own swirled photo (instead of
  DET9 when 3D is too heavy); show-prep timeline (.ics); work by paint code; winter care card; a pre-sale
  report (the studio's inspection photos as a page the seller can send a buyer); a paint-thickness passport.
- Honesty: prices, days, warranties, brands and care steps are only the studio's; dates and stages only from a fresh
  sheet; 3D is labelled an illustration; the inspection light only swaps two real photographs of one panel.

# Hair salons: playbook

What to build for this trade (kit `hair`). The ground rules and the steps for a new kit: [`docs/TRADE-PLAYBOOK.md`](../../TRADE-PLAYBOOK.md).

## Flagship hair salon (new `hair` kit), plan for the owner, 6 Nov 2026
- Customer: someone choosing a salon for colour or a new cut, often from Instagram, who wants to know three things
  before booking: what it will cost for *their* hair, who should do it, and how long it takes. Colour adds a fourth:
  the consultation and skin test.
- Demo brand **Selwyn Orr** (fictional; searched 6 Nov 2026, no UK salon of that name), Marylebone. Flagship salon,
  editorial hair photography, the stylist as artist. Design notes and the three screens: `sitefloor-internal/docs/design/hair.md`.
- **Starter:** HAIR-1 price by length and stylist level (the salon's own grid, with times); HAIR-2 stylists with next
  free day (from a Sheet, hidden when stale). Easy extra: **skin-test reminder** (pick a colour date, get a .ics for
  the test at the salon's own notice, e.g. 48 hours before, with its walk-in hours).
- **Plus:** HAIR-3 look book (by cut, colour, texture; each look names its stylist), HAIR-4 colour consultation on
  WhatsApp (two photos: hair now and the one you love, then the consultation slot), HAIR-5 colour upkeep planner (the
  salon's weeks per service → the next visits on a year, .ics), HAIR-6 product shelf. Easy extra: **"My usual"** (the
  last service, level and length kept on the visitor's phone; one tap sends the rebook message).
- **Signature (showpieces):** HAIR-8 **stylist match** (three answers → the stylist whose work and next free day fit,
  with their work beside them); HAIR-7 **before/after with consent only** (shared slider; each pair carries the
  client's consent date, no faces unless consented); HAIR-9 **wedding hair planner** (date → trial, colour and
  final-cut dates by the salon's own rule, one .ics).
- **Pages:** Plus five: Home, Services and prices, Colour, Stylists, Look book. Signature: all seventeen HAIR pages
  (the stylists and look book as generated collections, one page each) plus Plan your visit, privacy and 404.
- **Alternative showpieces (alongside or instead):** a **texture finder** (straight, waves, curls, coils, braids → who
  cuts it, how long, what to arrive with; direction C's hero); **your colour card** (a code from a published Sheet:
  formula name the salon chooses to show, last date, next due; nothing personal); **blow-dry today** (live chairs free
  for blow-dries this afternoon from a Form, the walk-in board idea); **grey-blending path** (the salon's own stages
  over months, as a timeline with dates); **gift a blow-dry** with a card preview (shared vouchers); **the chair at your
  appointment** (what happens hour by hour in a long colour appointment, from the salon's own steps).
- Honesty: prices, times, levels, surcharges, skin-test rules and re-do windows are the salon's own; pregnancy and
  allergy questions link to NHS guidance, never our advice; before/after only with recorded consent; no invented
  reviews or "award-winning".

## Built 9 Nov 2026 (`trade/hair`)
- Kit `hair`, look `length`, demo `sites/demos/hair` (Selwyn Orr, Signature), client fixture
  `tests/fixtures/sites/test-hair-client` (sheet-backed next free days and chairs free today, a before and after pair with consent).
- As planned, with these choices: the texture strip and the colour year are Plus home sections (the owner asked for
  both on home); "my usual" is the Plus easy extra, the skin test the Starter one. The kinds of service (cuts and
  styling, treatments, extensions, men's grooming) are one collection (`group-pages`), linked from the menu, the footer
  and their group on the services page (a collection can't be a menu entry of its own). The Salon and Careers pages use
  the shared general pages.
- Before and after is client only (`clientOnly`): stock can't show one client in one session convincingly, so the demo
  has none. A client's pairs need a consent date or validation refuses them.
- Chairs free today (Signature): the salon's sheet (service, time, stylist, updated "YYYY-MM-DD HH:MM"); a row counts
  only if it was updated today and not later than now, the slot hasn't started and falls in today's hours, and its
  service and stylist are on the salon's lists. The demo simulates three slots after now.
- The phone home page stays about six screens (an e2e guard at 390 × 844); gift vouchers have their own page.
- Stylists are shown through their work, never faces: one photograph of each one's signature cut or colour (`work`),
  all in one grade, with name, level and next free day under it. Without photographs it falls back to a ruled list.
- The blow-dry pass (Plus easy extra): a pack of visits for one price on the salon's own Stripe Payment Link; the salon
  keeps count. Fringe trims are a slot type in chairs free today, not a feature of their own.
- Next free days come from the salon's published sheet (stylist, next free, updated); the demo simulates them.
- The cut photograph needs two files made by hand for each client: the hair layer below the shoulders and the plate
  under it (see `src/kits/hair/features/length-price/README.md`). Budget about an hour per photograph.

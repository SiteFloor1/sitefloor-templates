# Look: Salon

A baroque grand café: Ladurée's salons, the Ritz's Palm Court, Caffè Concerto's windows, the Dorchester's Promenade
by day. Kit: `restaurant`. Demo: **Grenat**, Mayfair (`sites/demos/grand-cafe`), fictional.

## The one hero idea
The room in a gilt frame with cut corners, like a salon mirror, lit for the hour. By day the room in daylight on
pith cream and gilt; from the candlelit sitting, the evening room on rind and velvet. The head script
(`src/core/lib/daypart.js`) sets `<html data-mood>` before the first paint from the menu's sittings, so only the photo
for the hour is fetched and nothing flashes. The house's name sits in the frame, very large. Day to candlelight is part
of the look on every plan.

## Brand world
- **Palette, from a pomegranate on velvet:** pith `#F6EEE0` (day ground), rind `#2E0910` (ink by day, ground by
  candlelight), velvet `#571020`, a seed held to the light `#B4233C` (the accent), the dried crown `#A9824C` (gilt).
- **Emblem:** a monogram, the house's initial in Caslon in a double gilt ring under the pomegranate's crown
  (`header.njk` defines it once as `#brand-mark`; the favicon is the same mark).
- **Motif:** the crown repeated as a band: the concierge card's border, the gift card, the place card, under page
  titles and in the footer. In print and packaging it is the rim on the porcelain and the band on the pâtisserie box.

## References (what came from each)
| Reference | Kind | What we took |
|---|---|---|
| The Ritz London, Palm Court | room | Afternoon tea as a ritual at a fixed hour; gilt, palms and velvet in the photography |
| The Dorchester, The Promenade | room | The day state: a long, light gilded gallery, cream and gold |
| Caffè Concerto and Ladurée salons | shops | Pâtisserie shown abundant and close, on silver and porcelain; jewel colour on gilt |
| Symediane × Louis Vuitton (Maxime Frédéric) | site | Pastry as an object of desire; paired editorial photographs |
| Aman / Maybourne hotel sites | sites | Two-word header (Menu, Reserve), full imagery, almost no copy |
The design system follows the structure of the Porsche Design System (grid, type, spacing, motion as tokens).

## Mini design system
| Part | Rule |
|---|---|
| Grid | 12 columns ≥ 820px, 4 below; margins `clamp(16px, 4vw, 64px)`; gutters `clamp(16px, 2vw, 32px)`; max 1600px; asymmetric (6/5, 5/6, 7/4) |
| Type | Libre Caslon Display (names, titles), Libre Caslon Text (reading, italics), Instrument Sans 500 for 11px spaced capitals only. The name up to 21rem against 11px labels |
| Spacing | 8 · 16 · 24 · 40 · 64 · 104 · 168; sections 72–200px apart |
| Images | Photography only, one shared grade (lifted blacks, warm highlights, softer colour). Hero 16:10 (phone 4:5), portrait 4:5, tiers 1:1, rooms 3:2 |
| Motion | Once, on load: the room settles over 2.4s, the name rises over 1.6s; colour changes over 1.2s; hovers 0.6s. Nothing tied to the scroll; nothing moves with reduced motion |
| Copy | Few words; prices as on a card; nothing explains itself |

## What it owns
`header.njk` (Menu, the monogram, Reserve, above the frame), `hero.njk`, `footer.njk`, `mobile-bar.njk` (Telephone,
Reserve a table on the page's own ground), `section-head.njk`, and its own markup for: `table-request` (afternoon tea's
spread with the concierge card), `menu` (+ `menu-home`, `dish`), `menu-page`, `menu-pdf`, `specials` (+ `today`),
`order` (cakes to order), `private-dining`, `visit`, `tonight` (candlelight tonight, beside today's board),
`plan-visit`, `events` (What's on as a printed programme), `tea-page` and `gifts-page`. The grand café features
(`sittings`, `your-table`, `tea-sommelier`, `give-a-sitting`, `music`, `dress-code`, `the-window`, `salon-plan`,
`seasonal-tea`) were made for this look. `onPages` moves the salon plan, seasonal stands and sommelier to afternoon tea,
Give a sitting to gifts, the dress code and questions to Plan your visit, and music to What's on, when those pages are
on; Your table stays on the home page as its showpiece.

## Showpieces by plan
- **Starter:** the sittings with open now, the carte with every allergen, today's specials and sold-out from the sheet,
  the table request as the concierge card, the printed carte, day to candlelight.
- **Plus:** cakes to order with the earliest collection day and a Stripe deposit, private hire, live music now, the dress
  code and etiquette card, seasonal stands, candlelight tonight, and pages for afternoon tea, gifts, What's on and Plan
  your visit (and gift vouchers, from the shared `vouchers` feature).
- **Signature:** Your table (the stand set guest by guest, place cards, the champagne table), the pâtisserie window
  and the house box (on velvet, like the shop's glass case at night), the salon plan, Give a sitting, the tea
  sommelier.

## Alternatives (not built)
- **The cake atelier:** choose a celebration cake from the pâtisserie's photos, the size and the inscription (shown on
  the cake's plaque), a collection day after its notice, and a deposit by Stripe link. The Signature version of cakes
  to order; the order's lead days and deposit already exist.
- **The pianist's requests:** while the piano plays, ask for a piece from the pianist's own list on WhatsApp.

## Differences from every other look (checked 28 Oct 2026)
See the PR for the full table with screenshots. In short: Salon frames its hero (no other look does; Velvet Spoon,
in progress, plans a full-bleed film), its header sits above the frame on the page's ground, it changes ground between
day and candlelight, and it is the only look in Caslon and in pomegranate colours.

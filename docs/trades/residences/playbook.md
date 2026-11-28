# Luxury residences and hotel-grade rentals: playbook

One building, or a few, of furnished homes let by the night or on a rolling tenancy, with hotel service: "not a
high-street letting agent" (docs/VISION.md, Property rentals: Raffles, The Chancery Rosewood). Kit `residences`,
look `turndown`, demo Sevrell (fictional; no UK company of that name on the Companies House register, checked
26 Nov 2026). Design: round 1, direction A "Turndown", approved by the owner on 26 Nov 2026
(`sitefloor-internal/docs/trades/residences/directions.md`). The lit-building illustration was dropped (Halvern has it).

## The law the kit is built around (`src/kits/residences/lib/rules.js`, each linked to GOV.UK and dated)
- Headline prices hold every mandatory fee (CMA, DMCC Act 2024: no drip pricing): the nightly rate includes service and
  VAT, the cleaning charge is added once and shown inside every total.
- Long lets are rolling tenancies with no end date (Renters' Rights Act 2025), so they are priced by the month, never by
  length; only the payments the Tenant Fees Act permits can be charged. The deposit caps are worked out from the rent;
  above £100,000 a year (not an assured tenancy) nothing is worked out.
- Letting and property management work needs an approved redress scheme, named on every page.

## Features by plan (approved: PROP-1 to PROP-10)
| Plan | Feature | VISION |
|---|---|---|
| Starter | `residences-homes` free now and free from: each free home from the sheet with its photo, size, date, all-in price a night and rent a month; WhatsApp enquiry; fails closed when stale | PROP-1 |
| Starter | `residences-viewing` book a viewing (in person or video), free page | PROP-2 |
| Starter | `residences-fees` fees and terms with the redress scheme, free page, required | PROP-3 |
| Plus | `residences-list` the residences page with filters (stay, bedrooms, date needed) | PROP-4 |
| Plus | `residences-areas` area guides | PROP-5 |
| Plus | `residences-plans` floor plans (client-only) | PROP-6 |
| Plus | `residences-quiet` quiet notes; `residences-quote` send this quote | proposed, approved in round 1 |
| Plus | `residences-short`, `residences-long`, `residences-serviced`, `residences-arriving`, `residences-about` (pages) | pages 6, 7, 12 and the two approved additions |
| Signature | `residences-stay` the stay bar: the showpiece | PROP-9 |
| Signature | `residences-sun` sun on the windows (a tool, approved in round 1) | — |
| Signature | `residences-map` neighbourhood guide | PROP-7 |
| Signature | `residences-concierge` concierge, before you arrive | PROP-8 |
| Signature | `residences-tour` the client's own 3D tour (client-only) | PROP-10 |
| Signature | `residences-corporate`, `residences-owners`, `residences-journal` (pages) | pages 10, 8, 13 |

Pages: 1 Home · 2 Residences · 3 Areas · 4 Book a viewing · 5 Fees and terms · 6 Short lets · 7 Long lets ·
8 For landlords · 9 Concierge · 10 Corporate relocations · 11 Neighbourhood · 12 About · 13 Journal, plus Arriving and
What "serviced" means (approved 26 Nov 2026), Plan your visit and privacy. The quote page is unlisted.

## How the design differs
Turndown is a letterhead, not a portal: a centred key-fob monogram and name, one 2.39:1 cinema-band photograph of a
suite inset in ivory, and the stay bar docked across its foot. Imbue (tall condensed Didone) and Inria Sans; fig-leaf
green from a fig leaf; a double piping line like embroidered hotel linen. Nothing like Halvern (left-set name, a
daylit porch, a brass lift plate, the building in 3D, Petrona) or Thursby (the statement, Frank Ruhl Libre). The
difference table against every demo is in the design round.

## Ideas for later (alongside or instead)
- A corporate relocation pack: one printable page for HR (home, all-in cost, terms, area, arrival).
- Day and night views of a home from the client's own matched photographs (client-only).
- The building with its free homes lit as a Blender illustration, if a second residences look wants a different hero.

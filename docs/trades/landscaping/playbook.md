# Garden designers and landscapers: playbook

What to build for this trade (kit `garden`). The ground rules and the steps for a new kit: [`docs/TRADE-PLAYBOOK.md`](../../TRADE-PLAYBOOK.md).
Customers' questions: [`questions.md`](questions.md). Owner references: Cameron Gardens, Randle Siddeley
([`sitefloor-internal/docs/VISION-REFERENCES.md`](https://github.com/SiteFloor1/sitefloor-internal/blob/main/docs/VISION-REFERENCES.md)). Status: **built** (owner picked Almanac on 9 Nov 2026; kit `garden`, look `almanac`, demo Tollgarth).

## Who buys this
Garden designers, designer-builders and landscaping firms, from a one-person studio doing London courtyards to a firm
building country gardens. Their customers are homeowners spending thousands to tens of thousands, planning months ahead,
usually after an extension or a move. What sells the work: finished gardens shown well, a clear process, honest timing,
and the sense the designer understands *their* plot (aspect, levels, sun). Reference sites mostly show a large uncaptioned
portfolio and very little copy; the gap we fill is answering the questions those sites leave to a phone call.

## Features by plan (approved codes LAND-1 to LAND-8), as built
| Plan | Features (kit ids) | Notes |
|---|---|---|
| **Starter** | `the-year` (the year in twelve plants, the hero), `garden-calendar` (the studio's month, LAND-3's month view, with the next design and build start that hides itself when out of date), `what-we-do` (design, build, care in a line each), `gardens` (LAND-1, gardens by kind) | **Easy extra:** the next-start line inside the studio's month. The month page was moved down from Plus because it is the approved first screen and keeps the site current by itself |
| **Plus** | `before-after` (LAND-2, shared slider; client sites only, their own pair of one place: kit.js `clientOnly`), `calendar-page` (LAND-3's full year and "ready by"), `planting-palette` (LAND-4), `garden-pages` (gardens page and a story per garden), `design-build-care` (a page each), `materials` (the sample table, the owner's pick from direction C), `garden-journal` | **Easy extra:** `design-process` (LAND-6) moved down from Signature: the stages, what you receive, the studio's weeks, where you can stop |
| **Signature** | `sun-study` (LAND-8, the showpiece, on home and its own page), `through-the-year` (LAND-5, client sites only: it needs their own photographs from one spot), `maintenance-plans` (LAND-7, showpiece), `style-pages` (a page per kind of garden), `permission-guide` (England, GOV.UK only, dated) | Showpieces below |

### Signature showpieces (2–3, things a client would show someone)
Home keeps to about six phone screens: the year, the studio's month, design/build/care, four gardens with "Every garden",
and where the sun falls. The Almanac look moves reviews to the studio's page, questions and the studio's address to
Start your garden, and before/after to the gardens page (`onPages` in `look.json`; other looks may keep them on home).
1. **A garden through the year (LAND-5).** Offered to clients who have the photographs; not on the demo. One of the client's gardens photographed from the same spot in each season;
   a quiet month scale under it moves between the photographs (no scroll-jacking; tap or arrow keys). Each month names
   what's flowering, from the client's planting palette. Needs 4 to 12 photos per garden from the client; falls back to
   seasons only when they have 4.
2. **Where the sun falls (LAND-8), the demo's showpiece.** On home: the example garden, turned with a tap or seen
   in December, then "Try your own garden". Calculated for the studio's area. The visitor sets the way the garden faces (a
   compass dial), its width and length, the house and the fence; a drawn plan (SVG) shows hours of direct sun on the
   21st of any month, with the shadows at any hour laid over it, from above or in 3D (an SVG drawing on tap, no 3D
   library). Plain answer under it ("the far end gets about 8 hours, the part by the house about 4"). Tap a spot for
   its hours on 21 June and the palette's plants for that light. Shared code: see below.
3. **Maintenance plans (LAND-7).** The client's plans (e.g. monthly, seasonal, quarterly) laid on a twelve-month rota
   showing what each visit does that month (pruning, mulching, lawn, bulbs), with the client's own price per plan if
   published; "ask for this plan" opens WhatsApp with the plan, garden size and postcode filled in.

### Alternative showpieces (alongside or instead)
- **The materials library:** the stones, bricks, timbers and gravels the studio builds with, each as a full-screen
  photograph, then the client's gardens where it was used; "send me samples" on WhatsApp. Cheap to build, very
  persuasive for designer-builders.
- **Your garden brief:** a short form (size, facing, who uses it, style photos they like, budget band in the client's
  own bands) that becomes a tidy WhatsApp or email brief before the first visit. Built on the shared price-builder engine.
- **Plants for your spot:** facing + soil + how much care, filtered from the client's palette, with what it looks like
  in each season. Light; pairs with LAND-8 or replaces it for a lower price.
- **Start-by planner:** "I want it ready for…" a month; the planner works back through design, build and planting windows
  (the client's own weeks) to a "talk to us by" date, with an .ics reminder.
- **Garden stories:** each project as a page: the brief, the plot before, the plan, the build, a year later.
- **Night garden:** the client's lighting schemes, day and dusk photographs of the same view. *Caution:* Blue hour
  (electrician) already switches a photograph by scene, so this must not open the page.

## Pages
Every site also gets Plan your visit (here "Start your garden"), privacy and 404 free.
- **Starter (home + Start your garden).**
- **Plus, five:** Home · Gardens · Design · Build · Start your garden (the approved ★ five).
- **Signature, 16 real pages:** the five above, then Maintenance plans · Roof terraces · Courtyards · Country estates ·
  Planting through the year · Lighting and water · Design process · Where the sun falls · Journal (client's own
  articles, dated) · **Do I need permission?** (England, GOV.UK only, date checked, "a guide, not a decision") ·
  **Garden stories** (a generated collection, counts as one). Room for more within 20: Plants we love (the palette as a
  page), Areas we cover.

## Shared code: sun position
Done in this kit's PR, after construction and wedding films reached `main`: the NOAA calculation lives once in
`src/core/lib/sun.js` (`solarAngles`, exact; `sunPosition`, to a tenth of a degree), tested in
`tests/unit/sun.test.js`. Construction re-exports `sunPosition` from it; wedding films' `elevation` reads `solarAngles`;
the garden kit imports `sunPosition`. Every page, stylesheet, image and data file of the construction and wedding-film
demos and fixtures builds byte-identical; only their script bundles change (the shared module is imported, +86 to +298
bytes).

## Notes for the build
- Never invent prices, timescales, memberships or reviews: every figure comes from the client's sheet or site.json.
- The planning guide shows England's rules only, from GOV.UK and legislation.gov.uk, with the date checked, both source
  links and "a guide, not a decision"; it is hidden for a site outside England unless the client supplies their nation's
  official source.
- Demo: a fictional studio; check the name isn't a real UK business (Companies House and a web search) before using it.

# Independent tour operators: playbook

What to build for this trade (kit `tourism`). The ground rules and the steps for a new kit: [`docs/TRADE-PLAYBOOK.md`](../../TRADE-PLAYBOOK.md).

## Independent tour operator (new `tourism` kit, branch `trade/tourism`): built 17 Nov 2026
A small UK tailor-made operator selling journeys by phone, WhatsApp and email, with an ATOL for flight-inclusive
packages. Owner's references: Scott Dunn, Audley Travel. Direction: the dream before the booking; journeys told as
stories; a quiet expert voice. Questions: [`questions.md`](questions.md). Design rounds (three directions, then the
Logbook revised): `sitefloor-internal/docs/trades/tourism/design/` (branch `design/tourism`). Approved 17 Nov 2026:
**Larrow**, look `logbook`.

The site is the flagship that answers "where should we go in October?", "what does a day look like?", "has anyone
been?" and "is our money protected?", then turns it into one WhatsApp message. Booking and payment stay with the
operator.

### Features and the plan split (approved 17 Nov 2026)
Every feature runs at £0: the operator's own journeys in `site.json` (or a Sheet), WhatsApp pre-filled messages, the
browser's own time-zone data, Natural Earth outlines (public domain) drawn at build time, typical weather worked out
once from a named free source, gov.uk links, and a published Google Sheet for the private trip page.

| Code | Plan | Feature id | What it does |
|---|---|---|---|
| TOUR-1 | S | `tourism-journeys` | The journeys with photograph, where, nights, best months, the operator's own "from" price, Ask about it on WhatsApp |
| TOUR-2 | S | `tourism-atol` | The ATOL number exactly as the certificate gives it, home and every footer |
| new | S | `tourism-local-time` | Local time and the gap to London for the place on show |
| TOUR-3 | P | `tourism-finder` | The year, drawn: journeys as lines across the months; month, who, how long; says when nothing fits |
| TOUR-4 | P | `tourism-when` | When to go: places by month, the operator's months underlined |
| TOUR-5 | P | `tourism-logbook` | Each journey day by day with the country drawn and the route drawing itself to the stop |
| new | P | `tourism-daylight` | Sunrise, sunset and hours of light at each stop for a chosen month |
| new | P | `tourism-shortlist` | Keep journeys, send the list on WhatsApp |
| new | P | `tourism-experts` | Who's been there: experts and the places each has travelled |
| new | Sig | `tourism-month` | The journey of the month on the home page, four journeys beneath as an index |
| TOUR-6 | Sig | `tourism-builder` | Regions and nights within the operator's ranges, one WhatsApp message, no prices |
| TOUR-7 | Sig | `tourism-weather` | Typical highs from a named source and period, never a forecast |
| TOUR-8 | Sig | `tourism-checklist` | The operator's list to tick, and each country's gov.uk advice linked, never retold |
| new | Sig | `tourism-trip` | Your trip by code (private page): journey, start, days to go, from the operator's sheet; nothing personal |

TOUR-9 (the globe): not now; the drawn route is the showpiece. If it comes back, only as a rendered film (Blender),
never 3D in the browser.

### Rules this kit keeps
- The ATOL number is a client field shown exactly as given; we never format, check or explain it.
- gov.uk foreign travel advice is linked, never paraphrased; the build refuses any other address as "advice".
- Weather is "typical", from a named source and period (`climate.source`, `climate.about`); rain is left out unless
  the operator names a better source than reanalysis.
- Prices only as the operator publishes them, with the basis in their words (`sections.journeys.intro`).
- The private trip sheet holds only code, journey, start, travellers and updated: a code is not a password.

### Ideas for later (alongside or instead)
- A rendered globe film per journey (TOUR-9) as a full-screen opener under the index.
- Honeymoon and family journeys as their own pages (VISION pages 6 and 7) from a `for` tag on each journey.
- A traveller's day-by-day as a printable PDF from the logbook.
- "Who's been there" matched to the journey on each journey page.

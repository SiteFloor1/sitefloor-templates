# Mehndi and henna artists: playbook

What to build for this trade (kit `mehndi`). The ground rules and the steps for a new kit: [`docs/TRADE-PLAYBOOK.md`](../../TRADE-PLAYBOOK.md).

## Bridal and event mehndi artist (new `mehndi` kit) — directions stage, 6 Nov 2026
- Customer: a bride 6–12 months out, usually booking with her mother or sister, wanting her date held, a price by
  coverage and to know when to have it done; then the family wanting guests done on the mehndi night. The site's
  job: get a date request with the wedding date, mehndi date, coverage, guest count and postcode in it.
- Demo artist **Hatheli** (fictional; "hatheli" is the Hindi/Urdu word for palm; searched, no UK henna business uses
  it; Companies House to be checked again before the build). Three one-screen directions: [`design/directions.md`](https://github.com/SiteFloor1/sitefloor-internal/blob/main/docs/trades/mehndi/design/directions.md).
- Customer questions: [`questions.md`](questions.md), including the black henna (PPD) line from the NHS.

### Features by plan (approved codes MEHN-1 to MEHN-7)
- **Starter** (home + Plan your visit): MEHN-1 packages (bridal by coverage with hours and from prices, guest rate),
  MEHN-2 date check (open / a few left / taken from the artist's Sheet; "ask about this date" on WhatsApp; never
  "booked"). **Easy extra:** the natural henna promise with the NHS black henna line and date checked.
- **Plus** (up to 5 pages): MEHN-3 design library (by style, coverage and hours, close-ups), MEHN-4 stain and
  aftercare guide (paste to orange to deep brown, how long it lasts, a printable card). **Easy extra:** "darkest on
  the day" under the date check: enter the wedding date, it names the mehndi day from the artist's own lead time.
- **Signature** (showpieces, Signature only):
  1. MEHN-5 **wedding week planner**: the wedding and events (mehndi night, haldi, nikah, walima, reception) give the
     mehndi slot, trial, nails and waxing beforehand, aftercare timings and touch-ups; .ics for each; sent to the family
     on WhatsApp.
  2. MEHN-6 **guest mehndi quote**: guests, design size per guest, how many artists and how long, from price, as a
     WhatsApp message. Uses the artist's own minutes and rates; never "confirmed".
  3. MEHN-7 **personal details in your design**: names, initials, a date, a place, a symbol; where to hide them;
     reference photos by WhatsApp; a real finished example where the visitor can find the name.

### Alternative showpieces (alongside or instead)
- **Coverage on one arm:** wrist, mid-arm, elbow shown on matched photos of the same arm, with hours and price.
- **Mehndi night running order:** bride first, then mothers and sisters, then guests, with times, shared to the family
  group (reuses MEHN-6's maths).
- **Design from your outfit:** the bride sends lehenga or dress photos; the request asks which motifs to borrow
  (peacocks, paisley from the border, the colour of the dupatta) and the artist answers on WhatsApp. No AI.
- **Eid night slots:** Chaand Raat slots left, live from the Sheet (shared live status board), with a deposit link.
- **Aftercare reminders:** .ics alerts the evening of the mehndi ("paste off at 11pm", "no water until morning").
- **Find the name, for the couple:** a private link (by code) where the groom looks for his name in the bride's
  real photo; the artist marks the spot.

### Pages (Signature 18; ★ = Plus five)
1★ Home · 2★ Bridal mehndi · 3★ Designs (one generated collection by style) · 4★ Packages · 5★ Check your date ·
6 Guest mehndi · 7 Events and Eid · 8 Aftercare and stain guide · 9 Wedding week planner · 10 Personal details in your
design · 11 Natural henna (with the PPD line) · 12 About the artist · 13 Journal (getting the darkest stain, mehndi
styles explained; the artist's own writing) · new: 14 Bridal trial and patch test · 15 Travel and areas (postcode
districts, travel fee) · 16 Hen parties, baby showers and birthdays · 17 Corporate and brand events · 18 Booking terms
and FAQs.

### Honesty
Prices, hours, travel rules, deposits, insurance and lead times come from the artist. Stain timing is general ("about
two days") and the artist's figure replaces it. The PPD paragraph quotes only the NHS page, with the date checked. No
invented reviews; demo figures marked as demo.

## Built — 9 Nov 2026 (kit `mehndi`, look `loupe`, demo Hatheli at `sites/demos/mehndi`)
The owner picked direction B (Hidden) on 6 Nov, with the bride brought in through her jewellery and fabric, the guest
quote from C as a section and the NHS line kept. What was built, by plan:

| Code | Feature id | Plan | Where |
|---|---|---|---|
| MEHN-7 (the doorway) | `name-find` | Starter | the hero: the palm in a case, a magnifier, "Show me" rings the hidden name |
| MEHN-1 | `mehndi-packages` | Starter | home and bridal page: packages by coverage beside the bride's hands |
| MEHN-2 | `mehndi-dates` | Starter | home and bridal page: free so far / a few hours left / taken, from the artist's sheet |
| easy extra | `natural-henna` | Starter | home: the paste, the stain, the NHS line on black henna, dated |
| easy extra | `darkest-day` | Plus | under the date check: the evening for her mehndi |
| pages | `bridal-mehndi`, `mehndi-designs` (MEHN-3), `stain-guide` (MEHN-4) | Plus | `bridal`, `designs`, `aftercare` |
| new (owner, 12 Nov) | `stain-days` | Signature, client photos only | home: one stain photographed on the mehndi evening and each day after, dated from her wedding; not in the demo |
| MEHN-6 | `guest-quote` | Signature | home: guests and design size in, artists, hours and a from price out |
| MEHN-5 | `mehndi-week` | Signature | `planner`: every step on its day, calendar file, the family's WhatsApp |
| MEHN-7 | `hidden-details` | Signature | `personal`: what to hide, the words, where, beside a hand to search |

Shared: visit, Plan your visit (the studio), questions, reviews (moved to the bridal page) and general pages. Refused
for this trade: gallery, work, seasonal, photo band, page links, team, vouchers.

Signature demo, 16 pages: home, bridal, designs, aftercare, planner, personal details, Plan your visit, and nine general
pages (natural henna and patch tests, about, Eid and celebrations, parties, brand events, travel, booking terms, and
two journal pieces: the darkest stain, mehndi styles). "Check your date" and "Packages" became sections on the home and
bridal pages rather than pages of their own; "Guest mehndi" is the home section (a page can host it later).

Changes from the plan: ids that other kits already use got a mehndi name (`bridal-mehndi`, `mehndi-packages`, `mehndi-dates`, `mehndi-designs`, `stain-guide`, `mehndi-week`, `hidden-details`); the design
library has no separate home section (the home stays to the approved screen); the printable aftercare card became the
ordered aftercare list (the artifact viewer and many phones can't print).

Owner's review, 12 Nov: display face Rozha One (Darker Grotesque stays with the hair kit); buttons in deep rust, lighter;
body text larger and brighter; new Signature showpiece "Your stain, day by day". Audit H-01 (the demo's natural henna
page no longer words the NHS advice itself; it points to the aftercare page) and H-02 (the design filters keep their
space before the script starts) fixed.

**Sales point (Signature): "your own stain photos, day 0 to 2."** One stain photographed by the artist on the mehndi
evening and the two days after, dated from the bride's wedding with the darkest day named. It needs the artist's own
photographs (no free set shows one stain day by day), so the Hatheli demo doesn't show it; describe it in the pitch
and build it from the client's photos.

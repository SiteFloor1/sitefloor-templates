# Bridal hair and makeup artists: playbook

What to build for this trade (kit `bridalbeauty`). The ground rules and the steps for a new kit: [`docs/TRADE-PLAYBOOK.md`](../../TRADE-PLAYBOOK.md).

## Bridal hair and makeup artist (new `bridalbeauty` kit) — built 15 Nov 2026 on `trade/bridal-beauty`, look `cover`
- Customer: a bride 9–18 months out, usually messaging from Instagram, who needs three answers before anything else:
  is my date free, what will it cost for me and my party, and what time do we have to start. Then the trial, skin
  prep and the morning itself. Usually a solo artist plus an assistant, Instagram- and TikTok-led; the finished face is the product. The site's job:
  a date request with the wedding date, ceremony time, getting-ready postcode, who needs hair and who needs makeup.
- Demo artist **Isolde** (fictional; no UK hair or makeup business found under the name; Companies House has an
  unrelated "Isolde Ltd", checked 15 Nov 2026). Three one-screen directions in sitefloor-internal
  `docs/trades/bridal-beauty/design/directions.md`.
- Customer questions: [`questions.md`](questions.md).
- **Built:** the `bridalbeauty` kit (12 features), the `cover` look and the Isolde demo (Signature). The cover's name
  sits **above her head by default** for every client, in its own band, so any portrait works. **Behind her head** is a
  setup option only when the client's cover photo has clear room above her head: set `hero.cutout` to the same photo
  with only her head and hair kept (WebP with transparency, same size).
- **Intake checklist (cover):** the artist's own finished bride, portrait, at least 1600 × 1920, a plain background;
  ask whether there's clear headroom above her (for the name behind her head); where her face sits, for `hero.focus`
  on a wide screen and a phone; the look in a few words for "On the cover". Then: packages with minutes in the chair,
  party prices, the earliest start and early-start fee, a second artist's fee if she has one, travel districts and fees,
  the trial's price, length and window, and a published Google Sheet for the diary (date, status, updated_at).
- **Morning sums never print a start she couldn't make:** when even two chairs would start before the second artist's
  earliest (or 5am with no second artist), the cover, the party and the morning page say "ask me" instead of a time.

### Features by plan (approved codes HMUA-1 to HMUA-7)
- **Starter** (home + Plan your visit): HMUA-1 packages (bride hair and makeup, either alone, trial, party per person,
  from prices, what's included); HMUA-2 date check (open / a few left / taken from the artist's Sheet, "ask about this
  date" on WhatsApp with the date in it; never "booked"). **Easy extra:** "before I arrive" card (clean dry skin, a
  table by a window, a button-front top, the dress and veil to hand), printable and sent on WhatsApp.
- **Plus** (up to 5 pages): HMUA-3 trial request (date window from the wedding date, where, who's coming, reference
  photos by WhatsApp); HMUA-4 look library (the artist's own work by finish, hair up/half/down, minutes); HMUA-5 travel
  by postcode district (free area, then the artist's own fee; trial and wedding morning separately).
  **Easy extra:** "what time do we start?": ceremony time and how many in the chair give one line ("we start at
  7:05"), with the artist's early-start fee named when it applies. The full morning stays Signature.
- **Signature** (showpieces, Signature only):
  1. HMUA-6 **wedding morning, worked back** (`bridalbeauty-morning`): ceremony time, photographer arrival, dress time
     and each person (hair, makeup or both, child or adult) give everyone's chair time, the start time, buffer, when a
     second artist is needed, and the early-start fee; each person's slot as .ics; sent to the group on WhatsApp.
     Uses the artist's own minutes per service; never "confirmed".
  2. **party quote** (`bridalbeauty-party`): bride, bridesmaids, mothers, flower girls, hair or makeup or both, party
     trials, travel from the postcode, early start, extra artist; a from total as a WhatsApp message. Shares the
     morning's maths, so the quote and the timing never disagree.
  3. HMUA-7 **skin prep, counted down** (`bridalbeauty-skin`): wedding date gives dated milestones in the artist's own
     words (trial window, last new product, brows, the week before, the night before, the morning); .ics for each.
     Clinical treatments only as "ask your clinician"; no medical advice.
- Photos checked before proposing (15 Nov 2026, Pexels, free licence): whole single shoots of finished brides exist:
  a bride from the makeup chair to the aisle in a garden pavilion (Alexander Mass, 37710473–37710812), a full Asian
  bridal glam studio set (SKG Photography, 29370682–29370690), a bride with her artist at work in a quiet room
  (Alexander Mass, 35538636–35538649), and spares for party and trial pages. None of the showpieces needs a photo;
  photos dress them.
- **Client-only:** real brides' galleries (consent recorded) and any trial-to-wedding pair of the same bride.

### Alternative showpieces (alongside or instead)
- **Describe your look:** skin finish, eyes, lashes, lip, hair up/half/down, veil or dupatta; a look card sent on
  WhatsApp and printed for the trial. No AI, no face upload.
- **Asian bridal across the days:** mehndi, nikah, baraat, walima or reception looks, each with its own trial and
  morning; dupatta and jewellery setting time added; hijab styling as its own service.
- **Stay for the day:** touch-ups until the speeches or a restyle for the evening, priced by the artist's hour from the
  ceremony time.
- **Humidity on the day:** within 14 days of the wedding, Open-Meteo humidity for the venue suggests hold and finish;
  hidden beyond 14 days or when the data is stale.
- **Destination quote:** travel days, flights and accommodation as named lines in a WhatsApp quote.
- **Hen and occasion glam slots:** spaces left from the Sheet (shared live board), with a deposit link.

### Pages (Signature 18; ★ = Plus five)
1★ Home · 2★ Bridal packages · 3★ Portfolio (look library) · 4★ Check your date · 5★ Trials · 6 Bridal party and
quote · 7 Asian bridal · 8 Elopements and small weddings · 9 Editorial and events · 10 Skin prep · 11 Destination
weddings · 12 The wedding morning · 13 About the artist · 14 Journal · 15 Travel and areas · 16 Hair from behind
(updos, half-up, veils, hijab) · 17 Booking terms · 18 Gift a trial (voucher). Plan your visit, privacy and 404 free.

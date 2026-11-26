# Event designers and producers: playbook

What to build for this trade (kit `events`). The ground rules and the steps for a new kit: [`docs/TRADE-PLAYBOOK.md`](../../TRADE-PLAYBOOK.md).

## Event design and production (new `events` kit) — built 18 Nov 2026
- Customer: a couple planning a wedding a year out, or a company's events lead planning a dinner or launch. The site's
  job: show the room on the night, answer "are you free on our date?" at once, and turn interest into a brief with
  the occasion, date and number already in it.
- Demo brand **Maudry** (fictional; no UK events business uses it), London, look **The doors** (`doors`): a warm dark
  ground, Eczar, one colour for every heading, the room at night as the first screen. Design rounds:
  `sitefloor-internal/docs/trades/events/design/` (branch `design/events`).
- **Starter:** `events-rooms` (rooms dressed, by occasion and number), `events-dates` (next free date and "Is your
  date free?" from the client's Google Sheet: held, booked or free; fails closed when the sheet is stale).
- **Plus:** `events-portfolio` (every room, filtered by occasion and guests, "rooms for your number"),
  `events-occasions` (a page per occasion), `events-brief` (the brief on WhatsApp or email), `events-key-dates`
  (worked back from the day, .ics), `events-journal`.
- **Signature:** `events-visuals` (see your room before the day: one set of design visuals, three views, always
  labelled "A design visual"), `events-lay-table` (three dressings from one camera), `events-room-plan` (the room
  drawn for the number: long, round or standing; a planning guide), `events-proposal` (a private page by code from
  the client's sheet; no names stored), `events-run`, `events-cases`, `events-venues`.
- **Alternatives (not built):** the room at three times of the night from one camera (arrival, dinner, dancing); a
  guest-facing page for the day (timings, dress code, the map) opened by the same code; the floor plan exported as a
  PDF for the venue; a lighting switch on the visuals (candles only, or with the uplighters).
- Honesty: never invent prices, venues as partners, awards or past clients; venue names and "partner" only from the
  client; design visuals are renders for a proposal and never shown as past events; the room plan is a guide, not a
  venue's licensed capacity.

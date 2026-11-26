# Garage and parking rentals: playbook

What to build for this trade (no kit yet). The ground rules and the steps for a new kit: [`docs/TRADE-PLAYBOOK.md`](../../TRADE-PLAYBOOK.md).

## Car parking, garages and secure car storage (new `garage` kit) — round 1, design only, 16 Nov 2026
**Status: features and pages approved by the owner (16 Nov 2026); design round 2 awaiting the owner.** Nothing is built until the owner approves one screen and
the showpieces. References (docs/VISION.md): Kahn, London Car Vault. Direction: a members-only garage feel, without
being exclusive: a beautifully kept private car vault, secure, calm and precise, for ordinary people's cars as well as
special ones. Customer questions: [`questions.md`](questions.md).

Note: VISION.md already lists PARK-1 to PARK-9 and 15 pages (approved 29 Oct). This plan keeps those codes as they are
and proposes PARK-10 to PARK-14 and a revised page list on top. The owner approves or trims the lot.

### Features by plan (proposed)
Every site also gets Plan your visit, open now, WhatsApp, reviews and the Instagram feed.

| Code | Feature | Plan | Runs on (£0) |
|---|---|---|---|
| PARK-1 | Spaces free and prices, with "updated 18:40" | S | client's Google Sheet (bay, type, size, price, free from) |
| PARK-2 | Security and access facts (gate, CCTV, lighting, hours, covered or open) | S | site.json, only as the client states |
| PARK-12 | **Move-in steps to your calendar**: start date, fob collection, tell your insurer the address, first payment, the last day to give notice | S (the easy one) | calendar file made in the browser |
| PARK-3 | The yard map: every bay numbered, free / reserved / let | P | the same Sheet |
| PARK-4 | Will it fit? one bay against your car (enter mm or pick a size) | P | bay sizes in the Sheet; car sizes typed in or from a short list with its source |
| PARK-5 | Waiting list | P | Google Form |
| PARK-11 | **Arrive at night**: the access guide, gate to bay, step by step, with the client's own photos | P (text and photos) / Sig (the full guide, saved to the phone) | site.json and photos |
| PARK-10 | **Pick your car, see your bays**: choose your car, and the yard plan lights only the bays it fits that are free now, with spare centimetres; tap one to reserve on WhatsApp or pay the deposit | Sig | the Sheet, WhatsApp, the client's Stripe Payment Link |
| PARK-6 | Members' page by code (renewal date, notices, payment link; never a gate code) | Sig | Sheet |
| PARK-7 | Add-ons (EV charging, cover, battery conditioner, valet, delivery) | Sig | site.json, client's prices |
| PARK-8 | Car care log by code (battery checked, tyres turned, started) | Sig | Sheet |
| PARK-13 | Laying-up planner: away from/to, the care visits and reminders, SORN and insurance links | P (alternative) | calendar file; gov.uk links |
| PARK-9 | The yard in 3D, labelled an illustration; tap a free bay | Sig (later add-on) | three.js on tap, the same Sheet |
| PARK-14 | Business and fleet enquiry (number of vehicles, weekday or 24/7, invoice details) | P | WhatsApp or Form |

### Pages: Signature, up to 18 (proposed)
★ = suggested Plus five.
1★ Home · 2★ Spaces and prices · 3★ Will it fit? · 4★ Security and access · 5★ Visit and viewing · 6 The yard (map) ·
7 Prices and terms · 8 Arrive at night (access guide) · 9 Moving in · 10 Waiting list · 11 EV charging ·
12 Long-term storage and laying up · 13 Classic and special cars · 14 Vans, motorbikes and trade · 15 Business and fleet ·
16 Members' page (by code) · 17 The yard in 3D (only with PARK-9) · 18 Journal (laying up a car for winter, battery care
in storage, choosing a space by headroom).
Every page has a job from questions.md. Insurance, tax and SORN facts only as the client states them or linked to
gov.uk with the date checked.

### Showpieces: for discussion, not decided
| Candidate | What it does | Customer question | Tier | How it runs at £0 | Effort | Honesty risks and how it fails closed | Why a visitor shows a friend |
|---|---|---|---|---|---|---|---|
| **PARK-10 Pick your car, see your bays** (own idea) | Choose your car (or type its size); the plan lights the bays it fits that are free now, each with its spare centimetres; tap to reserve | 2, 3, 5, 21 | Sig | Sheet: bay, width, length, headroom, door width, type, price, status, updated | medium | Car sizes are typed in or picked from a short list that names its source and says "mirrors folded"; a bay with a missing measurement shows "ask us", never "fits"; data older than 3 days greys the plan out and says "ask for today's spaces" | "It showed me exactly which bays take my Model Y, and how much room I'd have" |
| **PARK-4 Will it fit?** | One bay drawn side-on and from above, your car on top, to scale | 3, 21 | P | bay sizes from the Sheet | small | Same as above: missing size, no verdict; "tight" under 20 cm spare is said plainly | "Look, the roof box clears by 6 cm" |
| **PARK-3 Live yard map** | Numbered plan, free / reserved / let, "updated 18:40" | 2, 5 | P | Sheet | medium | Never invents a free bay: stale data greys everything out; reserved is never shown as free | Useful, not shareable: a tool, not the show |
| **PARK-11 Arrive at night** | Gate, fob, lights, ramp, bay and leaving, step by step with the client's own photos; saved to the phone | 14, 15, 16, 17 | Sig (P gets the text) | site.json and photos | small to medium | Only the client's own photos of their own site; never shows a gate code; out-of-hours number only as given | "This is exactly what it's like getting in at 11pm" |
| **PARK-9 The yard in 3D** | A 3D model of the yard, labelled an illustration; tap a free bay for size and price | 2, 5, 8 | Sig (add-on) | three.js on tap, the Sheet | large | Labelled "illustration, not to survey"; bays come from the Sheet only; no WebGL or reduced motion shows the plan | The obvious wow, but heavy for what it sells |
| **PARK-12 Move-in steps to calendar** | Pick a start date; get the fob day, insurer reminder, first payment and the last day to give notice as calendar events | 6, 7, 24 | S | calendar file in the browser | small | Dates come from the client's terms; if a term is missing, that event is left out, never guessed | Quietly useful; nobody else does the notice reminder |
| **PARK-13 Laying-up planner** (own idea) | Away from/to: the care visits you're paying for, battery and tyre reminders, SORN and insurance links | 25, 28, 29 | Plus (alternative) | calendar file; gov.uk links | small | Links to gov.uk for SORN, dated; care visits only as the client sells them | "They'll start the car every fortnight while I'm in Dubai" |

**Recommended:**
- **Signature: PARK-10 Pick your car, see your bays** (the one no competitor has: it answers the two questions that
  decide the sale, "is one free" and "will mine fit", in one move, and ends in a reservation) and **PARK-11 Arrive at
  night** (security and access are the next worry; real photos of the real way in do more than any "CCTV 24/7" line).
  Third, if the owner wants a visible wow on top: PARK-9 as a later paid add-on, not the hero.
- **Starter (easy): PARK-12 Move-in steps to your calendar**: small to build, honest, and the notice-date reminder is
  a kindness customers remember.
- **Alternatives:** PARK-13 laying-up planner (instead of PARK-11 for a storage-led client), PARK-4 on its own for Plus,
  PARK-9 3D.
- **Client-only:** none of the showpieces need matched photos; PARK-11 needs the client's own photos of their way in
  (the demo uses free stock and says so in its credits).

### Owner decisions (16 Nov 2026)
Features PARK-10 to PARK-14 and the 18 pages: approved as listed. Signature: PARK-10 Pick your car, see your bays, and
PARK-11 Arrive at night. Starter: PARK-12 move-in calendar. PARK-13 laying-up planner: a Plus alternative. PARK-9 3D:
paid add-on only. Round 1's lit-bay photo idea is kept only as a later second look for open yards, restyled.

### Design round 2: three directions (one screen each, 1440 and 390)
Round 1 rejected (no beautiful car, AI cues). Each direction is one art-directed image, shown huge, plus care and
service, and PARK-10 in the direction's own form. Saved in SiteFloor1/sitefloor-internal on `design/garage`.
- **D, Elsden (the gallery):** a family saloon lit like sculpture; a gallery wall label as the hero's words; the plan
  as an exhibition floor plan. Cardo and Radio Canada.
- **E, Coldwell (the vault):** a 1970s coupé in a warm old vault; a book-like paper column holds the name and menu;
  the bays are drawn as brick arches. Besley and Chivo.
- **F, Rennick (the bright one):** a spotless white family car in daylight; the header asks "I drive…" and finds a
  space. Merriweather and Atkinson Hyperlegible Next.

### Design round 3: Elsden only
Owner chose Elsden (Cardo, Radio Canada, the gallery label, the floor-plan picker). Fixes: the hero sells the place, not
a car: a real storage hall shown edge to edge, with its gallery label on the wall beneath it (not a box over the photo);
care photos that look like the same hall, one grade; no readable makers' badges; the plan drawn like an architect's
drawing (poché walls, column grid, wheel stops, cars drawn from above, scale bar, north point). Lounge: client photos.

### Owner decisions, round 4 (16 Nov 2026)
New features (approved 16 Nov 2026, round 5):

| Code | Feature | Plan | How (free) |
|---|---|---|---|
| PARK-15 | Charging on the plan: which bays, speed (kW), "plug in by 10pm, charged by 7am" | P | the client's Sheet (bay, kW, cut-off) |
| PARK-16 | Security on the plan: camera positions and coverage, fob hours, gate, alarm. Only what the client confirms; never a live feed | P | the client's Sheet; drawn on the plan |
| PARK-17 | Letter for your insurer (PDF download), only if the client supplies one | P | a file in the site's `img/` or `docs/` |
| PARK-18 | "Your car this month": a WhatsApp card per car from the client's own monthly checks (battery, tyres, cover, moved) | Sig | the client's Sheet + a pre-filled WhatsApp message |
| PARK-9 (round 5) | The hall from above: one photoreal aerial render of the client's hall (Blender, Cycles), drawn from their measurements. Pick your car and a top-down render of a car that size drives in through the gate and turns into the bay that fits; the bay lights. Charging and cameras/gate are quiet layers, one tap each. No 3D engine in the page: one image, one car image, an SVG layer (~5 KB of script); reduced motion sees the car parked | Sig for the demo; **Bespoke add-on for clients** | rendered once per client from their plan; bays, chargers and cameras from the client's Sheet |

Signature = the hall from above (on the demo) with PARK-10 Pick your car, PARK-11 Arrive at night and PARK-18.
Client path (approved): the drawn top-down plan from the client's measurements is Signature standard; the rendered
aerial hall is a Bespoke add-on (each hall is modelled and rendered once). The three.js hall of round 4 is retired.
Running cost stays £0.

Round 6 (17 Nov 2026): the hall from above is the approved direction. PARK-11 Arrive at night (Signature) gains the
same aerial view after dark, with the route from the gate to the visitor's bay lit (the same render, regraded for
night; the route drawn in the SVG layer, so it follows the picker). One caption on every render: "Rendered from our
plan. Not a photograph." The drive-in plays once when the hall first comes into view; picking a car replays it;
reduced motion sees the car parked.


### Built (17 Nov 2026, `trade/garage`): the `garage` kit, the Elsden look and demo
| Feature id | Code | Plan | What it reads |
|---|---|---|---|
| `garage-spaces` | PARK-1 | S | `hall.rows[].bays[]` (`free`, `price`, `charger`) |
| `garage-access` | PARK-2 | S | `access.facts` |
| `garage-kept` | (care) | S | `kept.items` (the client's photographs) |
| `garage-move-in` | PARK-12 | S | `moveIn.steps`, a calendar file made in the browser |
| `garage-charging` | PARK-15 | P | bays' `charger`, `charging` |
| `garage-security` | PARK-16 | P | `security` (`recorded`, `facts`, `cameras`) |
| `garage-insurer` | PARK-17 | P, client sites only | `insurerLetter` (the client's PDF) |
| `garage-night` | PARK-11 | P (page); with the aerial hall, the night view and lit route | `night.steps`, `aerial.night` |
| `garage-laying-up` | PARK-13 | P (page) | `layingUp`, GOV.UK links only |
| `garage-fleet` | PARK-14 | P (page) | `companies` |
| `garage-pick` | PARK-10 | Sig (the drawn plan is Signature standard) | `hall` |
| `garage-care-card` | PARK-18 | Sig | `careCard` |
| `garage-aerial` | PARK-9 | Sig on the demo; a Bespoke add-on for clients | `aerial` (renders made once per client) |

Not built in this kit yet: PARK-3 and PARK-4 as separate features (the drawn plan does both on Signature), PARK-5
waiting list as a Form (the waiting list is a WhatsApp message for now), PARK-6 members' page, PARK-7 add-ons,
PARK-8 care log by code.
The night view is a true night pass of the same scene (the hall dark, a warm pool on each car), not the day render
dimmed; the route is drawn over it and follows the picker.

### Live free bays and the covered hall (18 Nov 2026)
- PARK-1 is live: `liveBays` reads the client's published Google Sheet (bay, status, updated_at) every five minutes
  and shows "Updated 08:40"; the picker, the drawn plan, the hall from above, the night route and the phone bar all
  follow it. It fails closed: an unknown bay, an unreadable row or a list older than a day leaves the client's own
  list: the table hides, counts read "Ask us first", and one line asks the customer to check before coming. The demo simulates its own list.
- Open cars are gone from the hall from above: no free model reached the realism a client's hall needs, so every bay
  is rendered with a car under a fitted cover, and again empty; the site lays the empty bay over each one that's free
  today, so the picture always matches the list. Picking a car now sends a line of light from the gate to the bay.

### Running cost
£0 per client: the client's Sheet and Form, WhatsApp, the client's Stripe Payment Links, calendar files made in the
browser. The aerial hall adds no running cost: one rendered image per screen size and a car image (see speed.md).

### Coming free (26 Nov 2026)
An optional `free_from` column in the same sheet: the list names let bays coming back, and the picker offers the first
returning bay that fits a car no free bay takes, with the waiting list. Starter, with the live list.

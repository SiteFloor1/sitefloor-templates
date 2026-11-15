# Personal trainers and small gyms: playbook

What to build for this trade: an independent personal trainer or a small private studio (kit `trainer`, branch
`trade/trainer`). Not a gym chain and not a supplement shop. The ground rules and the steps for a new kit:
[`docs/TRADE-PLAYBOOK.md`](../../TRADE-PLAYBOOK.md). Customer questions: [`questions.md`](questions.md).

## What sells a trainer, and what loses the client
A trainer sells time, attention and a plan. People hesitate over four things: the price of a block, where they'll
train, whether they'll be out of their depth, and whether the trainer is properly qualified. The site answers those
before the WhatsApp message, so the first message is "Can I have Tuesday 7am?" rather than "How much?".
It fails if it promises results, shows borrowed transformations, or claims a qualification the trainer doesn't hold.

## Honesty rules for this kit (checked in `config.js`, not left to taste)
- Qualifications: only what the trainer holds, each with its awarding body and year. A register link (the CIMSPA
  directory, or another public register) appears only when the client gives their own entry's URL; the site never
  says "registered" without it. Insurance and first aid: stated only if the client says so.
- No weight-loss figures, "drop a dress size", timelines of kilos, or guaranteed results anywhere. The kit's copy
  checker refuses the common phrasings on client sites.
- Results stories and before/after photos are **client-only**: the client's own clients, written consent recorded in
  `site.json`, their own words. Demos never show them (`clientOnly` in `kit.js`).
- Park sessions: the licence line (Royal Parks, or the borough's) shows only when the client says they hold it.
- Medical: "tell me about injuries and conditions; I may ask for your GP's go-ahead". Never "fixes back pain".

## Features by plan
Every site also gets Plan your visit, open now, WhatsApp, reviews and the Instagram feed. Codes are the owner's (PT-n).

| Plan | Features | Notes |
|---|---|---|
| **Starter** | `trainer-credentials` (PT-1: services, qualifications with awarding body and year, register link) · `trainer-prices` (single, 5, 10, 20 blocks with the per-session price worked out; "use within"; Stripe links if given) · `trainer-where` (studio, gym, home, park, online: only the places they work) · `trainer-slots` (PT-2: free slots from the trainer's Sheet; hides when stale) · `questions` | **Easy extra:** "Bring a friend": a duo toggle on the price list that re-prices per person from the trainer's own duo price |
| **Plus** | Starter + `trainer-goal` (PT-3: goal, experience, days a week, any injury → the block that fits and a sample week, sent on WhatsApp) · `trainer-stories` (PT-4, client-only) · `trainer-coverage` (PT-5: postcode districts the trainer covers, for home and park) · `team` · `page-links` | **Easy extras:** `trainer-checklist` (PT-8 moved down: what to wear, eat, bring; the night before; 24-hour cancellation in the trainer's words) and "Add this session to my calendar" on a confirmed slot (.ics) |
| **Signature** | Plus + the showpieces below · PT-6 the block as a calendar (inside the block planner) · PT-7 corporate and family packages (team blocks, family sessions, a request on WhatsApp) · up to 20 pages | Next-level work stays here |

## Showpieces (Signature): photo check done 15 Nov 2026
1. **The block planner** (`trainer-block`). Choose 5, 10 or 20 sessions, how many a week and which days, and a start
   date: the sessions lay themselves out on a calendar strip with dates, the finish date, the "use within" deadline,
   price per session and total. Send it on WhatsApp ("10 sessions, Tue and Thu 7am, from 1 Dec, £550") or add all
   sessions to a calendar (.ics). Bank holidays from gov.uk's published list are marked, not booked. No photos needed.
2. **The first hour** (`trainer-first-hour`). What happens in the first session, minute by minute: the talk and the
   health questionnaire, a movement check, a first light session, the plan. A 60-minute tape with four stops; each stop
   shows a photograph of that moment. **Photos exist:** one free Pexels shoot (Vitaly Gariev, about 50 frames of one
   trainer with clients in a daylight gym: clipboard consultation, squat and bar coaching, kettlebells, core work,
   reviewing the plan). One shoot, one trainer, so the four moments read as one morning. A client swaps in their own.
3. **The week board** (`trainer-week`, the showpiece form of PT-2). The trainer's working week as a board: only their
   hours, free slots lit, today first on a phone. Tap a slot: "Can I have Tue 06:30?" on WhatsApp. Reads the same Sheet
   as `trainer-slots`; fails closed (stale or missing data hides the board and shows "Message me for times").

**Alternative showpieces (pitch; alongside or instead):**
- **Progress card by code** (Signature). The trainer's Sheet holds each client's main lifts or run times; the client
  opens their own card by a private code and sees their own line climb. No body weight, no photos. Demo shows a
  simulated card; client data never leaves their Sheet.
- **Homework timer** (Signature). The trainer writes a short circuit for days between sessions (moves, seconds on,
  seconds off, rounds) in the Sheet; the site turns it into a full-screen phone timer with a beep and a screen
  wake lock. Free, in the browser, nothing stored.
- **Where we train** (Plus). One card per place with a real photo, what's there (kit, changing room, parking), the
  nearest station, and the licence line for parks. Free photos of parks and studios exist; the client's own replace them.
- **Race or event countdown** (Signature). For a client training towards a 10k, a Hyrox or a wedding: weeks left,
  the phase they're in (build, peak, taper), a calendar file of the phases. No outcome promised.
- **Kit-at-home check** (Plus). Tick what you have (mat, bands, dumbbells, a step) and see what the trainer brings.

Considered and left out: transformation sliders on demos (needs real, consented pairs: client-only), calorie or BMI
calculators (medical-adjacent and outside most trainers' qualifications), anything that sells supplements.

## Pages (Signature: 18, a collection counts as one)
★ = the suggested Plus five.

| # | Page | Job |
|---|---|---|
| 1★ | Home | Who, where, price from, next free slot, the showpiece |
| 2★ | Start here | The first hour, the questionnaire, what to bring (`trainer-first-hour`, `trainer-checklist`) |
| 3★ | Prices and blocks | Blocks, duo, online, the block planner |
| 4★ | Free times | The week board |
| 5★ | Programmes (collection) | Strength · Fitness and body composition (no figures promised) · Pre and postnatal · Back to training after injury (alongside the client's physio, never treatment) · Older adults · Event prep · each only if the trainer is qualified |
| 6 | Where we train | Studio, gym, home, park, online, with licence and coverage |
| 7 | At home and online | What online coaching includes, check-ins, kit needed |
| 8 | The trainer (or coaches) | Qualifications with awarding body and year, register link, CPD |
| 9 | Results | Client-only stories with consent; hidden on demos |
| 10 | Corporate and teams | Team blocks, lunchtime sessions, invoicing note |
| 11 | Families and duos | Train with a partner, parent and teenager (16+ with consent), split pricing |
| 12 | Nutrition approach | Only within the trainer's qualification; refers on otherwise |
| 13 | The studio | Photos, kit, changing, parking, step-free |
| 14 | Plan your block | The block planner on its own page |
| 15 | Gift sessions | A gift block by Stripe link with a printable card |
| 16 | Policies | Cancellation, lateness, block expiry, health questionnaire, in the trainer's words |
| 17 | Journal | The trainer's own articles: starting strength training, training around a busy week, recovery basics |
| 18 | Questions | Every question from `questions.md` the trainer answers |

Plus Plan your visit, privacy and 404, free on every plan.

## How the design differs
Three directions, one static screen each, in `sitefloor-internal` (`docs/trades/personal-trainer/design/`): A Tally
(the block planner is the first screen), B Lark (the week board at first light), C Lap (the first hour on a stopwatch
tape). Demo trainer: **Marrick**, a one-trainer studio in Bermondsey with park sessions (fictional; no UK fitness
business of that name found at Companies House or online, 15 Nov 2026).

# Holiday-let and Airbnb management: plan

## Holiday-let management (kit `stay`, proposed): plan, 26 Nov 2026 (design round 1: awaiting the owner)

**Who it's for.** UK companies that run holiday homes and Airbnb listings for their owners: listing, pricing, guests,
cleaning and linen, upkeep, payouts. Two audiences: **owners first** (the paying customer: "what will it earn, what do
you do, what does it cost?") and **guests** (booking a stay). Questions: [questions.md](questions.md).

**References (VISION):** Airbnb, Maison Freya, Malo, GuestReady.

**Note for the owner.** VISION already holds a `LET` feature row (what we manage, fees, areas · revenue review request ·
onboarding steps · portfolio · guest guidebook by code) and a 13-page `LET` page row. They read as this trade. The brief
for this round says nothing is approved yet, so the features below are proposed under new `HOL` codes and say which
`LET` item each one covers. Once the owner approves, VISION gets one row.

### Proposed features (all awaiting the owner)

| Code | Feature | Plan | Covers | Runs on (£0) |
|---|---|---|---|---|
| HOL-1 | **What we do and what it costs.** Who does what (company / owner), the fee as a percentage and in pounds on an example, VAT included in the headline, every other charge listed once (set-up, linen, exit) | Starter | LET-1 | `site.json` |
| HOL-2 | **Rules where your home is** (new). Pick England, London, Scotland or Wales: the rules that apply, each linked to the official page with the date it was checked (London's 90-night limit, Scotland's licence, England's planned register), plus the safety basics (gas, electrics, fire, CO alarms) | Starter | new | a reviewed list in the kit, rechecked by date; stale entries show "check the official page" |
| HOL-3 | **Ask for a revenue review.** A short form (postcode district, bedrooms, sleeps, how it's let now) sent to the client's Google Form or as a pre-filled WhatsApp | Plus | LET-2 | Google Form / WhatsApp |
| HOL-4 | **How we start.** Onboarding steps with the client's own timings: visit, contract, photos and linen, safety checks, first listing | Plus | LET-3 | `site.json` |
| HOL-5 | **Between guests.** The changeover as a day of times; each step has a photograph and one line on how it's done; owners see what they get (inspection photos) | Plus | new | `site.json` + client photos |
| HOL-6 | **What could it earn?** An estimate from the client's own published figures only: average night and nights booked last year by bedrooms (optionally by area), how many homes it's based on, the lowest and highest owner share, the fee in pounds, owner stays taken off. Basis, date and "not a promise" on the same screen. London homes stop at 90 nights unless the owner says it has planning permission | Signature | new (VISION showpiece) | a Google Sheet the client fills once a year; no figures → the feature hides and offers HOL-3 |
| HOL-7 | **The homes we look after.** Real photographs, sleeps, bedrooms, the guest total for a sample stay with every mandatory fee (CMA), and the booking link; free/busy only from the listing's own calendar link at each daily build, hidden if older than 36 hours | Signature | LET-4 | Airbnb/Vrbo iCal export links, daily rebuild |
| HOL-8 | **An owner's month.** A sample monthly statement (nights, what guests paid, the fee in pounds, repairs, paid out), clearly labelled as a sample, from the client's own template | Plus | new | `site.json` |
| HOL-9 | **Guest guidebook by code.** A private, unlisted page per home (Wi-Fi, bins, heating, walks, nearest shop and pharmacy) opened with a short code. Not security: door codes never go in it | Signature | LET-5 | `site.json`, noindex pages |

**Recommended split.** Starter: HOL-1 + HOL-2 (the rules card is easy and genuinely useful to owners). Plus: + HOL-3,
HOL-4, HOL-5, HOL-8. Signature: + HOL-6, HOL-7, HOL-9. Next-level showpieces (the estimate, live free/busy) stay
Signature only.

### Pages (10–14)

| # | Page | Status |
|---|---|---|
| 1 | Home (owners first, a "Stay with us" door for guests) | in VISION `LET` row |
| 2 | For owners | in VISION `LET` row |
| 3 | What we manage | in VISION `LET` row |
| 4 | Fees | in VISION `LET` row |
| 5 | Revenue review | in VISION `LET` row |
| 6 | The homes | in VISION `LET` row |
| 7 | Areas | in VISION `LET` row |
| 8 | Guest guidebooks | in VISION `LET` row |
| 9 | Cleaning and linen | in VISION `LET` row |
| 10 | Interior styling | in VISION `LET` row |
| 11 | Onboarding | in VISION `LET` row |
| 12 | Owner stories (real reviews only, or the page is left off) | in VISION `LET` row |
| 13 | Journal (preparing a home for guests, short-let rules) | in VISION `LET` row |
| 14 | Rules where your home is (HOL-2 in full) | proposed, awaiting the owner |

Starter: pages 1 and the Plan-your-visit equivalent (Fees). Plus: up to 5 (1, 2, 4, 5, 6). Signature: all.

### Rules the kit must follow
- Never promise earnings. Every figure is the client's estimate with its basis and date; the demo's figures are labelled sample.
- Guest prices are the total for a stated stay including every mandatory fee (CMA). Owner fees show VAT included.
- Licensing and safety rules link to GOV.UK, legislation.gov.uk, gov.scot or gov.wales with the date checked; the kit never paraphrases a rule as advice.
- No reviews unless real, copied with name and date.

### Design round 1
Three directions for the fictional demo **Tressa** (checked on the Companies House register 26 Nov 2026: no active
company uses the name). Fonts are claimed in [fonts.md](fonts.md). The screens and comparison are in sitefloor-internal,
branch `design/holiday-lets`.

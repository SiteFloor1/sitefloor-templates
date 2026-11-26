# Holiday-let and Airbnb management: plan

## Holiday-let management (kit `hol`): plan, 26 Nov 2026 (direction A chosen; round 2: the revised first screen)

**Who it's for.** UK companies that run holiday homes and Airbnb listings for their owners: listing, pricing, guests,
cleaning and linen, upkeep, payouts. Two audiences: **owners first** (the paying customer: "what will it earn, what do
you do, what does it cost?") and **guests** (booking a stay). Questions: [questions.md](questions.md).

**References (VISION):** Frank Porter (owner-first, fees shown upfront), The Plum Guide (every home tested before it is listed), Le Collectionist (villas with concierge), onefinestay (hotel-grade service in private homes). True luxury: art-directed interiors and views, concierge-level calm, owners treated as private clients.

### Features (approved 26 Nov 2026, VISION row `HOL`)

| Code | Feature | Plan | Runs on (£0) |
|---|---|---|---|
| HOL-1 | **What we do and what it costs.** Who does what (company / owner), the fee as a percentage and in pounds on an example, VAT included in the headline, every other charge listed once (set-up, linen, exit) | Starter | `site.json` |
| HOL-2 | **Rules where your home is** (new). Pick England, London, Scotland or Wales: the rules that apply, each linked to the official page with the date it was checked (London's 90-night limit, Scotland's licence, England's planned register), plus the safety basics (gas, electrics, fire, CO alarms) | Starter | a reviewed list in the kit, rechecked by date; stale entries show "check the official page" |
| HOL-3 | **Ask for a revenue review.** A short form (postcode district, bedrooms, sleeps, how it's let now) sent to the client's Google Form or as a pre-filled WhatsApp | Plus | Google Form / WhatsApp |
| HOL-4 | **How we start.** Onboarding steps with the client's own timings: visit, contract, photos and linen, safety checks, first listing | Plus | `site.json` |
| HOL-5 | **Between guests.** The changeover as a day of times; each step has a photograph and one line on how it's done; owners see what they get (inspection photos) | Plus | `site.json` + client photos |
| HOL-6 | **What could it earn?** An estimate from the client's own published figures only: average night and nights booked last year by bedrooms (optionally by area), how many homes it's based on, the lowest and highest owner share, the fee in pounds, owner stays taken off. Basis, date and "not a promise" on the same screen. London homes stop at 90 nights unless the owner says it has planning permission | Signature | a Google Sheet the client fills once a year; no figures → the feature hides and offers HOL-3 |
| HOL-7 | **The homes we look after.** Real photographs, sleeps, bedrooms, the guest total for a sample stay with every mandatory fee (CMA), and the booking link; free/busy only from the listing's own calendar link at each daily build, hidden if older than 36 hours | Signature | Airbnb/Vrbo iCal export links, daily rebuild |
| HOL-8 | **An owner's month.** A sample monthly statement (nights, what guests paid, the fee in pounds, repairs, paid out), clearly labelled as a sample, from the client's own template | Plus | `site.json` |
| HOL-9 | **Guest guidebook by code.** A private, unlisted page per home (Wi-Fi, bins, heating, walks, nearest shop and pharmacy) opened with a short code. Not security: door codes never go in it | Signature | `site.json`, noindex pages |

**Split (approved).** Starter: HOL-1 + HOL-2 (the rules card is easy and genuinely useful to owners). Plus: + HOL-3,
HOL-4, HOL-5, HOL-8. Signature: + HOL-6, HOL-7, HOL-9. Next-level showpieces (the estimate, live free/busy) stay
Signature only.

### Pages (10–14)

| # | Page | Status |
|---|---|---|
| 1 | Home (owners first, a "Stay with us" door for guests) | approved |
| 2 | For owners | approved |
| 3 | What we manage | approved |
| 4 | Fees | approved |
| 5 | Revenue review | approved |
| 6 | The homes | approved |
| 7 | Areas | approved |
| 8 | Guest guidebooks | approved |
| 9 | Cleaning and linen | approved |
| 10 | Interior styling | approved |
| 11 | Onboarding | approved |
| 12 | Owner stories (real reviews only, or the page is left off) | approved |
| 13 | Journal (preparing a home for guests, short-let rules) | approved |
| 14 | Rules where your home is (HOL-2 in full) | approved |

Starter: Home (with HOL-1 and HOL-2) and Plan your visit. Plus: the five starred in VISION (Home, For owners, Fees, Revenue review, The homes). Signature: all 14.

### Rules the kit must follow
- Never promise earnings. Every figure is the client's estimate with its basis and date; the demo's figures are labelled sample.
- Guest prices are the total for a stated stay including every mandatory fee (CMA). Owner fees show VAT included.
- Licensing and safety rules link to GOV.UK, legislation.gov.uk, gov.scot or gov.wales with the date checked; the kit never paraphrases a rule as advice.
- No reviews unless real, copied with name and date.

### Design
Demo **Tressa** (fictional; checked on the Companies House register 26 Nov 2026: no active company uses the name), on
the south Cornish coast. Sample fee 20% of what guests pay, VAT included, labelled as a sample.
- Round 1: three directions. The owner chose **A, The estimate**, with the changeover (HOL-5) drawn in A's look and the
  sample statement (HOL-8) on the For owners page, also in A's look.
- Round 2: the estimate stays first, but the figure is part of the composition, not a giant number over the photograph.
- Round 3: the same composition taken to the new references: photographs of views framed by the home, quieter type and controls, owners spoken to as private clients.
Screens and comparison: sitefloor-internal, branch `design/holiday-lets`.

## Built (draft PR, 27 Nov 2026)

Kit `hol` (src/kits/hol), look `arch` (src/looks/arch), demo `sites/demos/holiday-lets` (Tressa, Signature, with the
Starter / Plus / Signature switch), client fixture `tests/fixtures/sites/test-hol-client` (Signature, with owner
stories and the calendar read from a sheet). Feature ids: HOL-1 `hol-fees`, HOL-2 `hol-rules`, HOL-3 `hol-review`,
HOL-4 `hol-start`, HOL-5 `hol-turnover`, HOL-6 `hol-estimate`, HOL-7 `hol-homes` (+ `hol-calendar` for free dates on
Signature), HOL-8 `hol-statement`, HOL-9 `hol-guide`. The 14 pages: home, `owners`, `manage`, `fees`, `review`, `homes`,
`areas`, `guide-<home>` (unlisted), `care`, `styling`, `onboarding`, `stories` (client only), `journal` (+ articles),
`rules`.

Decisions made while building, for the owner to see:
- **The homes is a Plus page** (one of VISION's starred five), with each guest's total and booking link; HOL-7's live free
  dates are Signature (`hol-calendar`), so the approved split stands.
- **Fees and Rules are free pages on every plan** (like the letting kit's fees page): the full cost and the law where the
  home is, before an owner gets in touch. Starter's home page carries a short version of each.
- **No Plan your visit page.** Owners don't visit an office and guests book through the company's links; the office's
  hours and address sit on the fees page.
- **Owner stories are client only.** A demo never invents owner reviews, so the demo leaves that page off.
- **Free dates come from the company's own Google Sheet** (one row per booked stay), which a company can fill by hand or
  from each listing's calendar link; a sheet older than a day and a half shows nothing as free.
- **The guidebook code is not security** and the page says so; the build refuses obvious door codes and passwords.

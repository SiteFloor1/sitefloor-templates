# Facialists and skin clinics: playbook

What to build for this trade (kit `skin`). The ground rules and the steps for a new kit: [`docs/TRADE-PLAYBOOK.md`](../../TRADE-PLAYBOOK.md).

## Independent facialist and skin clinic (new kit `skin`, branch `trade/beauty`) — Stage 1, 15 Nov 2026
**Brief:** a calm, clinical-luxury treatment room run by an independent facialist: facials, peels, microneedling,
LED, consultations and courses. Not a nail bar (that's `nails`), not a medical clinic (that's `smile`'s world).
The site answers which facial, how long, how much, patch test, downtime, how often and what to stop before, in the
clinic's own words, and suggests by concern without ever diagnosing. Demo: **Odile** (fictional; searched 15 Nov 2026:
no UK facialist, skin clinic or beauty company trades as Odile on Companies House or in booking listings; one dormant-
looking ODILE LIMITED of unknown trade exists, so the demo never shows a company number).

### UK rules (checked 15 Nov 2026; on the site, each is the clinic's statement, linked with the date checked)
- **No medical claims.** CAP Code rule 12.1: medicinal claims only for licensed medicines and devices; the ASA keeps
  ruling against beauty marketers that claim to treat conditions such as acne or rosacea (LED mask rulings, 5 Nov 2025).
  The site never says "treats", "cures" or names a condition as something a facial fixes; concerns are worded as how
  skin looks or feels ("feels tight", "looks dull").
- **Cosmetic claims are temporary unless proven.** CAP AdviceOnline (Beauty and cosmetics: general; physiological
  effect; chemical peels): anti-ageing only in temporary terms (rule 12.22.1); "refresh", "revitalise" are the safe
  words; CAP has seen no evidence that chemical peels stimulate collagen. Every efficacy claim needs evidence held
  before publishing (rule 3.7). No "collagen", "lift", "rejuvenate" or "results" claims in demo copy.
- **Before/after photographs** are treated like testimonials (rules 3.47–3.50): genuine, unedited, with signed and dated
  consent from the person shown, and the efficacy they imply must also be substantiated. So the results gallery is
  client-only, never stock, and never two different people shown as one pair.
- **Under-18s.** CAP's cosmetic-interventions guidance: ads for chemical peels, micro-needling, laser and light
  treatments and injectables must not be directed at under-18s. The site's peel and microneedling pages carry the
  clinic's age rule; no feature targets under-18s.
- **Injectables** are prescription-only medicines: out of scope unless the client is, or works with, a named
  prescriber; even then the site may not advertise the medicine (no "Botox" promotion, no before/after of it).
- **Licensing, England (not yet in force).** DHSC's consultation on restricting high-risk procedures (published
  21 Oct 2026, closes 13 Jan 2027) proposes that deep chemical peels (deeper than the dermal-epidermal junction),
  dermal microcoring, ablative and periorbital laser/IPL and cosmetic PRP be done only by doctors, dentists or
  independent prescribing nurses, midwives or pharmacists, in CQC-registered premises, for over-18s. Superficial peels
  and microneedling are not on that list; the wider green/amber licensing scheme (Health and Care Act 2022, s.180) still
  has no start date. The kit refuses "deep peel" as a demo treatment and lets a client mark any treatment "by a
  registered healthcare professional", naming them.
- **London premises.** Most London boroughs license premises offering facials under Part II of the London Local
  Authorities Act 1991 (special treatment licence). The kit has an optional `licence` line (borough and number,
  from the client) for the footer.
- **Scotland.** The Non-Surgical Procedures and Functions of Medical Reviewers (Scotland) Act 2026 (Royal Assent May
  2026) is not yet in force; a Scottish client's site follows its commencement when set.

### Features by plan (the owner's approved codes, `docs/VISION.md`, BEAU)
New kit feature ids start with `skin-`. Every site also gets Plan your visit, open now, WhatsApp, reviews and Instagram.

| Code | Plan | Kit feature | What it does |
|---|---|---|---|
| BEAU-1 | Starter | `skin-menu` | treatments by concern and by time: time, "from" price, downtime, patch test, single or course, in the clinic's words; each with its own small dial of minutes |
| BEAU-2 | Starter (the easy extra) | `skin-patch` | first visit and patch-test policy; enter your appointment date, get "patch test by Sat 21 Nov" with a calendar file |
| BEAU-3 | Plus | `skin-concern` | concern finder: pick what you'd like to change, see the clinic's matching treatments (a list, no dates) |
| BEAU-4 | Plus | shared courses and memberships | the clinic's course and membership prices |
| BEAU-5 | Plus | `skin-rooms` | room tour: the room's photographs with what each thing is for |
| BEAU-6 | Signature | `skin-hour` (the home hero) | ritual builder: the facial drawn as a clock; add rituals (longer massage, LED, scalp) and the clock, time and price redraw, then a WhatsApp summary. Starter and Plus homes show the clock read-only with the clinic's own facials |
| BEAU-7 | Signature | `skin-spaday` | spa day planner that ends in a gift card (the clinic's Payment Link) |
| BEAU-8 | Signature | `skin-rhythm` | treatment rhythm reminders: the course planner (round 1's C) works out every appointment, the patch test and the stop-retinol date, plus aftercare reminders, as calendar files |
| BEAU-9 | Signature | shared vouchers, `skin-voucher` look | experience voucher with a card preview |
| — | Signature page | `skin-note` | the suggestion note (round 1's B): a sentence with choosable words writes a treatment note with dates worked back from an event; "a suggestion, not a diagnosis" |
| — | client-only | `skin-results` | consented before/after of the same person, same light, unedited; no demo turns it on |

**Pages (BEAU, approved):** Home ★ · Treatments by concern ★ · Facials ★ · Brows and lashes ★ · Rituals and spa days ★ ·
Body and massage · Waxing and hair removal · Courses and memberships · The rooms · Bridal beauty timeline (uses
`skin-rhythm`) · Gift experiences · First visit and patch tests · Skin by season · Men's treatments · The team ·
Corporate and group days · Journal. Signature adds the suggestion note and the course planner as pages of their own
(owner, 15 Nov 2026). Demo Odile shows facials first; brows, lashes, body and waxing are on the menu, not the hero.

### Alternative showpieces (alongside or instead)
- **"What to pause" checker:** tick the actives you use; see what the clinic asks you to stop and from which date.
- **Live cancellations:** a Sheet line "tomorrow 11:00 freed up", hidden once the slot passes.
- **Shelf refills:** the clinic's retail range with "running low?" calendar reminders at each product's stated life.
- **Skin diary (client-only):** consented monthly progress photographs in one light for course clients.
- **Ambitious:** the clock as a live day: today's free hours shown as gaps on the dial, from the clinic's Sheet.

### Approved direction: A, The hour (owner, 15 Nov 2026) — round 3
References (`docs/VISION.md`): Taylor Taylor, The Lanesborough Club & Spa, David Mallett; hotel-spa luxury with
Parisian salon elegance. Round 2 (watch-face dial on cream) read like a calm wellness app; round 3 leads with one large
lamp-lit photograph of a treatment in progress (Katherine Hanlon, Unsplash licence) in a thin cream frame, with the
clock set into its lower edge as a brass-rimmed dial. Natural object: aged brass (accent #7A5A22, rims #A8843F,
photo graded toward brass). Emblem: a brass ring with a tick at twelve and a Didone O. Fonts: Imbue + Baskervville
(serif on serif, like a Parisian printed treatment card); Wix Madefor released. Screen:
https://claude.ai/artifact/95iyZJHjEPXJaWWBSdLQ2s; rounds and sources in `sitefloor-internal` (`design/beauty`).
No build until the owner approves this screen.

### Round 1: three design directions (A chosen; B and C become Signature pages)
Screens: https://claude.ai/artifact/Y5FANTQ9LroCp2mA8ZaVGX (source to go in `sitefloor-internal/docs/trades/beauty/screens/`).

| | A · The hour | B · The note | C · The course |
|---|---|---|---|
| First-screen wow | the facial drawn as a clock: six stages round a ring, the centre a photograph of that stage; choose 30, 60 or 90 minutes and the ring redraws | one sentence in very large type with tappable words ("My skin feels tight and looks tired, and I have a wedding in six weeks."); a treatment note types itself beneath | the next eight weeks as giant dates across the page; your course, patch test and stop-retinol line marked on them live |
| Brand world | the round porcelain mask bowl seen from above (emblem: a ring and a dot); vouchers and course cards as small dials | the clinic's treatment note: a narrow slip in a typewriter face; every product label and receipt uses it | a desk calendar: big condensed dates; course cards printed as date strips |
| Ground | porcelain #F5F4F1 | white #FFFFFF | limestone #EEEBE5 |
| Accent object → colour | blue tansy oil → #1F5C8F (soft #D6E2EE) | bladderwrack kelp → #5E5B21 | rose clay → #A3594A |
| Photo grade | warm film grade of one shoot, lifted shadows | neutral, slightly cool still life; no faces in the hero | low warm light; the room and hands, never faces |
| Type | Wix Madefor Display 600/700 large, tight / Wix Madefor Text | Besley (heavy Clarendon, roman and italic) / Fragment Mono | Sofia Sans Extra Condensed 600 for dates and headings / Sofia Sans |
| Header | wordmark beside the bowl emblem; plain nav; Book in a small ring | italic Besley wordmark; nav in mono, normal case | condensed wordmark large; nav right; Book as a date chip |
| Section shown | the menu: each treatment with its own small dial of minutes | the menu as chemist's labels: Besley name, one mono line of facts | aftercare: day 0, 1, 3, 7 as a strip of dates with the clinic's note on each |
| Phone bar | round Book disc and a WhatsApp link | one mono line "Message Odile" | two halves: Book · WhatsApp |

**Difference against every demo** (all live demos and case studies, and the approved Almanac, Flannel and Première
designs): no hero is a dial or clock (closest is Ottoline's four classes drawn as reformers: a row, not a ring);
no hero is a sentence with choosable words (Pastillage asks one question beside the cake; Marlie's chooser writes a
message below a photo strip); no hero is a calendar of dates (Tollgarth shows twelve plant photographs as months,
Ottoline today's classes). None uses a "photo left, tool right" hero (Atelier's), a full-bleed photograph, a stacked
three-line headline, a small label + big two-line heading or tiny spaced capitals. Grounds: porcelain, white and
limestone repeat neutral grounds others use (allowed); blue tansy is deeper and greener than Corbel's blueberry and
far from Swift's enamel blue; kelp olive is browner and more yellow than Selwyn Orr's rosemary; rose clay is pinker and
quieter than Hatheli's stain orange and Laleh's peony. Fonts: all six unclaimed on main and every open branch
(fetched 15 Nov 2026).

**AI-slop pass:** no "transform", "glow", "radiant", "journey", "bespoke", "elevate", triplets or exclamation marks;
headlines are facts or the client's own words; no claim of results, collagen or lifting; "suggestion, not a diagnosis"
under every suggestion; photographs credited and described as models.

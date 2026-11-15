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

### Features and pages by plan
New kit feature ids start with `skin-`.

| Plan | What it gets | The easy extra |
|---|---|---|
| **Starter** (home + Plan your visit) | `skin-menu`: the treatments grouped by what you'd like to change, each with time, "from" price, downtime, patch test (yes/no) and "single" or "course of n", all in the clinic's words; the facialist's credentials line; licence line | `skin-patch`: enter your appointment date, see "patch test by Sat 21 Nov (48 hours before)" with a calendar file; the rule comes from the treatment (most booking pages read use 48 hours) |
| **Plus** (up to 5 pages) | menu page, before-your-visit page (what to stop and how many days before, per treatment), aftercare page, about the facialist, Plan your visit; shared gift vouchers and memberships | `skin-aftercare`: after booking, "remind me" makes a calendar file with the clinic's own day-1, day-3 and day-7 notes and a rebook date at its spacing |
| **Signature** (up to 20 pages) | everything above, plus the showpieces below and these pages: home; treatments (a collection, one page each); peels; microneedling; LED and add-ons; consultation; course planner; the treatment hour; before your visit; aftercare; prices and courses; about the facialist; the room (what to expect, hygiene, access); shop (the clinic's own range by WhatsApp or Payment Link); gift vouchers; memberships; journal (a collection); results (client-only); questions; policies (deposit, cancellation, pregnancy, under-18s) and Plan your visit = 20 | — |

### Showpieces (Signature only; 2–3 a client would show someone)
1. **`skin-consult`, the skin consultation.** Pick up to two things you'd like to change (how skin looks or feels,
   never a condition), add an event if there is one; the clinic's own rules suggest one treatment (or "book a
   consultation first"), with time, "from" price, patch test, downtime and how often, then a pre-filled WhatsApp
   message. Every answer says "a suggestion, not a diagnosis; your facialist confirms at your consultation". Rules
   are the clinic's table in `site.json`; nothing is inferred. Fails closed: a concern the clinic hasn't mapped says
   "book a consultation".
   *Photos:* one per suggested treatment. Checked: free, licensed Pexels photographs of the stages of one facial from
   one shoot exist (mask by brush, serum dropper, mask on; Dave Garcia's set), so the demo can show each suggestion
   without mixing shoots.
2. **`skin-course`, the course planner.** Choose a course (the clinic's own count and spacing, e.g. a course of 6
   peels every 3 weeks), a start date or an event date to work back from; get every appointment date, the patch-test
   date and the stop-retinol-from date (the clinic's day counts), with one calendar file. Refuses an event date the
   clinic's last-safe gap can't meet. No photos needed.
3. **`skin-hour`, the treatment hour.** Each facial drawn as its own clock: the stages and minutes the clinic sets
   (cleanse, skin check, exfoliate, massage, mask, serum and SPF), tap a stage to read what happens and whether it
   stings. Answers "how long" and "what happens" before the first visit. *Photos:* free stock covers four of six
   stages from one shoot; the demo shows the room's still life for the other two and says nothing about technique
   that the photograph doesn't show; the client's own photographs replace them.

**Client-only:** `skin-results` (the clinic's consented before/after pairs of the same person, same light,
unedited, treatment named, signed-consent date held by the clinic). No demo turns it on.

### Alternative showpieces (alongside or instead)
- **"What to pause" checker:** tick the actives you use (retinol, AHAs, BHAs, vitamin C, prescription creams as "a
  prescription cream"); see what the clinic asks you to stop before your treatment and from which date. Light, useful,
  pure clinic data; good Plus upgrade if the owner wants Signature lighter.
- **Live cancellations:** a Google Sheet line "tomorrow 11:00 freed up", shown only while fresh (fails closed after
  the slot passes). Clinics fill late gaps from Instagram stories today.
- **Event countdown for brides and parties:** a cut-down course planner sold on its own to bridal facialists.
- **Shelf refills:** the clinic's retail range with "running low?" reminders as calendar files at each product's
  stated life (a 30 ml serum ≈ 8 weeks, the clinic's figure).
- **Skin diary (client-only):** the client's own consented progress photographs in one light, monthly; a strong
  retention tool for course clients, never a demo feature.
- **Ambitious:** a "your skin, this season" page fed by the clinic's monthly Sheet (what they're booking more of in
  winter, SPF reminders), dated and hidden once the month ends.

### Three design directions (one static screen each: home top + one section, desktop and phone)
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

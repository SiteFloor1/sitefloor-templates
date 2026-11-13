# Teeth whitening and aesthetic dentistry: playbook

What to build for this trade (kit `smile`). The ground rules and the steps for a new kit: [`docs/TRADE-PLAYBOOK.md`](../../TRADE-PLAYBOOK.md).

## Founder-led smile studio (kit `smile`, demo Marlie) — Stage 1, retargeted by the owner 6 Nov 2026
**Brief now:** a young, female-founded smile studio led by a GDC-registered dentist; Instagram-first, soft, feminine and
confident, clinical where it matters. Smiles shown close and large (real stock of natural smiles, models not patients,
no retouching claims). Not a Harley Street practice. The UK rules, tiers, pages and alternatives below still apply;
the wedding countdown (TEETH-6) stays as a feature. Screens: https://claude.ai/artifact/EDh5LCtT7Df8sPKoSjpjV2 (source `sitefloor-internal/docs/trades/teeth/screens-studio/`).

### Combined screen: the booth strip (8 Nov 2026, with the owner)
Owner feedback on D: chunky rounded headline and apricot button read as a generic startup; stock looked generic.
Now one screen: https://claude.ai/artifact/MLiJ6g9T5b7SdKnaqzRsSw (source `sitefloor-internal/docs/trades/teeth/screens-booth/`).
- **Hero:** the booth strip is the main image: four laughing smiles in one warm black-and-white grade, laid flat across
  the page on desktop and upright on phone, developing one frame at a time on load (once, slow, off with reduced motion).
- **Type:** Reddit Sans 200 at 88px for the headline and light facts; Brygada 1918 italic only for Dr Marlie's words.
- **Colour:** white ground; the photos' silver tone; lavender (sprig) only on the chosen tap and links.
- **First section:** E's chooser ("Tell me what you'd change"), WhatsApp message writes itself; GDC line, under-18s,
  no shade promise and complaints link beneath.
- **Difference:** no demo opens with a photo strip; no other demo is all black-and-white photography on white with a
  light grotesk headline (Wexley is white with a three-way mirror; Lyall Harrow white with a serif). Fonts unclaimed.
- **Slop pass:** headline is a fact ("Teeth whitening, by a dentist."); no shade, result or permanence claim; photos are
  credited as models.

### Two studio directions (one static screen each: home top + one section, desktop and phone)
| | D · The booth strip | E · The DM |
|---|---|---|
| Hero idea (the wow) | a photo-booth strip of four close smiles that develop frame by frame on load (once, slow, off with reduced motion) | tap what you want; the WhatsApp message to the dentist writes itself (TEETH-2) |
| Brand world | the booth strip is the motif (aftercare cards and vouchers print as strips) | the message bubble; her own words set in italic |
| Ground | white #FFFFFF; a dark espresso band for the countdown | pale stone #F1EEEA |
| Accent object → colour | ripe apricot → #F3B48C fill, #9E4A24 links | lavender sprig → #B4A6DE fill, #54449A links |
| Photo grade | warm, soft, lifted | clean, true colour |
| Type | Gabarito 800 at 112px / Golos Text | Brygada 1918 italic (her voice) / Familjen Grotesk (facts); serif + sans because the idea is voice vs clinic |
| Section shown | wedding countdown (date in, four dates out) | "Most asked in our DMs": three honest answers beside close smiles |
| Header | lowercase wordmark, small nav, apricot "Book · £45" button | italic wordmark, nav, lavender-underlined "Message us" |
| Copy | "Teeth whitening, done by a dentist." | "Tell me what you'd change about your smile. I'll tell you honestly what's possible." |

**References (never named on a site):** Apa Aesthetic (the dentist as the brand, very few words) → E's founder voice;
Rüh Dental (a young female founder's cosmetic brand, Harrods and Notting Hill) → the brief itself; Glossier's
Instagram-first stores (soft, confident, people not product) → D's tone; Le Labo labels and photo-booth culture (a
printed strip as the keepsake) → D's motif; Aesop shop notes (plain, honest answers) → E's FAQ voice.

**Difference check:** no demo hero is a photo strip or a message composer (closest: Laleh's feed with no hero; Marese's
two campaign photos under a logotype; Wexley's three-way mirror set side by side, not a strip). Grounds: white
(Wexley, Lyall Harrow) and pale stone (Calder Wyke is darker, Portland stone); neutral grounds may repeat. Apricot is
lighter and softer than coral or saffron; lavender is lighter and bluer than dove violet. Fonts unclaimed (Gabarito,
Golos Text new; Brygada and Familjen were this trade's). No "small label + big heading" intros; D's section is a dark
band, E's an italic line.

**AI-slop pass:** no "transform", "glow-up", "confidence", triplets or exclamation marks; nothing promises a shade or a
result; "We won't promise a shade" is stated outright. Stock photos are models, labelled as such in the credits; the
demo never says a photo shows treatment.

## Earlier clinic directions (A–C, superseded 6 Nov 2026)
Calm, clinical luxury: a private clinic, not a beauty salon and not a cartoon smile. Screens:
https://claude.ai/artifact/6hWWPL3yLk1isAkApV9WuA (source `sitefloor-internal/docs/trades/teeth/screens/`).

### UK rules (checked 5 Nov 2026; stated exactly, linked on the site with the date)
- **Who may whiten.** GDC tooth whitening position statement (11 Jul 2016): products with 0.1%–6% hydrogen peroxide may
  only be provided by a registered dentist, dental hygienist, dental therapist, or clinical dental technician on a
  dentist's prescription; anyone not registered with the GDC is not entitled to provide whitening; over 6% is illegal
  for cosmetic whitening; 0.1%–6% products cannot be used on anyone under 18 except to treat or prevent disease.
  Source: gdc-uk.org tooth-whitening-position-statement.pdf; the law is the Cosmetic Products (Safety) (Amendment)
  Regulations 2012 (SI 2012/2263, legislation.gov.uk).
- **What the website must show** (GDC Guidance on advertising, effective 30 Sep 2013, still the published version on
  5 Nov 2026): the practice name and address, phone and email, the GDC's address or a link to its site, the complaints
  procedure and who to go to next (the Dental Complaints Service for private care), the date the site was last updated,
  whether the practice is NHS, mixed or private, and for every named clinician their qualification, the country it was
  gained in, and their GDC number. No one may be called a specialist unless on a GDC specialist list; others may say
  "special interest in" or "experienced in"; no comparing clinicians; no abbreviated post-nominal memberships.
- **Claims and photos.** CAP advice "Teeth whitening" (asa.org.uk, 16 Sep 2025): claims need evidence (no "three shades
  whiter", no permanence claims, no implied lasers); before/after images must not exaggerate and must show the product's
  own result, not retouching. Owner rule on top: before/after only with the patient's recorded consent, and only clinical
  wording the clinician has written.
- **Enforced in code (Stage 2):** `src/kits/smile/lib/gdc.js` holds these facts with the date checked; `config.js`
  refuses a clinician without role, qualification, country and GDC number, a whitening treatment with no registered
  clinician, any "specialist" title without a specialist-list flag, a gallery photo without a consent record (id and
  date, kept by the clinic, never published), and a missing complaints procedure. Demo numbers are 000000.

### Features by plan (from TEETH-1 to 7; easy extra for lower tiers, showpieces Signature only)
- **Always on (GDC asks for them):** clinicians with GDC numbers linked to the register, complaints and patient
  information, NHS/mixed/private line, date last updated, Plan your visit.
- **Starter (home + Plan your visit):** TEETH-1 treatments and "from" prices with each clinician's GDC number.
  *Easy extra:* "Before you book" card on the home page (consultation length, fee, what to bring), pure content.
- **Plus (up to 5 pages):** TEETH-2 consultation request (WhatsApp/email pre-filled, nothing clinical asked);
  TEETH-3 treatment journey (visits, gaps, durations from `site.json`; add each visit to calendar); TEETH-4 aftercare
  (the clinician's own text, top-up price, out-of-hours line). *Easy extra:* aftercare reminders as a downloadable
  .ics (top-up in 6 months, hygiene), made in the browser.
- **Signature (up to 20 pages):** TEETH-5 consented before/after (unretouched, treatment + clinician + consent date
  shown; the shared before/after slider, refused without consent); TEETH-6 wedding smile timeline (date in, steps out,
  worked back from the clinic's own timings, .ics); TEETH-7 discreet arrival (route from door to chair, times relative
  to the appointment, private entrance and lift details from the clinic).
- **Showpieces (Signature):** the one on the approved screen is the hero; the other two sit quietly on their pages.

### Alternative showpieces (alongside or instead)
- **Consultation pre-visit pack:** a private page per patient (by code) with their date, clinician, what to bring and
  arrival route; nothing medical stored.
- **Shade honesty card:** the clinic's own explanation of why crowns and fillings don't whiten, with a "what we'd
  suggest instead" link per case; the clinician writes every word.
- **The clinic in sound and light:** a quiet room tour (photographs, one short film), the chair, the view, the tea.
- **Event countdown in the footer:** once a patient enters a wedding date, a small "14 weeks" line follows them round
  the site (stored only in their browser).
- **Gift a consultation:** a voucher for a consultation only (never a treatment), the clinic's Stripe Payment Link.

### Pages (Signature 15–20; ★ = Plus core)
1★ Home · 2★ Whitening · 3★ Treatments and prices · 4★ Consultation · 5★ Clinicians · 6 Treatment journey ·
7 Aftercare · 8 Smile gallery (consented) · 9 Wedding smile · 10 Arriving (discreet arrival) · 11 The clinic ·
12 Composite bonding · 13 Porcelain veneers · 14 Hygiene · 15 Patient information and complaints · 16 Journal (what
whitening can and can't do, keeping results, crowns and fillings) — clinical claims only as the clinician states them.
The per-treatment pages (12–14) are one generated collection, so this is 14 counted pages plus room for 6 add-ons.

### Three directions (one static screen each: home top + one section, desktop and phone)
| | A · The day | B · The mews door | C · The index |
|---|---|---|---|
| Hero idea (the wow) | type your date; the plan counts back with real dates | pick your time; the route from door to chair re-times | choose a treatment; visits, gaps, price, clinician appear |
| Showpiece it leads with | TEETH-6 wedding smile timeline | TEETH-7 discreet arrival | TEETH-3 treatment journey |
| Ground | white #FFFFFF | ivory #F6F3EE | near-black #121110 |
| Accent object → colour | olive leaf → #566131 | ripe fig → #5B2D47 | lemon peel → #E4C24A |
| Photo grade | warm daylight, lifted blacks | soft, slightly muted warm | black and white |
| Type | Familjen Grotesk only | Brygada 1918 only (roman + italic) | Darker Grotesque + Golos Text |
| Section shown | treatments and prices table | treatments as a three-column letter | clinicians with GDC numbers |
| Header | wordmark, nav, olive underlined text link | italic wordmark, fig underlined link | wordmark, grey nav, lemon-underlined link |

**Real references (never named on a site):** Apa Aesthetic (New York, Dubai: the dentist's own calm, very few words,
treatment as craft) → C's restraint and the index; Rüh Dental at Harrods (fourth-floor Wellness Clinic: a treatment
coordinator, everything arranged for you) → B's arrival; Aman spa menus (time and ritual laid out plainly) → A's
plan; Claridge's arrival letters (the time and what happens next, in a book serif) → B's type; Vitra's product index
pages (a list that is the navigation) → C's hero.

**Mini design systems.** A: 12-col, 48px gutters, type 112/40/30/19/15/13, spacing 8-based, photo 4:5, motion none
beyond the date updating. B: 12-col 5/7 split, type 52 italic times/40/22/16/14, photo 2:3, motion none. C: 12-col 7/4,
type 88 light/72/34/17/14, photo 4:5 monochrome, motion: the lemon mark grows (0.5s), photo cross-fades; both off under
reduced motion.

### Difference check against every demo and case study (main and open branches)
- **Hero:** no existing hero is an input (date), a time picker, or a list used as navigation. Closest: Ottoline (live
  classes along a photo's foot) and Swift Cuts (queue ticket) are live data, not inputs. B's black door is a framed
  photo, not full-bleed; Pellow & Garth and Calder Wyke show houses, but as a full hero photo and a library beside a
  carved sentence. No demo opens with a full-bleed photo or film here.
- **Header:** none uses a plain text link as the main call (A, B, C); Calder Wyke and Lyall Harrow use buttons.
- **Section intros:** no "small label + big two-line heading"; A and C put the section name in a left column, B as a
  single italic word. Different from each other in rhythm (table / letter / register).
- **Ground:** white (shared with Wexley, Lyall Harrow), ivory (Larchmere, Fennick & Lowe), near-black (Fade District,
  Isotach, Varnell): neutral grounds are allowed to repeat (golden rule 4); layout, type and hero differ.
- **Accent:** olive, fig and lemon are not on the taken list (closest: pistachio, peony, gold/saffron; all clearly
  different in hue or value).
- **Type:** all four families unclaimed (checked with `git fetch` across branches; now claimed in `fonts.md`). A and B
  avoid the "serif headline + plain sans" default by using one family each.
- **Phone bar, footer:** not shown yet; each will be the look's own (A: a single "Book" text bar; B: none, the route's
  "Request" link; C: a thin black bar with the lemon mark).

### AI-slop pass (done on all screen copy)
Removed: "transform your smile", "confidence", "luxury experience", triplets, exclamation marks, "we're passionate".
Kept to facts a patient checks: dates, minutes, visits, prices from, names, GDC numbers. Nothing promises a shade or a
result. "There is no waiting room" and "Nothing is decided in the room" are clinic facts the client must confirm.

### Next (Stage 2, after the owner picks)
Build `smile` kit, the look, the Kestle demo (name checked: no UK dental business found by that name; Companies House
check before publishing), tests, budget, accessibility, `speed.md`, README, published demo, PR ready, owner update and
auditor message. Release the unpicked directions' fonts.

## Stage 2: built 9 Nov 2026
The approved booth screen, built as kit `smile`, look `booth`, demo Marlie (Signature; no UK dental business of that
name found), with both of the owner's fixes (rules at body size; on a phone the strip within one screen and Book in
the phone bar). Features: smile-treatments, smile-clinicians, smile-before-book (Starter extra), smile-patient-info
(free page), smile-chooser, smile-treatments-page, smile-whitening-page, smile-consultation-page, smile-journey,
smile-aftercare (Plus extra: calendar reminders), smile-clinicians-page, smile-gallery, smile-wedding,
smile-treatment-pages, smile-journal, smile-studio, smile-arrival. Speed: `speed.md`. Agent notes: `sitefloor-internal/docs/trades/teeth/handover.md`.

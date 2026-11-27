# Fragrance houses and perfumers: playbook

What to build for this trade (kit `fragrance`, look `verriere`, demo Verrière; built 17 Nov 2026). The ground rules and
the steps for a new kit: [`docs/TRADE-PLAYBOOK.md`](../../TRADE-PLAYBOOK.md).

## Perfume house with a boutique and an online shop (round 1, 16 Nov 2026)
- Customer: someone choosing a scent for themselves (needs to know what it smells like, and to try it first) or buying a
  gift (needs a safe choice, wrapping, engraving and a delivery date). The site's job: turn "I can't smell it online"
  into a sample or a bottle, and make the gift easy.
- References (owner's): Penhaligon's (British heritage and wit) and Maison Francis Kurkdjian (Parisian precision and
  light). Bottles shown large, lit like jewellery.
- Approved 17 Nov 2026 (design round 4, `sitefloor-internal`, branch `design/fragrance`): **Verrière**, the hero bottle
  as a rendered turntable, launch mode as a state of the same page. Built as the `fragrance` kit and `verriere` look.
- The kit serves both a heritage house and a new brand launching (see "Launch mode").

### Built (17 Nov 2026)
| Plan | Features (ids) |
|---|---|
| Starter | `fragrance-library` (FRAG-1), `fragrance-sizes` (sizes side by side), `fragrance-launch` (launch mode), plus visit, Plan your visit, questions, reviews, seasonal |
| Plus | `fragrance-pages` (the fragrances page), `fragrance-organ` (FRAG-2, Scent finder), `fragrance-discovery` (FRAG-3), `fragrance-gifts` (FRAG-4 order form), page links, general pages |
| Signature | `fragrance-turntable`, `fragrance-notes` (FRAG-5), `fragrance-engraving-desk` (FRAG-4 with the live preview), `fragrance-choose` (Let them choose) |

Let them choose, as built: the house checks the code in its own Stripe dashboard when the choice arrives on WhatsApp;
the page neither stores nor checks codes (a Sheet-backed check can come later). Alternatives still on the shelf:
fragrance wardrobe (FRAG-6), refills with a calendar reminder (FRAG-8), bespoke consultation (FRAG-7), a layering
pair-builder (two scents, the house's own pairings), and an ingredient-of-the-month band.

### Features by plan (owner's decisions, 16 Nov 2026)
- **Starter:** FRAG-1 fragrance library (each scent: notes, character in the house's words, sizes, prices, sample price,
  "add to bag" by the client's Stripe Payment Link per size). Easy extra: **sizes side by side**, every size drawn to
  scale from the client's millilitres with the price per 10 ml worked out from its prices.
- **Plus:** FRAG-2 **the organ** (photographs of real ingredients; pick up to three, they turn to colour and the scents
  that have them rise), FRAG-3 sample set (pick four, one Stripe link per set size, the discovery terms in the house's
  words), FRAG-4 gift wrap and engraving order form (words, letter style, bottle or box, price).
- **Signature:** FRAG-4 **the engraving desk** (the words previewed live on the bottle), FRAG-5 **notes on the bottle**
  (top, heart and base drawn at the bottle's own heights; tap a note to see which other scents have it), **Let them
  choose** (pay an amount, they try samples and pick their bottle and engraving; the client's Stripe link and promotion
  code, codes listed in the client's Sheet). Alternatives kept for later: fragrance wardrobe (FRAG-6), refill programme
  with a calendar reminder (FRAG-8), bespoke consultation (FRAG-7).
- **Pages (approved):** Home, The fragrances, Scent finder, Gifts, Discovery sets (Plus five); Signature adds bespoke
  perfume, home fragrance, engraving and wrapping, layering guide, the perfumer's notes, refills, boutiques and events,
  weddings and corporate gifts, journal. Every site also gets Plan your visit, open now, WhatsApp, reviews, Instagram.

### The hero bottle: what a real client gets (be honest when selling)
- **One feature, two sources: the turntable.** The hero is a 360° turntable the visitor drags: 36 frames, 10° apart,
  the first frame is the poster, the rest load when the visitor hovers, touches or tabs to it. Arrow keys turn it too; there is no
  autoplay, so reduced motion needs nothing extra.
- **Demo:** a bottle of our own design, rendered in Blender Cycles as 36 turntable frames (real glass thickness,
  refraction, caustics, liquid absorption that deepens with depth), on a travertine plinth. A symmetric flacon looks the
  same from the back, so it needs 18 unique frames.
- **Real clients:** their own **turntable photographs**, 24 to 36 shots of the bottle on a turntable, same light and
  distance. The page and the feature are the same as the demo's, only the frames change. A phone on a £20 turntable in a
  lightbox is enough; we give them the shot list. Without the shots, the hero is their best still photograph.
- **Rendered bottle for a client (Bespoke add-on, quoted separately):** a Cycles turntable of *their* bottle needs an
  accurate model (supplier drawings or a scan) and their liquid colour. It is never part of Signature.
- The notes, engraving preview and organ work the same over a photo or a render.
- The engraving preview needs one calibrated front-on picture of the bottle (we mark the engravable area once). No
  calibrated picture: the preview hides and the plain order form shows.

### Launch mode (a new brand, before and on launch day)
- A setting in the site, not a separate kit: `launch.date`, `launch.waitlist` (a Google Form or Sheet), `launch.preorder`
  (one Stripe Payment Link per scent), `launch.story` (the founder's note, in their words).
- **Before launch:** the hero says what is coming and when (date and days to go, worked out on the day), a waitlist
  (email to the client's Form; no marketing promises we can't keep), pre-order by the client's Stripe link with the
  client's own terms (when it ships, what happens if they cancel; UK consumers keep their 14-day right to cancel), the
  organ limited to the launch scents, the founder's note, launch-night or stockist dates (.ics).
- **On the date:** the site switches itself to the normal shop (pre-order becomes "add to bag", the countdown goes,
  "new" marks the launch scents for a set number of weeks). In demos the launch date is moved ahead of today on every
  build (`src/demo/dates.js`), never fixed.
- Honesty: no "selling fast", no fake waitlist counts, no stock numbers unless the client's Sheet supplies them.

### Showpiece candidates (round 1 discussion, kept for reference)
| Showpiece | What it does | Question it answers | Tier | How it runs at £0 | Effort | Honesty risk, and how it fails closed | Why a visitor shares it |
|---|---|---|---|---|---|---|---|
| **The engraving desk** (FRAG-4, live preview) | Type a name or date and watch it appear engraved on the real bottle photo, in the house's letter styles; then pay | "What will it look like? Is it worth £15?" | Signature (the order form without preview is Plus) | Client gives a front-on bottle photo, the engravable area, letter styles, character limit, price and days; payment by their Stripe link | Medium | It's a preview, not a proof: labelled "Preview", letters only from the house's allowed set. No calibrated photo for a bottle: the preview hides and the plain form shows | "Look, it's got her name on it." A screenshot is the gift card |
| **Notes on the bottle** (FRAG-5) | Top, heart and base drawn at the cap, shoulder and foot of the bottle; tap a note to see which other bottles in the house have it | "What does it smell like, and what else is like it?" | Signature | Client's Sheet: one row per fragrance, three note columns. Matches are worked out on the page | Small to medium | Notes only from the house's list; no "smells like [brand]". Missing notes for a scent: that scent shows its description only, never a guessed pyramid | Finding "iris is in three of them" feels like being let into the perfumer's book |
| **The organ** (FRAG-2) | Black-and-white photos of real ingredients; pick up to three you love, they bloom into colour and the bottles that contain them rise | "Which one is for me?" | Plus (approved Plus); the photo version is the showpiece | The same Sheet as the notes, plus one photo per ingredient (we supply free licensed photos for common ones) | Medium | Matches are notes the house lists, never "you'll love". An ingredient with no bottle is never shown | It's a game: "pick three things you love" |
| **Let them choose** (own idea; uses FRAG-3 and FRAG-4) | You pay an amount and write the card; they get a code, try samples at home, pick the bottle and their engraving | "I don't know what they wear" | Signature | Client's Stripe link for the amount (their Stripe promotion code is the voucher); codes listed in the client's Sheet as used or not; the recipient's choice arrives on WhatsApp | Medium | The code page reads the client's Sheet: unknown or used code says so, never a balance we guessed; a sheet older than its limit shows "being updated" | The giver looks thoughtful; the recipient gets to play with the finder |
| **Fragrance wardrobe** (FRAG-6) | Build a set of three for day, evening and a season from the house, sent as one list | "Which ones go together?" | Signature | Client tags each scent (day, evening, season) in the Sheet; the set goes out on WhatsApp or as a sample-set link | Small | Only the house's own tags; no "perfect for you" | Couples and friends compare wardrobes |
| **Refill programme** (FRAG-8) | Which bottles refill, price and where; pick when you'd like a nudge and it goes in your calendar | "Can I refill it, and when?" | Signature | Client lists refillable bottles, refill price and places; the reminder is an .ics made on the phone, nothing stored | Small | "A reminder, not a measurement": the visitor picks the date; we never estimate when a bottle runs out | Saves money; the calendar alert brings them back |
| **Bespoke consultation** (FRAG-7) | The bespoke process, price from, and a request (date wished, occasion) | "Can you make one just for me?" | Signature | Link to the client's booking app or a WhatsApp request | Small | Requests, never "booked" unless the booking app confirms | Weddings and milestones |
| **Sizes side by side** (own idea) | Every size drawn to scale with the price per 10 ml | "Is 100 ml worth it over 50?" | Starter (the easy extra) | From the client's sizes and prices | Small | Worked from the client's own prices; no "best value" badge | Plain usefulness |

Owner's decision (16 Nov): Signature gets the engraving desk, notes on the bottle and Let them choose (plus the rendered
turntable hero for the demo only); Starter gets sizes side by side; Plus gets the organ. Similar services exist as products
(Penhaligon's engraving desk, Miller Harris's discovery-set voucher, Thomson Carter's sample box with a card for the
chosen bottle); none of the sites checked shows a live engraving preview or the notes drawn on the bottle.

### Honesty
- Notes and character only. No longevity hours or performance claims unless the client supplies them.
- Prices, sizes, engraving limits, delivery, returns and discovery terms are the client's, in their words.
- Engraving preview is labelled a preview; refill reminders are the visitor's own date.
- Demos use fictional fragrances and prices, marked as a demo.

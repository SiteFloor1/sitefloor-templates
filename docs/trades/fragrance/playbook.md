# Fragrance houses and perfumers: playbook

What to build for this trade (kit `fragrance`, not built). The ground rules and the steps for a new kit:
[`docs/TRADE-PLAYBOOK.md`](../../TRADE-PLAYBOOK.md). Round 1 is design only: nothing is built until the owner approves one
screen and the showpieces.

## Perfume house with a boutique and an online shop (round 1, 16 Nov 2026)
- Customer: someone choosing a scent for themselves (needs to know what it smells like, and to try it first) or buying a
  gift (needs a safe choice, wrapping, engraving and a delivery date). The site's job: turn "I can't smell it online"
  into a sample or a bottle, and make the gift easy.
- References (owner's): Penhaligon's (British heritage and wit) and Maison Francis Kurkdjian (Parisian precision and
  light). Bottles shown large, lit like jewellery.
- Three directions on review (design notes and screens in `sitefloor-internal`, branch `design/fragrance`):
  A **Merriott**, the engraving desk; B **Verrière**, notes on the bottle; C **Lovage**, the organ.

### Features by plan (approved codes FRAG-1 to FRAG-8)
- **Starter:** FRAG-1 fragrance library (each scent: notes, character in the house's words, sizes, prices, sample
  price, "add to bag" by the client's Stripe Payment Link per size). Easy extra: **sizes side by side**, every size
  drawn to scale from the client's millilitres with the price per 10 ml worked out from its prices.
- **Plus:** FRAG-2 scent finder (the organ: up to three notes you love, bottles that have them), FRAG-3 sample set
  (pick four, one Stripe link per set size, the discovery terms in the house's words), FRAG-4 gift wrap and engraving
  order (words, letter style, bottle or box, price; sent with the order on WhatsApp or as the Stripe link's note).
- **Signature (showpieces, to discuss):** see the table; recommended FRAG-4 live engraving preview, FRAG-5 notes on the
  bottle, and "Let them choose". Every site also gets Plan your visit, open now, WhatsApp, reviews and Instagram.
- **Pages (approved):** Home, The fragrances, Scent finder, Gifts, Discovery sets (Plus five); Signature adds bespoke
  perfume, home fragrance, engraving and wrapping, layering guide, the perfumer's notes, refills, boutiques and events,
  weddings and corporate gifts, journal.

### Showpiece candidates (to discuss, not decided)
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

Recommendation: **Signature: the engraving desk, notes on the bottle, and let them choose. Starter: sizes side by side.**
The engraving desk sells the most profitable moment (gifts, Christmas, weddings) and is the strongest first-screen wow;
notes on the bottle answer the first question every customer asks, and do it in a way no house I checked does; let them
choose turns the hardest gift into an easy one. The organ stays Plus (approved), and the wardrobe, refills and bespoke
consultation are alternatives or add-ons. Similar ideas already exist as products: Penhaligon's runs an engraving desk,
Miller Harris gives a voucher with its discovery set, and Thomson Carter sells a sample box with a card for the chosen
bottle. None of the sites I checked shows a live engraving preview on the bottle or the notes drawn on the bottle.

### Honesty
- Notes and character only. No longevity hours or performance claims unless the client supplies them.
- Prices, sizes, engraving limits, delivery, returns and discovery terms are the client's, in their words.
- Engraving preview is labelled a preview; refill reminders are the visitor's own date.
- Demos use fictional fragrances and prices, marked as a demo.

# Modest fashion and abaya boutiques: playbook

What to build for this trade (kit `modest`, proposed). The ground rules and the steps for a new kit: [`docs/TRADE-PLAYBOOK.md`](../../TRADE-PLAYBOOK.md).

## Modest fashion and abaya boutique (new `modest` kit, branch `trade/modest`): design round 2, 16 Nov 2026
A UK modest-wear label or boutique: abayas, kaftans, hijabs and inners, an Eid rush every year, occasion and nikah
pieces by appointment. Owner's references: Selhaya (soft, editorial British silk), Bouguessa (minimal couture),
Effa (polish). Elegant, contemporary, respectful; never stereotyped, no clichéd motifs.
Questions: [`questions.md`](questions.md). Directions, references, difference table and screens:
`sitefloor-internal/docs/trades/modest/directions.md` (branch `design/modest`). **No build until the owner picks one
screen and the showpieces.** Round 2: direction A, **Ourika** (the hem line), chosen; the showpieces and plan split below are decided.

Selling stays on the client's own shop (Shopify, Etsy or Stripe Payment Links); the site is the flagship that answers
length, fabric, delivery and occasion questions and turns them into a WhatsApp message or a payment link.

### Features (codes)
MOD-1 to MOD-8 were approved on 29 Oct 2026, MOD-9 to MOD-13 on 16 Nov 2026 (`docs/VISION.md`).
Every feature runs at £0: the shop's own Google Sheet (pieces, lengths, stock, cut-off dates, free appointment times),
WhatsApp pre-filled messages, the shop's Stripe Payment Links, `src/core/lib/seasons.js` for expected Eid dates.

| Code | Plan | Feature | What the client fills in |
|---|---|---|---|
| MOD-1 | S | Collection: pieces, prices, colours, lengths in stock | Sheet: piece, price, colour, lengths, stock |
| MOD-2 | S | Size guide by height: enter your height, your row of the shop's chart lights up | Sheet: the shop's length chart |
| MOD-13 | S | Model line on every photo ("Model 5′8″, wears 58") | One field per photo |
| MOD-3 | P | Length finder: your length across the whole collection, only what's in stock in it | Sheet (as MOD-1/2) |
| MOD-4 | P | Drop countdown and waitlist | Sheet: drop date and time; Form or WhatsApp for the list |
| MOD-5 | P | Eid order-by: expected Eid date, the shop's last order dates per method, counting down | Sheet: method, last date, updated |
| MOD-10 | P | Private appointment: free times this week, request one on WhatsApp | Sheet: free times |
| MOD-6 | Sig | Complete the look: abaya + hijab + inner, choose length and colour, one total, WhatsApp or Stripe link | Sheet: sets and their pieces; Stripe link per set |
| MOD-7 | Sig | Made to measure: lengths and alterations offered, weeks, "from" price, deposit link | Sheet; Stripe deposit link |
| MOD-8 | Sig (client-only) | Fabric library: each fabric close up, in daylight and against a window, weight, opacity, care, in the shop's words | The shop's own photos (two per fabric) |
| MOD-9 | Sig | The hem line: where the hem falls on you, to scale, in flats or heels | Nothing new (uses MOD-2's chart) |
| MOD-11 | Sig | Eid family list: one link the family fills in (each height, piece, colour), sent as one WhatsApp order | Nothing new |
| MOD-12 | Sig | Gift a look: the shop's gift card link plus a card preview | Stripe link |

### Showpieces (discussed round 1; decided 16 Nov, see below)
| Candidate | What it does | Customer question | Plan | £0 how | Effort | Honesty risk and how it fails closed | Why she'd show a friend |
|---|---|---|---|---|---|---|---|
| Length guide (MOD-3) | Height in, the shop's length out, then only pieces in stock in that length | "What length for 5′3″?" | Plus | Shop's chart and stock sheet | Small | Charts differ between shops: always the shop's chart, never ours; stock older than 48h is hidden and says "ask us" | Saves the return everyone has made |
| Eid order-by (MOD-5) | Expected Eid date, the shop's cut-offs, days left, the next one highlighted | "Will it arrive before Eid?" | Plus | Sheet of cut-offs; Eid from `seasons.js` | Small | Eid always "expected, follows the moon sighting"; a sheet older than 10 days hides the dates and says so | Sisters forward it in the family chat in Ramadan |
| Complete the look (MOD-6) | Abaya, matching hijab and inner, length and colour chosen, totalled, one message or one payment link | "Is there a matching hijab and inner?" | Signature | Sets sheet; one Stripe link per set | Medium | A set with any piece out of stock can't be sent; prices only from the sheet | It's the outfit, priced, ready to send |
| Fabric library (MOD-8) | Each fabric in daylight and against a window, weight, opacity in the shop's words | "Is it see-through? Will it be warm enough?" | Signature | The shop's own two photos per fabric | Medium | No opacity claim we write; no photo, no light view (the row says "photo to come", never a stock image) | Answers the question nobody can see in a product shot |
| Private appointment (MOD-10) | Free times from the shop's diary, request one by WhatsApp | "Can I try the bridal pieces with my mum?" | Plus | Sheet of free times | Small | Times are requests, confirmed by message; past or stale times disappear | Bride sends the time to her sisters |
| **The hem line (MOD-9, new)** | Shoulder-to-floor measurement (or height) and your shoes in, the shop's lengths drawn to scale, the hem's gap to the floor out | "Will it drag, or show my ankles?" | Signature | Uses MOD-2's chart; all maths in the browser | Medium | Height-only falls back to the shop's chart, labelled; the drawing is to scale, not a photo of you; a length outside the chart says "ask us" | No competitor has it; it answers the most-returned question with a picture |
| **Eid family list (MOD-11, new)** | One link the whole family adds to: each name's height, piece, colour; lengths worked out; one WhatsApp order | "Can I order for my mum and sisters together?" | Signature | Nothing stored: the list lives in the link | Medium–large | Nothing saved on a server; a length outside the chart flags "ask us"; prices from the sheet | It's made to be shared |

**Decided (owner, 16 Nov 2026).** Signature: **the hem line**, **complete the look** (with a "Your look · total"
bar on every page, in the look's own language) and **the Eid family list**. Plus: Eid last order dates, the length
finder, private appointment. Starter: the size guide by height. The fabric library is client-only (needs the shop's
own photos; never on the demo). Made to measure (MOD-7) stays a Signature option.

### Pages (Signature, 19)
Approved 29 Oct (`docs/VISION.md`, MOD pages 1–15): Home ★ · New collection ★ · Abayas ★ · Size and length guide ★ ·
Eid edit ★ · Kaftans and dresses · Hijabs and accessories · Occasion and bridal · Made to measure · Fabrics · Drops and
waitlist · Complete the look · Stockists · Our story · Journal.
**Approved 16 Nov:** 16 Private appointments · 17 Delivery, returns and Eid dates · 18 Care ·
19 Gift cards.
Starter = Home + Plan your visit (with the size guide on Home). Plus = up to 5 (Home, New collection, Abayas, Size and
length guide, Eid edit).

### Honesty
- Returns: the shop's policy in its words; the 14-day cancellation right for online orders and the exception for
  goods made to the customer's specification (Consumer Contracts Regulations 2013 reg 28(1)(b)), as in `questions.md`.
- No religious rulings in our words; Eid dates always "expected"; no invented reviews, press or celebrity mentions.
- Demo prices and dates marked as samples; demo photos credited (Pexels free licence).

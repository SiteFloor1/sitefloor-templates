# Modest fashion and abayas: customer questions

What this trade's customers ask before they buy or visit (kit `modest`, proposed). How to read it and the questions every trade gets: [`docs/CUSTOMER-QUESTIONS.md`](../../CUSTOMER-QUESTIONS.md).

## Modest fashion and abaya boutique (new `modest` kit, trade/modest)
Researched 16 Nov 2026 from real UK shops' own FAQ, size-guide and product pages (Aab: size guide, FAQ, Eid cut-off
lines on product pages, Aab Atelier made-to-order; AbayaButh: sizing page, inner-slip and Eid Saturday-delivery notes;
Hawaa: abaya sizing guide; Amsons: size guides, delivery and returns lines) and the cancellation rules below. Ranked by
how often the answer decides the sale. Feature codes are VISION.md's MOD codes; ids are proposals until the owner
approves the plan.

| # | Question | Answered by |
|---|---|---|
| 1 | What length do I need for my height? | MOD-3 `modest-length` (height in, the shop's own chart out; "with heels, go one up" only if the shop says so) |
| 2 | What do the numbers mean (52, 54, 56…)? | MOD-2 `modest-size-guide` (the shop's chart: length in inches = the garment from shoulder to hem) |
| 3 | What width or size am I? Is it one size? Does it fit a UK 16–24? | MOD-2 (the shop's width sizes or "one size fits UK 8–20" in its words) |
| 4 | How tall is the model and what is she wearing? | `modest-piece` line per photo ("Model is 5'7" and wears 58", from the shop) |
| 5 | Is it see-through? Do I need an inner slip? | MOD-8 `modest-fabric` (opacity in the shop's words: opaque, opaque once layered, sheer by design) + the matching inner |
| 6 | Will it arrive before Eid? What's the last order date? | MOD-5 `modest-eid-order-by` (the shop's own cut-offs per delivery method, counting down; estimated Eid date with "the date follows the moon sighting") |
| 7 | Is there a matching hijab, inner or set? | MOD-6 `modest-look` (the set on one page, priced together) |
| 8 | What is the fabric? How heavy is it? Is it warm enough for a UK winter / cool enough for summer? | MOD-8 (fabric, weight in the shop's words, season) |
| 9 | Can I return or exchange it? How long do I have? | shared returns page: the shop's policy in its words + the rule: online orders have a 14-day cancellation right; goods made to the customer's specification are excepted (Consumer Contracts Regulations 2013 reg 28(1)(b), legislation.gov.uk; Which? "How do I cancel an online order?", checked 16 Nov 2026). The site never says "no returns by law" |
| 10 | Can I exchange for another length? | returns page (the shop's exchange window and whether it pays postage) |
| 11 | Can you shorten it or make it longer? Custom length? | MOD-7 `modest-made-to-measure` (lengths offered, weeks, price from the shop) |
| 12 | Can you make one to my measurements? How long does it take? Deposit? | MOD-7 (weeks, "from" price, deposit by the shop's Stripe link; "made-to-order pieces can't be cancelled once cut" only in the shop's words) |
| 13 | When does the next collection drop? Will it sell out? Can I join a waitlist? | MOD-4 `modest-drop` (date and time from the shop's sheet; a waitlist by WhatsApp or the shop's Form) |
| 14 | Is it back in stock? | MOD-4 (sheet: sold out / back on a date / waitlist) |
| 15 | Do you have something for a wedding, nikah or walima? | MOD occasion page + `modest-appointment` |
| 16 | Can I see pieces in person? Do you have a showroom or do private appointments? | `modest-appointment` (request a time on WhatsApp; the shop's address only if it has one) |
| 17 | Can I bring my mother or sisters? Is the room women only? | `modest-appointment` (how many guests, "a private room with women staff" only if true) |
| 18 | How much is delivery? Next day? International? | shared delivery block (the shop's prices and cut-off time, e.g. "order by 1pm") |
| 19 | When will it be dispatched? Is it pre-order? | `modest-piece` (in stock / pre-order with a date) |
| 20 | How do I wash it? Dry clean? Can I iron crepe or silk? | MOD-8 + care page (the shop's care labels) |
| 21 | What colours does it come in? Is the colour true to the photo? | `modest-piece` (colours from the sheet; "photographed in daylight" only if true) |
| 22 | Does it have pockets? Buttons or poppers? Can I wear it open? | `modest-piece` details |
| 23 | Is it breastfeeding friendly? | `modest-piece` details (only when the shop says so) |
| 24 | Is it suitable for prayer / Umrah? | `modest-piece` (the shop's own tags: prayer abaya, travel) |
| 25 | What hijab fabric slips least? Do I need an undercap or magnets? | hijab pages and MOD-6 (accessories the shop sells) |
| 26 | Do you do gift sets or gift cards for Eid? | shared vouchers (the shop's Stripe link) + `modest-look` gift box |
| 27 | Can I see it on different heights or body types? | MOD-3 (the photo and model line nearest the visitor's height, if the shop has them) |
| 28 | Is it modest enough: loose, long sleeves, not clingy? | `modest-piece` fit line ("relaxed", "falls straight", the shop's words) |
| 29 | Do you do girls' sizes or mother-and-daughter sets? | collection filter (the shop's own ranges) |
| 30 | Where are you based? Do you do pop-ups or stockists? | MOD stockists page / events from the sheet |
| 31 | Is the price final? Will it go on sale? | none: never answered for the shop. FAQ in its own words only |
| 32 | Is it ethically made? Where is it made? | Our story (the shop's own words; never "ethical" unless the shop can say why) |

## Never on the site
- Religious rulings ("this is shar'i", "halal") in our words. A shop's own description of a style is fine.
- Exact Eid dates as fact: always "expected", from `src/core/lib/seasons.js`, with the shop's own cut-offs.
- Invented reviews, celebrity mentions or press.

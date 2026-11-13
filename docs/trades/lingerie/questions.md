# Lingerie boutiques: customer questions

What this trade's customers ask before they get in touch (kit `lingerie`). How to read it and the questions every trade gets: [`docs/CUSTOMER-QUESTIONS.md`](../../CUSTOMER-QUESTIONS.md).

## Luxury lingerie boutique (new `lingerie` kit, trade/lingerie)
Researched 29 Oct 2026 from real UK shops' own FAQ pages (Rigby & Peller, Fleur of England, Molke's in-person fitting
FAQ, Coco de Mer's Primrose Hill private room) and the returns rules below. Feature ids are proposals until the owner picks a direction.

| Question | Answered by |
|---|---|
| Do I need to book a fitting? How long is it, is it free, do I have to buy? | `fitting` (length, price or free, "no need to buy" only if the shop says so) + request on WhatsApp |
| What should I wear or bring to a fitting? | `fitting` "before you come" lines (the shop's own words: best-fitting bra, easy top) |
| Can I bring my partner, a friend or my mother? | `fitting` and `private-hour` (how many guests the shop allows) |
| Can I come after hours or have the shop to myself? | `private-hour` (evenings the shop offers, request with a time and party size) |
| Is the fitting room private? Who will fit me? | `the-room` (one photo of the room, the shop's words; no staff names unless the client wants them) |
| Do you fit teenagers? | `questions` (the shop's own policy; e.g. Molke fits under-18s only with consent and a parent present) |
| Are you accessible? | `visit` (step-free, stairs, the shop's own words) |
| What sizes do you stock (band and cup range)? | `size-range` (the shop's band and cup range as a grid; what's in stock vs to order) |
| I don't know my size / I'm between sizes | `fit-notes` per piece (runs small, firm band) from the shop; `fitting` |
| I'm buying for my partner and don't know their size | `buying-for` gift guide: check a label at home, or choose forgiving pieces (slips, robes, S/M/L), or a gift card; ends in a WhatsApp message |
| Do you do gift cards? | shared `vouchers` (the shop's Stripe link) |
| Do you gift wrap? Can I add a note? | `gift-wrap` (the shop's wrap, price or free, a note line in the message) |
| Is the packaging discreet? What appears on my bank statement? | `discreet` (plain outer box, the trading name that shows on a statement, both in the shop's words; never assumed) |
| Can I return lingerie? | `returns` (the shop's policy in its words) + the rules: in a shop there is no legal right to return for a change of mind (shop's policy decides); online and phone sales have a 14-day cancellation right, except sealed goods unsealed after delivery that aren't suitable for return for health or hygiene reasons; faulty goods are always covered. Sources: Consumer Contracts Regulations 2013 reg 28(3)(a), legislation.gov.uk; Citizens Advice "Changing your mind" (checked 29 Oct 2026). The site never says briefs "can't be returned by law" |
| Can I exchange a gift? | `returns` (the shop's gift and exchange window) |
| Do you do bridal lingerie? How early should I come? | `bridal` page (the shop's lead time; bring the dress or a photo of its back) |
| Will it arrive by Valentine's / Christmas? Can I still collect? | `gift-takeover` (the shop's own order-by and collect-by times, counting down) |
| Can my bridesmaids come to my fitting? | `party-evening` (an evening for the bride and her party) |
| Can you make something to measure? How long, how much, is there a deposit? | `made-to-measure` (weeks, "from" price and deposit from the shop; deposit by the shop's Stripe link) |
| Can you alter a bra or swimwear? | `questions` / `made-to-measure` (alterations the shop offers) |
| Which brands do you carry? | `brands` (names as text only, the shop's own list; no logos) |
| How do I wash silk and lace? | `care` card (the shop's own care advice) |
| Do you do mastectomy fittings? | `questions` (only if the shop does; their words) |
| Are you open now? Parking? | `visit` (Plan your visit) |

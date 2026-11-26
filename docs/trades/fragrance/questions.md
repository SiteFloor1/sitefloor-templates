# Fragrance houses and perfumers: customer questions

What this trade's customers ask before they buy or visit (kit `fragrance`, not built yet). How to read it and the questions
every trade gets: [`docs/CUSTOMER-QUESTIONS.md`](../../CUSTOMER-QUESTIONS.md).

## Perfume house with a boutique and an online shop (branch `trade/fragrance`)
Researched 16 Nov 2026 from real UK houses' own pages: Penhaligon's (engraving desk, refills only in some stores and only
in store), Floris (FAQ, delivery, returns: samples returnable only if faulty), Miller Harris (discovery set and a
voucher towards a full-size bottle), Les Senteurs (sample service with a bottle voucher, consultations, wrapping and
handwritten notes), Creed UK (engraving on selected bottles), Experimental Perfume Club (refill cartridges, a paid
consultation redeemable against a bottle), Thomson Carter (a gift set of samples plus a card for the chosen bottle),
Bloom Perfumery (opened perfume not returnable for subjective reasons). Ranked by how often the answer decides the sale.
Every price, size, policy and note on a client site comes from the client.

| # | Customers ask | What answers it |
|---|---|---|
| 1 | What does it smell like? | each fragrance's notes (top, heart, base) and character in the house's words; the notes explorer (Signature) |
| 2 | Can I try it before I buy a full bottle? | samples and the discovery set (FRAG-3), with price |
| 3 | Does the sample or discovery set money come off a bottle? | the discovery terms, in the house's words (amount, how long, how to use the code) |
| 4 | Which one is for me? I like X, I hate Y | the scent finder (FRAG-2), by notes, moods or places |
| 5 | What sizes are there and what do they cost? | library (FRAG-1): every size and price; sizes side by side (Starter extra) |
| 6 | How long does it last on skin? | only the house's own words, if it gives any; otherwise "try the sample first" (never hours we invent) |
| 7 | Is it for men or women? | the house's own wording (most say "for anyone"); no gender filter unless the client wants one |
| 8 | Can you engrave it? What, where, how much, how long? | engraving (FRAG-4): characters allowed, letter styles, bottle or box, price, days |
| 9 | Will you gift-wrap it and add a note? | wrapping (FRAG-4): options, price, card message |
| 10 | I'm buying for someone and don't know their taste | the gift options: discovery set, "let them choose" (Signature), gift card by Stripe link |
| 11 | When will it arrive? Next day? Before Christmas? | delivery (methods, prices, cut-offs) in the house's words; seasonal last-order dates from the client |
| 12 | Do you deliver abroad? | delivery; perfume ships under dangerous-goods rules, so the house states where it sends |
| 13 | Can I return it if I don't like it? | returns, in the house's words (usually unopened only; samples only if faulty) |
| 14 | Where is the boutique and when is it open? | Plan your visit: address, map, station, hours, open now |
| 15 | Can I just walk in, or book? | Plan your visit; consultation booking (FRAG-7) |
| 16 | Do you refill bottles? Which ones, where, how much? | refills (FRAG-8): which bottles, price, in store or by post |
| 17 | When will I need a refill? | refill reminder (.ics) chosen by the customer: a reminder, not a measurement |
| 18 | What's the difference between eau de parfum, extrait, cologne? | the house's own explanation on the fragrance page or journal |
| 19 | Can I layer two of yours? | layering guide: only pairings the perfumer names |
| 20 | Do you make bespoke perfume? Price and how many sessions? | bespoke page (FRAG-7): process, price from, how to request |
| 21 | Is there a consultation, and is it free or redeemable? | consultation booking (FRAG-7) with the house's terms |
| 22 | What's in it? Allergens? Vegan? Cruelty-free? | ingredients list and claims only as the client supplies them |
| 23 | Do you have home fragrance (candles, diffusers)? | home fragrance page |
| 24 | Is it in stock? Limited edition? | library stock flag from the client's sheet (stale sheet: no stock shown) |
| 25 | Can I see the bottle properly? | large product photography; the engraving preview shows the real bottle |
| 26 | Do you do weddings, corporate or bulk gifts? | weddings and corporate gifts page; enquiry on WhatsApp |
| 27 | How should I wear and store it? | journal (how to wear fragrance), storage line from the house (out of sun and heat) |
| 28 | Do you have events or masterclasses? | boutiques and events page with dates (.ics) |
| 29 | Who makes it? | the perfumer's notes page, in their words |
| 30 | Can I pay in instalments / with a gift card? | payment line in the house's words; gift card by the client's Stripe link |
| 31 | Is it the real thing? (bought elsewhere) | stockists list from the client |
| 32 | Can I buy a travel size? | sizes (FRAG-1) |

Notes for the build:
- The honesty line from the brief: notes and character only. No longevity hours, sillage scores, "lasts all day" or
  compliments claims unless the client supplies and stands behind them.
- Perfume is a regulated cosmetic: ingredient and allergen lists are the client's, copied from the box.

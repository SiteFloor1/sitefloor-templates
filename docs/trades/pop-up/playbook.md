# Pop-up shops and brand experiences: playbook

Who they are: a brand that takes a space for days or weeks (a launch, a tasting room, a sample sale, a touring
installation) and may move on to another city. Luxury brand-launch energy, never a market stall (that's `stalls`).
The site's job is the questions a post can't answer: **is it on now, until when, where exactly, can I book a time, and
when is it coming to me?** Owner's references: Veuve Clicquot, Clive Christian, Oribe (`docs/VISION.md`).

## Kit: `popup`

- **Starter:** the run (`popup-run`, POP-1): the dates, the place, the days left and one live line ("Open now, until
  9pm"), Directions and Add to calendar; Plan your visit.
- **Plus:** the rooms and how long a visit takes (`popup-rooms`, POP-7) and the experience page; the opening countdown
  and waitlist (`popup-waitlist`, POP-2); live Instagram (the shared `gallery` through Behold, POP-3); what's on
  (`popup-whats-on`); only here (`popup-only-here`, sold out from the brand's sheet); private hire and groups
  (`popup-hire`). A Plus site picks four pages.
- **Signature:** timed entry (`popup-slots`, POP-4) and the invitation (`popup-invite`); the queue now (`popup-line`);
  the tour with a map (`popup-tour`, POP-5); bring us to your city (`popup-city`, POP-6); past pop-ups (`popup-past`);
  press (`popup-press`) and collaborations (`popup-partners`), both client-only.

## Pages (approved)

1 Home · 2 What's on · 3 Visit · 4 Book a slot (`book`) · 5 Waitlist · 6 The experience · 7 Tour dates (`tour`) · 8 Press
· 9 Collaborations · 10 Past pop-ups (`past`) · 11 Only here · 12 Private hire and groups.

## Rules for this trade

- Dates and hours are the brand's own. Hours only count between a stop's first and last day; outside the run the
  site says closed, and after the last stop it says "Ended …".
- Timed entry only ever links to the brand's own booking page. Never "booked", "few left" or "selling fast".
- Waitlists and city requests go to the brand's own form or WhatsApp. No counts of people waiting, ever.
- Sold out and the queue come from the brand's own sheets and fail closed (old or unreadable: nothing shown).
- Press, collaborations and past-pop-up photos are only ever the brand's own; demos carry none of the first two.
- Prices are totals with every mandatory fee included (DMCC Act 2024, CMA drip-pricing guidance).
- Alcohol brands: `alcohol` puts "Please drink responsibly." and the Drinkaware link in the footer; the age policy is
  the brand's own, stated in its questions. Nothing on the page may appeal to under-18s.

## Demo

Chalden (Signature, the Capsule look): an English sparkling-wine house in Arch 14, Druid Street, London SE1, then
Manchester and Edinburgh; Bath has ended. Its stops and events are days from today (`popup.stops[].start`/`end`,
`programme.items[].date` as numbers), worked out on the build day and again in the visitor's browser, so the pop-up is
always on now; client sites are refused relative dates. The stock and queue sheets are simulated (`src/demo/`).

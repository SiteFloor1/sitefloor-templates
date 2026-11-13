# Guest quote

| | |
|---|---|
| Feature id | `guest-quote` |
| Plan | signature |
| Config | `guests`: `message` (WhatsApp opening), `text?`, `sizes` (2–4 design sizes, `{ id, name, minutes, price, photo }`: the artist's minutes and price per guest), `defaultSize?`, `start` (the count shown first), `max`, `perArtistMinutes` (how long one artist works on a night), `artists` (the most the business can bring), `note?`; heading in `sections.guests` |

## How it works
"And everyone else on the night." The count of guests in very large numerals with − and +, the design size as three
photos to choose from; the line works out how many artists and about how long (`guestPlan` in `lib/mehndi.js`:
guests × minutes, split across as few artists as fit in `perArtistMinutes`, rounded up to ten minutes) and a from
price (guests × the size's price). "Send this on WhatsApp" carries the count, the size, the price and the wedding
date if the bride picked one in the date check. More guests than the team can do in a night says "we'd plan it with
you" rather than promising.

## When something is missing or fails
Without JavaScript it shows the starting sum and the WhatsApp link for it. Every figure is the artist's; it's a from
price, never a booking.

Registered in `src/kits/mehndi/kit.js`. Add to a site by listing the id in `features` in its `site.json`.

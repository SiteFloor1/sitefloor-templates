# appointment (bridal kit, Starter)

The salon and the first appointment, answered before anyone asks: a photograph of the room (`room`, optional, with a
small `detail`), a line about it (`intro`), a card with the salon's own facts (length, guests, fee and whether it
comes off the gown, what to bring, when to order), and one "Request an appointment". It opens a quiet sheet (no
dropdowns on the page itself): the wedding date (day, month, year, always in UK order), how many are coming, when
suits, the designers to have ready and anything else, sent on WhatsApp (or the salon's booking app). Gowns kept on
the shortlist (Signature) join the request. Without JavaScript the link goes straight to WhatsApp.

```json
"appointment": {
  "message": "Hello Wexley, I'd like to book a first appointment.",
  "facts": [{ "label": "Length", "value": "90 minutes" }, { "label": "Guests", "value": "Up to three" }],
  "note": "Bring the shoes you plan to wear, or a pair of the same height.",
  "maxGuests": 3,
  "times": ["A weekday morning", "A weekday afternoon", "A Saturday"],
  "feeLink": "https://buy.stripe.com/… (optional: the salon's own Stripe Payment Link for the fee)",
  "intro": "One stylist, the fitting room and the people you bring. (optional)",
  "room": { "src": "img/salon.webp", "width": 1800, "height": 1200, "alt": "…", "caption": "…" },
  "detail": { "src": "img/salon-coupes.webp", "width": 800, "height": 1000, "alt": "…" }
}
```
Heading: `sections.appointment` (`kicker`, `title`). Every fact is the salon's; nothing here is "booked": the salon
replies to confirm.

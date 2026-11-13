# my-usual (hair kit, Plus)

"Keep as my usual" under the price by length: a returning client keeps their service, stylist level and length on
their own phone (`localStorage`, key `sf-hair-usual`). Next time the price opens on it, and the WhatsApp button sends
the same message, so rebooking is one tap. Nothing leaves the phone and the salon sees nothing until the message.
The button and the logic live in `length-price` (`[data-lp-usual]`); this feature only switches them on.

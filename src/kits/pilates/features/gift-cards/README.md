# Gift class cards

| | |
|---|---|
| Feature id | `gift-cards` |
| Plan | plus and above |
| Config | `giftCards`: `items` (one to four `{ id, name, text, price?, payLink }`), `message` (the WhatsApp opening line), `howItWorks` (how the studio hands the card over); `sections.giftCards` |
| Files | `gift-cards.njk`, `.js`, `.css` |

## How it works
Choose a card (three classes, a private session…), write who it's for, who it's from and a line; the card updates as
you type. "Pay by card" opens that card's Stripe Payment Link; "Send the details on WhatsApp" sends the studio the
card and the words, so they can write it and hand it over. The site keeps nothing.

## When something is missing or fails
Without JavaScript Pay opens the first card's link and WhatsApp opens with the opening line only.

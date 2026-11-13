# Feature: the-card (jeweller, Signature)

"The gift, arranged", on each occasion's page: choose the piece (from the occasion's own), the day it's needed, a name,
and write the card that goes in the box. The house's card, with its monogram, takes the words as they're typed. It's
sent on WhatsApp as a request: the house replies to say it can be ready, and how to pay. Nothing is ordered here.

- **Config:** `giftNote: { line, max, sample? }`: the house's line, the most letters its card takes (20–300) and,
  optionally, words shown faintly on the card until the customer types (the client's own).
- **Needs:** `occasions` with `occasions.pages`. **No JavaScript:** a plain WhatsApp link.
- **Words:** `giftText()` in `src/kits/jeweller/lib/messages.js` (unit-tested).

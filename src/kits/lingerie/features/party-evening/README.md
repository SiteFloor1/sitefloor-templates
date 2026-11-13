# Bridal party evening

| | |
|---|---|
| Feature id | `party-evening` |
| Plan | signature |
| Kit | lingerie |
| Needs | `private-evening` (it offers the same free evenings, from the same sheet) |
| Config | `bridalParty`: `{ minutes, partyMax, note, photo, deposit? }` |
| Files | `party-evening.njk`, `party-evening.css`, `party-evening.js`; message in `src/kits/lingerie/lib/evenings.js` (`partyText`) |

```json
"bridalParty": {
  "minutes": 120, "partyMax": 8,
  "note": "The salon closes for the bride and her party.",
  "photo": { "src": "img/party.webp", "width": 900, "height": 1404, "alt": "…" },
  "deposit": { "amount": 150, "payLink": "party-deposit", "note": "taken off what you buy" }
}
```

## How it works
The bride chooses one of the shop's free evenings (the same list as the private evening: whatever the sheet marks
`free`), how many of them come (2 to `partyMax`, her included), the wedding date and their names. The button opens
WhatsApp with all of it; the shop confirms. The deposit, if set, is the shop's own Stripe Payment Link. Shown on the
Bridal page when the site has it, otherwise on the home page.

## When something is missing or fails
If the sheet can't be read or is older than `evenings.staleAfterHours`, no evenings show and it says to message the
shop. Without JavaScript, the button asks for an evening on WhatsApp. Nothing is booked by the site.

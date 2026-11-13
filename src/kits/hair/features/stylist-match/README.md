# stylist-match (hair kit, Signature)

Stylist match, on the stylists page: three answers (what we're doing, from `match.doing`; the hair, from the
textures; the first free chair or the most experience) lead to one stylist. A stylist must do the service; a texture
narrows it to stylists who list it (if none does, it falls back to everyone who does the service); then the first free
day (from the stylists' sheet) or the most senior level wins, ties going to the salon's own order. The match shows with
their work, level, line and next free day, and "Book Ines" on WhatsApp. It first paints with the first answers and
their match. The rule is in `lib/hair.js` (`matchStylist`), with unit tests.

```json
"match": { "doing": [{ "id": "cuts", "name": "A new cut" }, { "id": "colour", "name": "Colour" }] }
```
Heading: `sections.match`.

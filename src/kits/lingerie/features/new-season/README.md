# new-season (lingerie kit, Starter)

The newest pieces (`"newSeason": true` on a piece) as a row of photographs on models. Each card names the piece
**Collection · Style · Colour**, shows a swatch for every colour it comes in and the shop's price. On Signature the
photograph opens the piece's page; with the tray or hints on, the card carries those quiet actions.

Pieces and collections (shared by every lingerie feature):
```json
"collections": [{ "id": "calloway", "name": "Calloway", "line": "Black Leavers lace…", "colours": [{ "id": "noir", "name": "Noir", "hex": "#141012" }], "cover": { "src": "img/…", "width": 900, "height": 1200, "alt": "…" } }],
"pieces": [{ "id": "calloway-body", "collection": "calloway", "style": "Body", "colour": "noir", "colours": ["noir", "smoke"], "price": 320, "category": "bodies", "photo": { … }, "sizes": "30–38 band, A–G cup", "fit": "Firm band; between sizes, size up.", "newSeason": true }]
```
Heading: `sections.newSeason`. Prices and sizes are the shop's own.

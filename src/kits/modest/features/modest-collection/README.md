# modest-collection (Starter)

The collection (MOD-1) with the model line (MOD-13): every piece in `pieces.items` that has a photograph, large, with
its one line, price and the lengths it comes in; under the photograph, what the model wears ("Shown in the 58." or,
when the shop gives it, "Model 5′7″, wears the 56, in flats."). Each piece has Order on WhatsApp. Section heading:
`sections.collection`. With `modest-category-pages` on, each part of the collection is named below with its page.

```json
"pieces": {
  "categories": [{ "id": "abayas", "name": "Abayas", "page": { "title": "Abayas", "intro": "…" } }],
  "items": [{ "id": "layl", "name": "The Layl", "category": "abayas", "line": "Fringed organza over black satin.", "price": 345,
    "lengths": [54, 56, 58, 60], "photo": { "src": "img/layl.webp", "width": 900, "height": 1350, "alt": "…" },
    "model": { "wears": 58, "height": "5′7″", "shoes": "flats" }, "eid": true }]
}
```

- `lengths` must be lengths the shop sells (`lengths.sizes`). `model.height` only from the shop: never guessed from a photo.
- `eid: true` puts the piece in the Eid edit (`modest-family`).
- No stock is claimed: "lengths it comes in", not "in stock".

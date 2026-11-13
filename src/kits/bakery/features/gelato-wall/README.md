# gelato-wall (bakery kit, Starter)

The shop's gelato as a row of tubs, from its own photos, with a ticket under each and the scoop prices above. It
reads the same Google Sheet as today's counter: a `gelato` row marks a flavour for today.

```
kind,item,status,note,updated_at
gelato,pistachio,sold out,,2026-10-29 16:10
gelato,raspberry,low,,2026-10-29 17:40
```
- `sold out`: the tub stays on the wall, dimmed, with **Back tomorrow** (it never just vanishes).
- `low`: **A few left**. Anything else, or no row: nothing marked.
- Rows from another day are ignored; an unreadable sheet marks nothing (fails closed).

## Config (`site.gelato`)
```json
"gelato": {
  "prices": [4.2, 5.9, 7.4],
  "note": "Churned every morning.",
  "flavours": [
    { "id": "pistachio", "name": "Pistachio", "note": "Sicilian", "allergens": ["milk", "nuts"], "diets": ["eggless"],
      "photo": { "src": "img/g-pistachio.webp", "width": 720, "height": 960, "alt": "Pistachio gelato with chopped pistachios" } }
  ]
}
```
- `prices`: one, two, three (up to four) scoops, each more than the last.
- Photos: each tub from above, the same light for every tub, 3:4, about 720 × 960.

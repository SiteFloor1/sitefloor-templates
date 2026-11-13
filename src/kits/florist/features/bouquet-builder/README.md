# bouquet-builder (florist kit, Signature, page `build`)

Build a bouquet from real stems: choose a palette and a size and see the florist's own photograph of that bouquet
with its price, never a drawing. When a size hasn't been photographed in that palette, the nearest one in the same
palette shows with a plain note. Every palette must have at least one photograph. Ordered on WhatsApp.

```json
"builder": { "title": "Build a bouquet", "intro": "…", "message": "Hello <your shop>, I'd like this bouquet:",
  "palettes": [{ "id": "coral", "label": "Coral", "colour": "#E0725C" }],
  "sizes": [{ "id": "medium", "label": "Medium", "price": 65 }],
  "bouquets": [{ "id": "coral-m", "palette": "coral", "size": "medium", "photo": { … } }] }
```

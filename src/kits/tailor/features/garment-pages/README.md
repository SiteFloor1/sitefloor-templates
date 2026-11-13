# garment-pages (tailor kit, Plus, a generated collection: one page per garment)

Suits, overcoats, shirts, dinner suits… one page each, counted as one page. Each: the garment's photograph (4:5), the
house's words, its details, the "from" price from `garments` (by `garment` id), the cloths it's often made in (from
the cloth book) and the way to a first appointment and the specification card.

```json
"garmentPages": { "items": [{ "slug": "suits", "kicker": "Bespoke", "title": "Suits", "intro": "…", "description": "…",
  "garment": "suit", "photo": { … }, "body": "Para.\n\nPara.", "details": [{ "label": "Fittings", "value": "…" }], "cloths": ["midnight"] }] }
```
Slugs are lowercase words and dashes and may not reuse another page's name. Words and figures are the house's own.

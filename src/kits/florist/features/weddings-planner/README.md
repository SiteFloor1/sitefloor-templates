# weddings-planner (florist kit, Signature, page `weddings`)

Weddings and events: the florist's pieces in their own photographs with starting prices; a date check that only
uses the florist's own `taken` dates and `minWeeks` notice (any other date is "ask and we'll confirm", never "free");
a consultation request on WhatsApp with the date and place; and palette from a swatch, a WhatsApp request where the
couple sends a photo of their fabric and the florist replies with stems for that month (no automatic matching).

```json
"weddings": { "title": "Weddings and events", "intro": "…", "minWeeks": 16, "taken": ["2027-06-12"], "photo": { … },
  "pieces": [{ "id": "bouquet", "title": "The bouquet", "line": "…", "from": 180, "photo": { … } }],
  "consult": { "title": "Your date", "text": "…", "message": "Hello <your shop>, we're planning a wedding." },
  "swatch": { "title": "Palette from a swatch", "text": "…", "message": "Hello <your shop>, here's a photo of our fabric…" } }
```

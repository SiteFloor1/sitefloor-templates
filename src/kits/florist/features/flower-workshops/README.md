# flower-workshops (florist kit, Signature, page `workshops`)

Workshops: each date with what you make and take home, the time and length, the price and the places left, booked by
its own Stripe Payment Link. A full workshop shows "Full" and no button. Past dates drop off at the next build and,
until then, in the browser. With `studioSheet.source: "sheet"`, rows `workshop,<id>,<places left>` keep the count
live (a nonsense value keeps the built count).

```json
"workshops": { "title": "Workshops", "intro": "…", "none": "No dates just now…",
  "items": [{ "id": "wreath-dec", "title": "The winter wreath", "text": "…", "date": "2026-12-05", "start": "10:30", "minutes": 150,
    "price": 95, "places": 8, "left": 3, "payLink": "https://buy.stripe.com/…", "photo": { … } }] }
```

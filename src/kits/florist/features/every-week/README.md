# every-week (florist kit, Plus, page `every-week`)

Flowers every week, fortnight or month: the florist's plans with their prices, each started by its own Stripe Payment
Link (a subscription link from the florist's Stripe), and how pausing, skipping and changing work, in their words.
Gift a season moves here from the home page when both are on.

```json
"everyWeek": { "title": "Flowers every week", "intro": "…", "photo": { … },
  "plans": [{ "id": "weekly", "label": "Every week", "price": 55, "every": "week", "line": "…", "payLink": "https://buy.stripe.com/…" }],
  "how": [{ "q": "Can I pause?", "a": "…" }] }
```

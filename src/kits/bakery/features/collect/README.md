# Feature: collect (bakery kit, Plus)

Collection request: the items marked `"takeaway": true` with − / + for each, a running total and the allergens in the
order, a day and a time (every `step` minutes within opening hours, from now plus `prepMinutes`, past midnight when the
shop opens late), the visitor's name; sent on WhatsApp for the shop to confirm. A plain WhatsApp link without JavaScript.

```json
"collect": { "prepMinutes": 20, "step": 15, "daysAhead": 3, "note": "Pay when you collect." }
```

Heading: `sections.collect`.

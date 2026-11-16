# trainer-prices (Plus, page `prices`)

The price list: single sessions and blocks, what each session works out at (rounded to the pound; the trainer's own
block prices are never changed), how long a block lasts, and the trainer's own Stripe Payment Link per block. If any
block has a `duo` price, a switch shows the price per person for two. The twelve weeks (`trainer-timeline`) and the
shared `vouchers` live on this page when it's on.

```json
"pricesPage": {
  "title": "Prices", "intro": "…",
  "blocks": [{ "sessions": 10, "price": 1100, "duo": 1500, "useWithin": "16 weeks", "payLink": "https://buy.stripe.com/…" }],
  "note": "…"
}
```

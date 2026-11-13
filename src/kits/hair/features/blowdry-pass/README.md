# blowdry-pass (hair kit, Plus)

A pack of visits for one price (for example five blow-dries), bought on the salon's own Stripe Payment Link. The
salon keeps count at the desk; the site only shows the offer and the link. The Length look shows it on the services
page (look.json `onPages`, `hair-services`); without that page it sits on the home page.

```json
"pass": { "service": "blowdry", "name": "blow-dry", "visits": 5, "price": 220, "months": 6,
  "for": "Any length, with a stylist.", "stripeUrl": "https://buy.stripe.com/…", "note": "We keep count at the desk." },
"sections": { "pass": { "title": "The blow-dry pass." } }
```

| Setting | Rule |
|---|---|
| `service` | a service id from the menu |
| `visits` | 2 to 20 |
| `price` | whole pounds, the salon's own |
| `months` | optional, 1 to 24 |
| `for` | who and what it covers, in the salon's words |
| `stripeUrl` | `https://buy.stripe.com/…` (a `test_` link only on a demo) |

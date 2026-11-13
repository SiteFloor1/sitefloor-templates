# A box a month (Plus)

A gift subscription the shop runs through its own Stripe account: it makes a Payment Link for a monthly subscription
in Stripe and adds it to `payLinks` with `"kind": "monthly"`. Sitefloor takes no payment and adds no fee.

```json
"boxMonth": { "price": 24, "payLink": "box-month", "what": "Twelve of the month's chocolates, ready from the 1st.", "note": "Message us to pause or stop." }
```

Needs `pay-link`. Write the note to match how the shop handles changes; the page says nothing it doesn't do.

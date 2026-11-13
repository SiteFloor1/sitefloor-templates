# preorders (lingerie kit, Plus)

For online brands: pieces that aren't made yet, each with when it ships and the brand's own Stripe Payment Link (a
deposit or the full price). Without a link, the pre-order goes on WhatsApp. Payment is taken on Stripe's own page.

```json
"pieces": [{ …, "preorder": { "ships": "early December", "payLink": "seraphine-robe" } }],
"payLinks": { "note": "…", "items": [{ "id": "seraphine-robe", "label": "…", "amount": 120, "kind": "deposit", "url": "https://buy.stripe.com/…" }] }
```
Heading: `sections.preorders`.

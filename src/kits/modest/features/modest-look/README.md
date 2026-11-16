# modest-look (Signature)

Complete the look (MOD-6), its own page (`/the-look`), and the look bar on every page. Each of the shop's sets: its
photograph (or the abaya's), the abaya with her length (opening on the hem line's answer), the pieces she may add,
and one total. "Send this look" opens WhatsApp with the whole look and the total. With `pay-link` on, a set can carry
the shop's own Stripe Payment Link (`payLink`, an id from `payLinks.items`, its amount the set as shown): Payment
Links have fixed amounts, so the button only shows while her total matches it; with extras she sends it instead.

The look's phone bar carries the first set and its total on every page ("Your look · The Layl, 58 · Long jersey hijab ·
£373 · Complete the look"); the hem line sets its length and this page its pieces.

```json
"looks": { "intro": "…", "sets": [{ "id": "layl-set", "name": "The Layl, complete", "line": "…",
  "items": [{ "piece": "layl" }, { "piece": "jersey-hijab" }, { "piece": "slip", "optional": true }], "payLink": "layl-set" }] }
```

- The first item is the abaya (a piece with lengths) and can't be optional.
- With a Stripe link, set up a "Length" custom field on the link in Stripe, so her length comes with the payment.

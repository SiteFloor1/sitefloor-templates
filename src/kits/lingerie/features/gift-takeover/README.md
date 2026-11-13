# Gift takeover (Valentine's, Christmas)

| | |
|---|---|
| Feature id | `gift-takeover` |
| Plan | plus |
| Kit | lingerie |
| Config | `takeovers`: list of `{ id: "valentines" or "christmas", name, from, to, title, line?, photo, orderBy, collectBy?, wrap?, edits }` |
| Files | `gift-takeover.njk`, `gift-takeover.css`, `gift-takeover.js`; dates in `src/kits/lingerie/lib/takeover.js` |

```json
"takeovers": [{
  "id": "valentines", "name": "Valentine's", "from": "2027-01-25", "to": "2027-02-14",
  "title": "Something to unwrap twice.", "line": "Tied in oxblood, with a card in your words.",
  "photo": { "src": "img/valentine.webp", "width": 1200, "height": 1800, "alt": "…" },
  "orderBy": "2027-02-11T16:00", "collectBy": "2027-02-14T17:00", "wrap": true,
  "edits": [{ "label": "To give her", "pieces": ["calloway-body", "vesna-belt"] }]
}]
```

## How it works
Between `from` and `to` (the shop's dates), the takeover replaces the home page's opening: the campaign photograph in
the signature colour, the line, and "N days left to order for delivery" counting down to `orderBy` (shop wall-clock
time). A boutique adds `collectBy`: after `orderBy` it says delivery has closed and she can still collect until then.
After the last time it switches off without a rebuild. Each edit lists pieces by name, colour and price (no second
photograph of pieces the page already shows), each with a hint button; then Tell us about her and the gift concierge.
`wrap: true` adds the shop's gift-wrap line. The shop's own words go in `title` and `line`; the times are the shop's
promise, so set them from its courier's cut-off.

## When something is missing or fails
Without JavaScript, the takeover that was on when the site was built shows, with its order-by times as written. Two
takeovers can't overlap (validated); each lasts at most 60 days. On a demo, the strip's season switch previews each.

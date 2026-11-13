# make-this (florist kit, Starter)

"Can you make this one?" The customer pastes a link to a TikTok, Instagram or Pinterest post, chooses a budget and a
day, and one WhatsApp message goes to the florist with all three. Any other link is refused (checked by host in
`lib/social.js`, `postLink`); tracking queries are stripped. Nothing is fetched, previewed or stored.

```json
"makeThis": {
  "title": "Seen it somewhere? Send the link.",
  "intro": "TikTok, Instagram or Pinterest. We'll reply with what we can make for your budget and day.",
  "message": "Hi <your shop>, can you do this one?",
  "budgets": ["£30", "£45", "£60", "£80+"],
  "photo": { "src": "img/make.webp", "width": 800, "height": 1000, "alt": "…" }
}
```

Home part: `make-this` (in `home.js`). Without JavaScript a plain WhatsApp link asks the same question.

**Markup:** each look lays this feature out itself (`src/looks/<look>/features/`); the kit's template is empty and
`src/kits/florist/looks.js` refuses the feature on a look that hasn't designed it (today: Tissue only).

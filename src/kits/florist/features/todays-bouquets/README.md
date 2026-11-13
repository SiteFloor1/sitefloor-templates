# todays-bouquets (florist kit, Starter)

The home page as the florist's own feed, for florists who sell on Instagram and TikTok. One to three ranges (fresh,
forever) switch what shows; an optional pinned post comes first (a still, or a short muted clip that can be paused and
stays still when the visitor asks for less motion). Every bouquet has its photo, its price and what's left.

"Ask for this one" opens the order: the day, the card (held to the florist's length), any add-ons at their prices, and
the words the florist will get. It goes on WhatsApp, or (with `instagram` set) is copied for an Instagram DM, because
Instagram's DM link can't carry text; the page says so. Without JavaScript every Ask opens WhatsApp with that bouquet.

What's left comes from the studio Sheet: rows `bouquet,<id>,few:2` (or `2`), `sold`, `available` or `hidden`, plus
`bouquet,updated,<time>` (or `=NOW()` in that cell). A count (1–99) or "sold" is only shown while that time is within
`staleMinutes` (default 180); stale, missing or out-of-range values show nothing, so "2 left" never lingers. `hidden`
always hides. A client's site.json can't set `status` or `left` (a demo may, for its example); the id `updated` is
reserved.

**Markup:** each look lays this feature out itself (`src/looks/<look>/features/todays-bouquets.njk`); the kit's template
is empty and `src/kits/florist/looks.js` refuses the feature on a look that hasn't designed it (today: Tissue only).

```json
"bouquets": {
  "message": "Hi <your shop>, I'd like",
  "instagram": "<handle>",
  "ranges": [{ "id": "fresh", "label": "Fresh", "line": "Delivered today" }, { "id": "forever", "label": "Forever", "line": "Posted UK-wide" }],
  "pinned": { "name": "…", "priceFrom": 35, "photo": { … }, "video": "img/pinned.mp4" },
  "items": [{ "id": "just-peonies", "range": "fresh", "name": "Just peonies", "price": 55, "photo": { … } }],
  "staleMinutes": 180,
  "addOns": [{ "id": "card", "name": "A handwritten card", "price": 3 }],
  "card": { "max": 160 }
}
```

With `same-day` on, its line and postcode check sit above the feed.

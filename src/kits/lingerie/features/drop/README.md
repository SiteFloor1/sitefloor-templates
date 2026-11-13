# drop (lingerie kit, Plus)

For online brands: the next collection with its photograph, a countdown to the brand's own time (the shop's time zone,
"UK time" said on the page), and the waitlist (a Google Form, or a WhatsApp line). While it's live the button becomes
*Shop {name}* (the brand's own shop, `shop.shopUrl`); after `ends` it says it has ended. The second hand stops for
visitors who ask for reduced motion (it then moves once a minute).

```json
"drop": { "name": "Seraphine", "at": "2026-11-20T19:00", "ends": "2026-11-23T23:59", "line": "…", "photo": { … }, "waitlist": { "formUrl": "https://docs.google.com/forms/d/e/…/viewform" } }
```
Heading: `sections.drop` (its title is the small label). Logic: `src/kits/lingerie/lib/drop.js`.

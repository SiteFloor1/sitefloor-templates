# private-fitting (lingerie kit, Starter)

The private fitting request: what it's for (the shop's own kinds, e.g. Everyday, Bridal, Fuller bust), a day (the
next fortnight's open days from the shop's hours), a time of day, guests up to the shop's limit, a first name, and the
pieces she put on the tray (Plus). Sent on WhatsApp; the shop confirms. Online brands (`shop.mode` "online") ask for a
video fitting instead. Without JavaScript, a plain WhatsApp link.

```json
"fitting": { "minutes": 45, "price": 0, "kinds": ["Everyday", "Bridal", "Fuller bust"], "times": ["Morning", "Afternoon", "After six"], "guestsMax": 1, "note": "…", "video": { "minutes": 15, "note": "…" } }
```
Heading: `sections.fitting`. Message: `fittingText` in `src/kits/lingerie/lib/fit.js`.

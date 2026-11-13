# chairs-today (hair kit, Signature)

Chairs free today: the blow-dry and walk-in slots the salon puts on its published Google Sheet through the day, up to
three, soonest first, each with the stylist, the "from" price at that stylist's level, and "Ask for 14:30" on WhatsApp
("if it's still free"; never "booked"). Fails closed, row by row (`chairsFromCsv` in `lib/hair.js`, with tests): a row
updated on another day or later than now, a slot already started or outside today's opening hours, or a service or
stylist the salon hasn't listed is left out; with nothing left the box says to ask on WhatsApp. It re-checks every five
minutes. The box keeps three rows' height, so nothing moves.

```json
"chairs": { "message": "Hello …", "source": "sheet", "csvUrl": "https://docs.google.com/spreadsheets/d/e/…/pub?…output=csv",
  "services": [{ "id": "blow-dry", "name": "Blow-dry", "service": "blowdry" }, { "id": "walk-in-cut", "name": "Walk-in cut", "service": "cut" }],
  "note": "Updated by the front desk through the day." }
```
The sheet: a header row, then `service` (an id above), `time` (14:30), `stylist` (a stylist id), `updated`
(2026-11-12 09:40). `service` on each points at the menu, for the price. The demo simulates three slots after now
(`src/demo/chairs-provider.js`). Heading: `sections.chairs`.

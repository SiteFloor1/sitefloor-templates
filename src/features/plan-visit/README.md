# Plan your visit (page)

| | |
|---|---|
| Feature id | `plan-visit` |
| Plan | every plan, free: doesn't count towards the page limit |
| Config | `visitInfo` (below); uses `questions`, `hours`, `location` |
| Files | `plan-visit.njk`, `plan-visit.css`, `plan-visit.js`; logic in `src/core/lib/arrival.js`; page template `src/core/pages/visit.njk` |

Works for any business people visit: shop, salon, restaurant, garage, studio.

```json
"visitInfo": {
  "kicker": "Plan your visit", "title": "Before you|come in*.*", "intro": "…", "checked": "2026-10",
  "journeys": [
    { "mode": "walk", "from": "Leeds station", "origin": "Leeds railway station, Leeds", "minutes": 10,
      "steps": ["Leave by the New Station Street exit…", "…"] },
    { "mode": "bus", "from": "Buses 1, 4 or 16", "stop": "Kirkgate Market", "minutes": 2, "steps": ["…"] }
  ],
  "parking": [
    { "name": "Call Lane pay and display", "walk": 2, "price": "£2.40 an hour", "note": "Up to 3 hours.",
      "paid": { "mon": [["08:00", "18:00"]], "sat": [["08:00", "18:00"]] }, "bankHolidays": "sunday" },
    { "name": "Market multi-storey", "walk": 4, "price": "from £4", "paid": "always",
      "open": { "mon": [["07:00", "20:00"]], "sun": [["10:00", "17:00"]] } }
  ],
  "access": [{ "label": "Step-free entrance", "yes": true }, { "label": "Accessible toilet", "yes": false }],
  "accessNote": "…",
  "payment": "Card, Apple Pay, Google Pay and cash."
}
```

## How it works
- **Arrival board** at the top: the shop's live open/closed line, each car park's live status, and each journey's time.
- **Live parking**: `paid` holds the hours you pay, written like opening hours (days you don't list are free; overnight works; `["00:00","00:00"]` is all day). The page says "Paid until 6pm · £2.40 an hour" or "Free now · charges from 8am tomorrow" for the moment someone looks. `"always"` and `"never"` cover the simple cases.
  - `bankHolidays` (required with a schedule): `"sunday"` (charged like Sundays, the usual council rule), `"normal"` or `"free"`. Bank holidays are worked out for England and Wales, Scotland or Northern Ireland from the postcode (`location.region` overrides). One-off holidays go in `exceptions: [{ "date": "2027-…", "ranges": [] }]`.
  - `open` (optional): the car park's own opening hours. Outside them it says "Closed now · opens 7am tomorrow".
  - `closures` (optional): `{ "bankHolidays": true, "dates": ["2026-12-25"] }`, days the car park is shut. Unknown settings on a car park are refused, so a typo can't be ignored silently.
  - Each card also shows the charging times as a line built from `paid` ("Charges Mon–Sat 8am–6pm · free on Sundays and bank holidays"), so the page works without JavaScript and the times are written down once.
- **Checked date**: `checked` is the month the journeys, parking and access were confirmed with the business. Required on client sites, shown under the board ("checked with … in October 2026"). Driving times read "about 8 min drive, outside rush hour".
- **Journeys** (walk, bus, train, tram, car, bike): one tab each (arrow keys move between them), drawn as a route ending at the door, with "Directions in Google Maps" in that mode (from `origin` if given, otherwise from wherever the visitor is). For bus, train and tram, `minutes` is the walk from the stop.
- **Leave-by helper**: the visitor picks their appointment time; each journey says when to set off (5 minutes spare).
- **Access** as a yes/no checklist; **paying**; then opening hours and every question by topic.

No map is embedded (no cookies or third-party scripts); directions open in Google Maps.

## When something is missing or fails
Sections only appear for the details given. Without JavaScript all journeys are listed in full (as plain sections, not tabs), the board shows the fixed details, each car park shows its charging line, and the leave-by helper is hidden. The client template leaves every fact (times, walks, charges, access answers) as a placeholder the build rejects, so nothing ships unchecked.

Registered in `src/features/registry.js`. Add to a site by listing the id in `features` in its `site.json`.

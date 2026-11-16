# The visit, room by room (cleaning kit, Plus)

The cleaning kit's showpiece: each room as wide as its minutes on a ruler, a hairline for every minute inside it, the
line above it saying what it shows ("A two-bedroom home with two bathrooms, fortnightly: 2 h 25, £60. Change it to
yours."), and the bedrooms, bathrooms and how-often controls beside that line. Tap a room for its tasks and what isn't
included. On a phone it runs downward, each room as tall as its minutes.

Every figure comes from `visit()` in `src/kits/cleaning/lib/visit.js`: the rooms' minutes add up to the total, the
price is worked out once from the minutes charged (the total, or the shortest visit) at the hourly rate and rounded once
to whole pounds, and one formatter writes each ("2 h 25", "£60"). The page is rendered for `visit.defaults` before any
script runs, so the figures are right without JavaScript. The choice is shared with the bill (`cleaningVisit`).

```json
"visit": {
  "rates": { "week": 24, "fortnight": 25, "once": 30 }, "minimum": 120, "deep": 1.5,
  "rooms": {
    "kitchen": { "name": "Kitchen and living", "min": 45, "tasks": ["…"], "not": "Inside the oven and fridge are extras" },
    "hall": { "name": "Hall and stairs", "min": 10, "tasks": ["…"] },
    "bed": { "name": "Bedroom", "min": 20, "extraMin": 15, "tasks": ["…"] },
    "bath": { "name": "Bathroom", "min": 30, "extraMin": 25, "tasks": ["…"] }
  },
  "extras": [{ "id": "oven", "name": "Inside the oven", "min": 60 }, { "id": "linen", "name": "Fresh bed linen, each bed", "min": 10, "perBed": true }],
  "defaults": { "beds": 2, "baths": 2, "freq": "fortnight" }
}
```

The look places it (Plumb: attached to the hero photograph's lower edge, so the first screen shows the photograph, the
word "cleaning" and the strip).

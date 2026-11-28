# What's on (`popup-whats-on`, Plus, page `whats-on`)

The pop-up's dated programme: a launch night, a talk, a tasting. Each with its day, times, total price (every mandatory
fee included; `0` shows "Free") and a booking link. Past events are left out at build time and hidden again in the
browser for the visitor's day.

```json
"programme": { "title": "What's on", "empty": "Nothing extra this week: the pop-up is open as usual.",
  "items": [{ "id": "launch", "title": "Launch night", "date": "2027-01-09", "from": "18:00", "to": "21:00",
    "line": "…", "price": 25, "bookUrl": "https://…" }] }
```

A demo gives `date` as days from today, so its events are always ahead.

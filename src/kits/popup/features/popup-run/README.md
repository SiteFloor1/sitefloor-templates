# The run (`popup-run`, Starter)

The dates, the place and the days left, and one live line on whether to go, worked out from the brand's own dates and
hours in UK time: "Open now, until 9pm", "Opens at 11am today", "Closed now. Opens tomorrow at 11am", "Opens 9 January",
"Ended 9 December". Directions (a maps search) and Add to calendar (the whole run as an all-day entry, made in the
browser, nothing stored). It sits in the look's hero.

```json
"popup": {
  "line": "Cuvée No. 3, poured here first",
  "stops": [
    { "id": "london", "city": "London", "place": "Arch 14, Druid Street", "area": "London", "postcode": "SE1 2HQ",
      "start": "2027-01-09", "end": "2027-01-30", "lat": 51.502, "lon": -0.079 }
  ]
}
```

- The stop shown is the one on now, else the next to open, else the last to end. Opening hours are the site's `hours`;
  they only count between `start` and `end`. Outside the run, the header's open/closed chip says closed.
- A demo gives `start` and `end` as days from today (`-6`, `13`), so its pop-up is always on; a client site is refused
  them and gives dates. `popup-tour`, `popup-past` and `popup-waitlist` read the same stops.

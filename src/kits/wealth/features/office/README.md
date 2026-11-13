# Our office (Starter)

The deep band: the address (from `site.location`), the time at the office now and whether it is open (from
`site.hours`, refreshed every minute), plain facts, and a photograph of the door. Without scripts the week's hours
show instead of the clock. The first office is the one in `site.location`; any others carry their own address,
time zone and hours and show as rows with their own time now (the five-office version is optional).

```json
"offices": { "items": [
  { "id": "london", "name": "London", "facts": [{ "label": "Hours", "text": "…" }], "photo": { … }, "arrival": ["…"] },
  { "id": "geneva", "name": "Geneva", "streetAddress", "locality", "country": "CH", "timezone": "Europe/Zurich", "weekly": { "mon": [["08:30","18:00"]], … }, "facts": [ … ] }
] }
```

Uses tokens `--band`, `--on-band`, `--band-muted`, `--band-line`, `--band-accent` from the look.

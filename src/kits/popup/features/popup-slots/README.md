# Timed entry (`popup-slots`, Signature, page `book`)

Pick a day of the run, then a time. Times come from the opening hours: every `every` minutes from opening, the last one
`lastBefore` minutes before closing; on today, times already gone are dropped. Each time is a link to the brand's own
booking page (Eventbrite, Fatsoma, Resy, Fresha, Calendly…), with `{date}` ("2027-01-09") and `{time}` ("15:30") filled
in where the brand's link takes them.

```json
"slots": { "title": "Pick a time", "intro": "Entry is free with a time.", "every": 30, "lastBefore": 60,
  "url": "https://www.eventbrite.co.uk/e/…?date={date}&time={time}", "note": "…", "photo": { … } }
```

It never says booked, full or few left: only the booking page knows. `popup-invite` adds the invitation card.

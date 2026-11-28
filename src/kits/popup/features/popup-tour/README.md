# The tour (`popup-tour`, Signature, page `tour`)

Every stop in `popup.stops` as a ticket and as a mark on a map of Britain (outline from Natural Earth, public domain,
drawn as SVG; no map service, no requests). Each carries its own state for the visitor's day: on now (with the days
left), opens in N days, or ended. Choosing one shows its place and dates and what to do: book a time and add it to the
calendar (on now), be told when it opens (soon), or see how it looked (ended, with `popup-past`).

```json
"tourPage": { "title": "Tour dates", "intro": "…" }
```

Future stops appear only once the brand has confirmed their dates; there is no "date to come" placeholder on the map.

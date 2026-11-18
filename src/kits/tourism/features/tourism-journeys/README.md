# tourism-journeys (Starter)

The journeys (TOUR-1), a home section: every journey as one row with its photograph, name, line, where, nights,
the months the operator would go ("best Oct–Mar") and, only if the operator publishes one, their "from" price per
person. "Ask about it" opens WhatsApp (or the booking link) with the journey named. With `tourism-logbook` on, the name
opens the journey day by day; with `tourism-shortlist` on, each row has Keep.

Heading: `sections.journeys` (say in `intro` what the prices include, in the operator's words).

```json
"journeys": { "items": [{
  "id": "desert-to-ice", "name": "Desert to ice", "country": "CHL", "where": "Chile", "nights": 11, "from": 8900,
  "line": "The Atacama's salt flats, then south to the towers of Torres del Paine.",
  "go": [1, 2, 3, 10, 11, 12], "who": ["couple", "friends", "solo"],
  "photo": { "src": "img/paine.webp", "width": 1600, "height": 2000, "alt": "…", "small": { "src": "img/paine-600.webp", "width": 600 } },
  "stops": [{ "days": "Days 1–4", "place": "San Pedro de Atacama", "text": "…", "lat": -22.91, "lon": -68.2, "tz": "America/Santiago" }],
  "via": [{ "name": "Santiago", "lat": -33.45, "lon": -70.67, "before": 1 }]
}] }
```

- `country`: ISO 3166 three-letter code; the logbook draws that country (Natural Earth outline, `data/`).
- `go`: months 1–12 the operator would choose; `who`: couple, family, friends, solo (the year drawn filters on both).
- `from` is optional and never worked out by us. `via`: places the route passes through without a stop (flights).

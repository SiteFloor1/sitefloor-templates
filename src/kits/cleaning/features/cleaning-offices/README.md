# Offices, out of hours (cleaning kit, Signature page)

The `offices` page: drag your opening and closing time (or use the arrow keys), choose mornings or evenings, count your
desks and washrooms; the night's minutes come from the company's own per-zone minutes, the team's window is drawn
against your day ("You open at 08:00. We're in from 05:55 and gone by 07:45."), and "Ask for a site survey" sends it all
on WhatsApp. Offices are priced after a survey: `offices.rate` is refused.

```json
"offices": { "title": "Offices", "intro": "…", "hours": { "open": "08:00", "close": "18:00" }, "gap": 15,
  "zones": [{ "id": "desks", "name": "Desks", "min": 1.2, "per": "desk", "count": 40, "max": 400, "tasks": ["…"], "freq": "nightly" }],
  "message": "Hello, we'd like a site survey for our office." }
```

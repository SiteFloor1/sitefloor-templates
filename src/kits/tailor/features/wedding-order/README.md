# wedding-order (tailor kit, Signature, page `weddings`): the wedding party planner

The date, how many are being dressed and one cloth for everyone. A larger party starts earlier by the house's own
rule (`party.rules`: the extra weeks for parties of at least `from`); every fitting and collection follows from the
house's weeks, to the calendar in one file and to the house on WhatsApp with the party size and the cloth.

For a wedding: one date in (day, month and year in UK order), the last day to start first, then every step worked
back from the house's own weeks in UK date order, steps already past marked, the whole list to the calendar
(all-day events) and to the house on WhatsApp. A date too close says so in the house's words (`late`).

```json
"weddingOrder": { "kicker", "title", "intro", "photo": { … }, "orderStep": "start", "late": "…",
  "party": { "max": 10, "rules": [{ "from": 4, "extraWeeks": 2 }, { "from": 7, "extraWeeks": 4 }] },
  "steps": [{ "id": "start", "label": "First appointment", "weeksBefore": 16, "note": "…" }] }
```
Every week figure is the house's own.


Optional, shared with `commission`: `"fittingReminder": { "at": "18:00", "items": ["the shoes and shirt you'll wear with it", "your order card"], "weddingSteps": ["baste", "forward"] }`.
The calendar file then carries an alarm at that time the evening before (the house's time zone), with "Bring …" in
the house's words. The calendar shows it; nothing is sent from the site. Some calendars use their own reminders.

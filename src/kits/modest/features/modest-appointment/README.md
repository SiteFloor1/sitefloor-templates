# modest-appointment (Plus)

Private appointments (MOD-10), its own page (`/appointments`): the studio's standing times (`appointments.weekly`) on
the coming dates, worked out in the browser on the day (from tomorrow, `days` ahead, skipping `closed`); how many are
coming and what for; then "Request this time" opens WhatsApp (or the shop's booking app) with the whole request. The
page says plainly it's a request the shop confirms by message: no time is held or booked by the site.

```json
"appointments": { "weekly": { "sat": ["11:00", "14:00"], "sun": ["12:00"] }, "days": 21, "closed": ["2026-12-25"],
  "reasons": ["Eid", "A wedding or nikah", "Just to try things on"], "minutes": 60, "most": 4,
  "intro": "The studio to yourself for an hour: try the whole collection, with your mum, sisters or friends." }
```

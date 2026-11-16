# End of tenancy (cleaning kit, Plus page)

The `end-of-tenancy` page: what to do before the cleaners arrive, the room-by-room checklist (tick as you go; nothing
is stored or sent), the company's own re-clean terms word for word, and the deposit rules linked to gov.uk with the
month checked. A deposit is never promised: `npm run rules`/validation refuses "deposit back guarantee" wording anywhere
but the company's own `terms`.

```json
"tenancy": { "title": "End of tenancy", "intro": "…", "before": ["…"], "rooms": [{ "name": "Kitchen", "items": ["…"] }],
  "terms": "…", "depositLink": "https://www.gov.uk/tenancy-deposit-protection", "checked": "2026-11",
  "cleanDaysBefore": 1, "bookDaysBefore": 7, "message": "Hello, I'd like to book an end-of-tenancy clean." }
```

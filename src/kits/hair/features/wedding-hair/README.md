# wedding-hair (hair kit, Signature)

The wedding hair planner (`/bridal-and-occasion`): choose the wedding date (UK order) and each of the salon's steps
gets its date (`weeksBefore`, the salon's own timings), steps already past are struck through with a line saying
we'll fit them in, and the whole list goes to the calendar in one file (all-day events, the wedding included) or to
the salon on WhatsApp. Before a date is chosen each step says how many weeks before it falls. Uses the shared diary
helpers (`src/core/lib/diary.js`).

```json
"wedding": { "title": "Bridal and occasion", "intro": "…", "description": "…", "photo": { … },
  "message": "Hello …, I'd like to talk about my wedding hair.",
  "steps": [{ "id": "trial", "label": "Trial", "weeksBefore": 12, "note": "Two hours in the salon." }],
  "note": "We take four weddings a month, so the date is what fills first." }
```

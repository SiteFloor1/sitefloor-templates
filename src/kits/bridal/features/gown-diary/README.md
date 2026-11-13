# gown-diary (bridal kit, Signature)

One wedding date in (day, month, year, always UK order, chosen in a quiet sheet), the year out, led by the last day
to order (what "When to order" used to say on its own), then every step the salon lists (the gown arriving, each
fitting, the veil, collection) with its date, the steps already past marked, how long is left,
and two actions: **Add every date to my calendar** (one .ics file, all-day events, so no time zone moves them; the
wedding included) and **Send my dates** to the salon on WhatsApp. Without a date, each step shows its weeks before.
Shares the date with the appointment request; the phone remembers it.

```json
"diary": {
  "orderStep": "order",
  "late": "Your order date has passed. Message us: some gowns can be made sooner, at a cost we'll tell you first.",
  "steps": [
    { "id": "order", "label": "Order your gown", "weeksBefore": 40 },
    { "id": "arrives", "label": "Your gown arrives", "weeksBefore": 10, "note": "We call you to book the first fitting." },
    { "id": "first", "label": "First fitting", "weeksBefore": 8 }
  ]
}
```
Every number is the salon's own. Logic and its tests: `src/core/lib/diary.js`, `tests/unit/bridal.test.js`.

# bridal-timeline (lingerie kit, Signature)

Wedding dates: she enters her wedding date and sees the shop's own steps (each a number of weeks before: the first
fitting, the fitting with the dress, collection, the honeymoon pieces…) as real dates, past ones marked, how many
weeks are left, and the shop's line if she's late. *Add every date to my calendar* saves one file (all-day events, so
no time zone moves them); *Send my dates* sends them on WhatsApp. Without a date, each step shows its weeks before.

```json
"bridalTimeline": { "late": "…", "steps": [{ "id": "first", "label": "First fitting", "weeksBefore": 16, "note": "…" }] }
```
Heading: `sections.bridalDates`. Logic: the shared wedding diary (`src/core/lib/diary.js`), the same as the bridal kit's gown diary.

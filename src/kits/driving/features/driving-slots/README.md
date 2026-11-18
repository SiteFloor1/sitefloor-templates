# driving-slots (Plus, DRIVE-2)

Next free lessons on the first screen: the next three free lessons from the instructor's Google Sheet, each with "Ask
for this" (a WhatsApp message with the day, time and gearbox), and when the sheet was updated. Fails closed: an old
(`staleAfterHours`, default 48) or unreadable sheet, or one with anything written outside its columns, shows no times,
only "Ask". Demos use `src/demo/driving-slots-provider.js` (dates worked out on the day).

The sheet, published as CSV (File → Share → Publish to web → CSV), lists only free lessons, no names:

```
date,time,hours,gearbox,updated_at
2026-11-19,16:00,2,manual,2026-11-17 08:10
```

**For the instructor:** every row is checked on its own. Each row's `updated_at` must be within `staleAfterHours`
(48 by default), so when you add or confirm a lesson, put the time you did it in that row. Lessons that have passed
drop off by themselves, but a row you haven't touched in two days hides the whole list until you delete it or update
its time. The simplest habit: once a day, delete booked lessons and set `updated_at` on the rest to now.

```json
"slots": { "title": "Next free lessons", "source": "sheet", "csvUrl": "https://docs.google.com/…output=csv", "message": "Hello, I'd like to book a lesson:" }
```

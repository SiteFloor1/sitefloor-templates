# Catch-up finder

| | |
|---|---|
| Feature id | `ballet-catchup` (needs `ballet-timetable`) |
| Plan | plus and above |
| Config | `catchUp`: `text` (the school's own rule on catch-ups), `message` (WhatsApp opening); classes' `level` |
| Files | `ballet-catchup.njk` (on the timetable page), `ballet-catchup.css`, `ballet-catchup.js`; logic `catchUps` in `lib/ballet.js` |

## What it does
"Missed a class?" The parent picks the session they missed; the class's other sessions this week and the classes with
the same `level` appear, each with "Ask for this one" writing "…we missed Ballet one, Wednesday 4.15pm. Could we come to
Ballet one, Saturday 11.00am, instead?" on WhatsApp.

## Rules
- Offer it only if the school allows catch-ups; `text` says how (e.g. "within the same half term, if there's room").
- Never says booked. With `ballet-places`, the timetable above shows which sessions are full.

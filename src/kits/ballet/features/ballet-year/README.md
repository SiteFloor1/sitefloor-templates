# The year in the round

| | |
|---|---|
| Feature id | `ballet-year` |
| Plan | starter and above |
| Config | `year`: `items` `[{ id, date, end?, label, kind }]` (kind: term, half-term, holiday, show, exam, other), `note?` |
| Files | `ballet-year.njk` (under the finder), `ballet-year.css`, `ballet-year.js`; the ring is drawn by the look's hero from the same list (`yearRing` filter) |

## What it does
Every date a parent needs for the year (terms, half terms, holidays) set round the hero's photograph like the frieze
round the Royal Albert Hall, with the shows (`ballet-shows`) and exams (`ballet-exams`) added when those are on. Under the
finder: the next date by name, and "Add the year to my calendar", one .ics of every date still to come (terms and
holidays run to their end dates). The ring is still; nothing on it moves.

## Rules
- Dates come from the school. Past dates drop off the ring and the file by themselves.
- On a demo, `src/demo/dates.js` keeps the sample dates ahead of the build day (`year.items`, `shows.items`, `exams.items`
  move together by whole weeks, so weekdays and gaps stay).

# Timetable

| | |
|---|---|
| Feature id | `ballet-timetable` (needs `ballet-finder`) |
| Plan | plus and above |
| Config | `classes` (see `ballet-finder`); `timetablePage` `{ kicker, title, intro }` |
| Files | `ballet-timetable.njk` (the timetable page), `ballet-timetable.css` |

## What it does
The week day by day, Monday first; days with no class are left out. Each session: the time, the class, its ages and
length. With `ballet-places` on, places left show beside each session; with `ballet-catchup` on, the catch-up finder
follows the week.

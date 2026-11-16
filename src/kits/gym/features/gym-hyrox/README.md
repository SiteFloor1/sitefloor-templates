# Hyrox race prep (GYM-8)

| | |
|---|---|
| Feature id | `gym-hyrox` |
| Plan | signature |
| Config | `hyrox`: `title`, `intro`, `phases` (2 to 5: `name`, `text`, `share`, `classes` (class ids)), `taper` (`name`, `text`, `classes`, `weeks`), `minWeeks`, `maxWeeks`, `short` and `long` (what to say outside them), optional `page` (`photo`, `notes`) for the Hyrox page |
| Files | `gym-hyrox.njk`, `.js`, `.css`; `racePlan`, `planSessions`, `planIcs`, `parseUkDate` in `src/kits/gym/lib/gym.js` |

## How it works
The race date is typed as dd/mm/yyyy (a text field, so the browser's own date format never shows; "14/3/2027" and
"14.03.2027" work too). Training starts on the coming Monday; the whole weeks to the race are shared out over the
club's phases by their `share`, the taper last, each phase with its dates. "Add the plan to my calendar" saves every
session: each phase's classes where they fall in the club's weekly timetable (closed days left out), at the club's own
times, and race day. A sample race sixteen weeks away shows first, said as such.

## Honesty
Dates and the club's own classes only: no paces, weights, results or health claims. Under `minWeeks` or over `maxWeeks`
it says the club's own words (`short`, `long`) instead of a plan.

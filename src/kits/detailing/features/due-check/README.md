# Is my car due? (Starter)

| | |
|---|---|
| Feature id | `due-check`, Starter and above |
| Config | `dueCheck`: `{ message, items: [{ id, name, months or weeks, text }] }` (1 to 6 items, the studio's own intervals); `sections.dueCheck` |
| Files | `due-check.njk`, `.css`, `.js`; the dates and calendar file in `src/kits/detailing/lib/dates.js` (`dueOn`, `daysUntil`, `dueWords`, `dueIcs`) |

## How it works
The visitor picks what was last done (a coating top-up, a maintenance wash, a film inspection…) and the day it was
done. The page says when it's next due by the studio's own interval ("Due in 34 days", "Overdue by 12 days") and the
date. "Add a reminder to my calendar" gives a calendar file with one entry at 9am on the due day, in the studio's time
zone; "Book it on WhatsApp" sends the item and both dates. A day in the future is refused. Nothing is stored.

Months are calendar months, kept to the month's last day (31 January + 1 month is 28 or 29 February).
A look can move it to the aftercare page with `onPages` ("aftercare-page").

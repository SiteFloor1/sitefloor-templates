# The garden calendar

| | |
|---|---|
| Feature id | `calendar-page` (page `calendar.html`) |
| Plan | plus and above; needs `garden-calendar` |
| Config | `calendarPage`: `kicker`, `title`, `intro`, optional `startBy`: `message` (the WhatsApp opening line), `design`, `lead`, `build` (the studio's own typical weeks: design, the wait for a build slot, the build), optional `note`. The months come from `calendar.months` |
| Files | `calendar-page.njk`, `.css`, `.js` |

## How it works
The studio's year, month by month (each month has its own anchor, e.g. `calendar.html#march`). "Ready by" offers the
next eighteen months; for the month chosen it works back through the studio's weeks to the day to get in touch, in UK
date order, and fills in the WhatsApp message. If the month is sooner than the studio's usual weeks, it says so plainly
and suggests asking. Without JavaScript the month list shows and the WhatsApp button opens with the opening line.

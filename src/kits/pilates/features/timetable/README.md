# Timetable (PIL-1)

| | |
|---|---|
| Feature id | `timetable` |
| Plan | starter and above |
| Config | `timetable` (`reformers`, `weekly`: `{ mon: [{ time, class, teacher? }], … }`, optional `note`), `classTypes`, `messages.book` (with `{class}`, `{day}`, `{time}`), `sections.timetable` |
| Files | `timetable.njk` (the week), `today.njk` (the hero's rail, included by the look), `.css`, `.js`; logic in `src/kits/pilates/lib/classes.js` |

## How it works
The next four classes sit along the foot of the hero; the week is seven day tabs below. Each class has a Book link
(the studio's booking app, or WhatsApp with "Hello, I'd like to book Foundation on Thursday 29 October at 9.15.").
Classes that have started drop off; a day the studio is closed (an `hours.exceptions` entry with no hours) shows none.
With `spaces-left` on, each class shows the room's reformers (filled booked, open free). With `waitlist` on, a full
class becomes "Waitlist". With `your-week` on, each class in the week can be ticked.

## When something is missing or fails
Without JavaScript the build's own week shows (accurate on the day of the build). No places show unless the sheet is
fresh and readable.

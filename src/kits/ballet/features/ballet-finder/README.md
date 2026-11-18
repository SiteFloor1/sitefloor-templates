# Class finder

| | |
|---|---|
| Feature id | `ballet-finder` |
| Plan | starter and above |
| Config | `classes`: `message` (WhatsApp opening, e.g. "Hello Wrenna,"), `items` `[{ id, name, ages: [youngest, oldest], level, minutes, sessions: [{ day, time }], text? }]`, `note?`; `hero.question?` (default "How old is your dancer?") |
| Files | `ballet-finder.njk` (placed in the look's hero), `ballet-finder.css`, `ballet-finder.js`; logic in `lib/ballet.js` |

## What it does
The question most parents arrive with, answered on the first screen. The age groups (every distinct age range the
classes cover, youngest first) are large numerals to tap. The answer is the class, its days and times and how long it
lasts; "Ask for a trial" writes "Hello Wrenna, could my child (age 3 to 4) try Little ballet, Tuesdays 4.00pm or
Saturdays 10.00am?" on WhatsApp. The pick is shared with the page (`balletPick`), so the trial section asks for the same
class. With `ballet-places` on, each session's places left show under the answer.

## Rules
- This kit needs `booking.provider: "whatsapp"` (`config.js` refuses anything else): every request is a WhatsApp message.
- Every class, age range, day, time and length is the school's own. Nothing says "booked": it is a request.
- Without JavaScript the group with four-year-olds (or the youngest) shows, with a working trial link.
- `level` groups classes that can stand in for each other (used by `ballet-catchup`).

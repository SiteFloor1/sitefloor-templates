# Members' events (GYM-9)

| | |
|---|---|
| Feature id | `gym-events` |
| Plan | signature (a page: `events.html`, and one `events/<id>.ics` per event) |
| Config | `events` `{ title, intro, photo, items: [{ id, title, date, time, minutes, text, who, place, url }] }` |

The club's own events, soonest first: the next one set large beside the photograph, the rest as a ledger, each with its
day, hours, place and who can come. "Book in the app" when the event has its own link (`url`), otherwise "Ask on
WhatsApp" with the event's name and day. "Add to calendar" downloads one calendar file, written with the site: its time
is the club's wall time converted to UTC, so it lands right in any calendar and across a clock change.

Past events leave the page when the site is built and, in the browser, from their day on (the club's time zone). With
none left, the page says so. A demo's dates move ahead every day (`events.items[].date` in `src/demo/dates.js`).

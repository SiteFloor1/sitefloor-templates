# Settling in

| | |
|---|---|
| Feature id | `nursery-settling` |
| Plan | signature |
| Config | `settling`: `text` (the nursery's words), `message` (WhatsApp opening), `steps` (2 to 12 sessions, each `{ label, from, to, withParent?, note? }`); `settlingPage`; closed days from `terms` |
| Files | `nursery-settling.njk`, `nursery-settling.css`, `nursery-settling.js` |

## How it works
The parent picks a first day. The nursery's own sessions fall on that day (or the next open weekday) and the open
weekdays after it, Saturdays, Sundays and closures skipped. "Add to your calendar" makes one .ics file in the browser;
"Send these dates" opens WhatsApp. Nothing is booked until the nursery replies. Only the nursery's own steps and times.

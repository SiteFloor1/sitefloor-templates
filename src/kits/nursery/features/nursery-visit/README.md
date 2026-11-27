# Book a visit

| | |
|---|---|
| Feature id | `nursery-visit` |
| Plan | plus and above |
| Config | `visit`: `times` (`{ day, time, week?: "first", note? }`), `message` (WhatsApp opening), `minutes?`, `text?`; `visitPage`; closed days come from `terms` when it is set |
| Files | `nursery-visit.njk`, `nursery-visit.css`, `nursery-visit.js` |

## How it works
The nursery's weekly visit pattern ("Tuesdays 10am, Thursdays 4.30pm, the first Saturday of the month") becomes the
next four visit times, worked out on the day in the browser, closed days skipped. The parent picks one and the child's
age; the request goes to WhatsApp naming both. Nothing is booked until the nursery replies: the button says "Ask for".

# Term dates and closures

| | |
|---|---|
| Feature id | `nursery-terms` |
| Plan | signature |
| Config | `terms`: `items` (`{ id, label, date, end?, kind: term \| closed \| open-day }`), `note?`; `termsPage` |
| Files | `nursery-terms.njk`, `nursery-terms.css`, `nursery-terms.js` |

## How it works
What's ahead, soonest first; a date that has passed disappears by itself, on the page as built and again in the
browser. "Add every date to your calendar" makes one .ics file in the browser (nothing is stored). Closed days also
skip visit times and settling-in sessions.

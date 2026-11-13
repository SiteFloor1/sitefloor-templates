# The first wash (new, Starter)

| | |
|---|---|
| Feature id | `first-wash` |
| Plan | starter |
| Config | `care.steps`: `[{ day, title, text }]` (days after handover, the studio's own, 1 to 8 steps); `sections.firstWash` |
| Files | `first-wash.njk`, `.css`, `.js`; the calendar file in `src/kits/detailing/lib/dates.js` (`careIcs`) |

## How it works
The studio's care steps after handover (the first wash, when to top up, …) in order, beside one date: the day you
collect. "Add these to my calendar" gives a calendar file with each step at 9am on its day, in the studio's time
zone. Nothing is booked or stored. The steps and their days are the studio's own; the site adds none.

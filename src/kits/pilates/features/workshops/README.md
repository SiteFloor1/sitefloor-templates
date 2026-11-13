# Workshops and events

| | |
|---|---|
| Feature id | `workshops` |
| Plan | signature |
| Config | `workshops`: `kicker`, `title`, `intro`, `items` (`{ id, title, date, from, to, teacher?, text, price?, places?, payLink? }`), optional `formUrl` (the studio's Google Form), `photo` |
| Files | `workshops.njk`, `.js`, `.css`; calendar file `workshopIcs` in `src/kits/pilates/lib/members.js`; page `src/kits/pilates/pages/workshops.njk` |

## How it works
Each workshop with its day, times, teacher, places and price (the studio's own, or none). "Book a place" opens the
studio's Stripe Payment Link, or WhatsApp when there isn't one; "Add to calendar" saves one `.ics` at the studio's
time. A workshop drops off once it has finished, in the build and in the browser.

# The day, planned and explained (Signature showpiece)

| | |
|---|---|
| Feature id | `day-planner` (page `the-day`) |
| Plan | signature |
| Config | `dayPlanner`: `kicker`, `title`, `intro`, `message` (WhatsApp opening), `ceremony` (the time it opens on, HH:MM), `blocks` (the studio's own lengths in minutes: `prep`, `ceremony`, `drinks`, `meal`, `speeches`, `danceAfter`, `after`), `explained` (`{ heading, body, photo? }`); uses `places` and `lightPlanner` (`date`, `place`, `portrait`) |
| Files | `day-planner.njk`, `.js`, `.css`; the timeline in `src/kits/weddingfilm/lib/day.js`, the light in `lib/sun.js` (unit tested) |

The couple enter their date, roughly where, the ceremony time and (if they have one) the venue. The page builds the
day's filming timeline: getting ready, guests arriving, the ceremony, drinks and group photographs, the wedding
breakfast, speeches, the first dance and when the studio leaves, every block the studio's own length. The portraits go
in the golden hour calculated for that evening at that place; if golden hour falls before the ceremony ends (a late
winter ceremony), they go straight after it, and the page says why, or says plainly that it will be after dark. If
golden hour comes after the first dance, the studio stays on for it and the plan shows that. Sunset is marked.

The plan goes to the studio on WhatsApp or into the couple's calendar (one event per moment, at the place's own time).
It is a starting point and says so: the real day is planned with the couple and the venue. Below it, the day
explained in the studio's words.

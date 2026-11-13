# The wedding-day light (WVID-7, showpiece)

| | |
|---|---|
| Feature id | `light-planner` |
| Plan | signature |
| Config | `places.items` (`{ id, name, lat, lon, tz? }`); `lightPlanner`: `message` (WhatsApp opening), `date` (the date the sentence opens on), `place` (a places id), optional `portrait` `{ start, length }` (minutes after golden hour begins that the studio starts portraits, and how long it keeps), optional `photo`. Heading (read out, not shown) in `sections.lightPlanner` |
| Files | `light-planner.njk`, `.js`, `.css`; the sums in `src/kits/weddingfilm/lib/sun.js` (unit tested against the astral library) |

One sentence the couple can change: "On *Saturday 19 June 2027* at *Bibury* the sun sets at *21:29*." The date and the
place are the controls. Under it: golden hour and blue hour, the day drawn to scale from 04:00 to 23:00, the portrait
window the studio keeps (its own minutes), "Send us this date on WhatsApp" and the golden hour as a calendar file.

Calculated for that date and place from the sun's position (NOAA's solar calculator): sunrise and sunset at 0.833°
below the horizon, golden hour from 6° above to 4° below, blue hour from 4° to 6° below. To the nearest minute. Places
the studio adds can be abroad (give `tz`, e.g. `Europe/Rome`). A date chosen in the date check moves the sentence too.

The page is built with the opening date and place already worked out, so it reads right with JavaScript off.

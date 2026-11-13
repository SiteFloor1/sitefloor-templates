# Sunset on your date (Plus, the easy extra)

| | |
|---|---|
| Feature id | `sunset-line` (needs `date-check`) |
| Plan | plus and above |
| Config | `places.items`: `{ id, name, lat, lon, tz? }` (the places couples marry; `tz` defaults to Europe/London) |
| Files | `sunset-line.njk` (the "Where, roughly" field inside the date check), `.css`; the sums are in `src/kits/weddingfilm/lib/sun.js` |

A taste of the light planner: when a couple check their date, the answer also says when the sun sets that day at
the place they chose ("The sun sets at 21:29 around Bibury."), and the time goes in the WhatsApp message. Calculated
from the sun's position for that date, never typed in. The same `places` list feeds the Signature light planner.

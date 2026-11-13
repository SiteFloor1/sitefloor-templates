# Where the sun falls

| | |
|---|---|
| Feature id | `sun-study` (page `where-the-sun-falls.html`) |
| Plan | signature |
| Home | `sun-home.njk` (home part `sun-study`): the example garden on 21 June drawn at build time, turned to face another way or seen on 21 December with a tap, and "Try your own garden". Its title is `sections.sun` (falls back to `sun.title`) |
| Config | `sun`: `kicker`, `title`, `intro`, `lat`, `lng` (the studio's area, in the UK), `place` (its name, for the note), `message` (the WhatsApp opening line), `garden`: the example garden it opens on (`width`, `length`, `house`, `fence` in metres, `facing`); optional `note`. Uses `palette` when present |
| Files | `sun-study.njk`, `.css`, `.js`; the maths is `lib/sun-study.js` (the sun's position is shared, `src/core/lib/sun.js`), the drawing `lib/sun-draw.js` |

## How it works
The visitor turns a compass dial to the way their garden faces (looking out from the house), sets its width and length,
the house (single storey to three storeys) and the fence or wall, then a month and a time of day. The drawing shows how
many hours of direct sun each square metre gets on the 21st of that month (seven tones, keyed), with the shadows at the
chosen time laid over it, from above or in 3D. A plain sentence says where the sun falls ("the far end gets about 8
hours, the part by the house about 4"); a second says where the sun is at that hour and how much of the garden is in it.
Tap the garden and that spot gets its hours on 21 June (the measure for "full sun", "part shade" and "shade") and the
plants from the palette for that light. "Ask us about your garden" sends the facing, size and the spot on WhatsApp.

Without JavaScript the studio's example garden is drawn at build time for 21 June, with its sentence.

## Notes
Only the house and the boundaries cast shade: trees, extensions and neighbouring buildings don't, and the page says so.
The sun is counted once it is 3° above the horizon. Calculated for the studio's area; across the UK the answer changes
by latitude, so a studio far from the client is approximate. The 3D view is an SVG drawing, not a 3D library: it costs
nothing extra to load.

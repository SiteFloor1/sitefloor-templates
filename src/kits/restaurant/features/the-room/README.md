# The Room (where to sit)

| | |
|---|---|
| Feature id | `the-room` |
| Plan | signature (add-on on any plan) |
| Config | `room`: `width`, `height` (plan units), `areas` (`id`, `name`), `tables` (`id`, `label`, `x`, `y`, `w`, `h`, `shape`: round / rect / booth, `seats`, `area`), `marks?` (`kind`: window, bar, kitchen, door, terrace, wall, pass; `x`, `y`, `w`, `h`, `label?`), `note?`; needs `table-request`; `sections.theRoom` |
| Files | `the-room.njk`, `the-room.css`, `the-room.js`; chairs placed by `chairs()` in `src/kits/restaurant/eleventy.js` |

## How it works
The dining room drawn at build time from the restaurant's own layout (so it shows without JavaScript). Pick an area
or a table; it goes into the table request as a **preference, never a promise**, and the page says so. With The Table's
group, tables too small for it are faded. Validation refuses tables that overlap or reach outside the room.

Drawing a client's room: sketch it on squared paper 100 wide, measure tables and the window in squares, and enter them.

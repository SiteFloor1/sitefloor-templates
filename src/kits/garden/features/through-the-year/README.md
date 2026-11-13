# A garden through the year

| | |
|---|---|
| Feature id | `through-the-year` |
| Plan | signature; client sites only (`clientOnly`): it needs one real garden photographed from one spot, which no demo can show honestly. Tested on the client fixture |
| Config | `throughYear.garden` (a `gardens.items` id), `viewpoint` (where the photographs are taken from), `photos`: 4 to 12 entries `{ month, photo, line? }` of the same view; optional `note`; `sections.throughYear` |
| Files | `through-the-year.njk`, `.css`, `.js` |

## How it works
One garden from the same spot, month after month: the photograph a client would show a friend. A scale of the twelve
months sits under it; months with a photograph can be chosen (tap, or the arrow keys), the photographs crossfade, and
it opens on the photographed month nearest the visitor's own. Each month's line is the studio's own, or, with a
planting palette, what in the palette is at its best that month. Without JavaScript the first photograph shows.

## Notes
The photographs must be one real garden from one place, the studio's own. Four seasons is enough to start; the scale
shows the months still to come as gaps.

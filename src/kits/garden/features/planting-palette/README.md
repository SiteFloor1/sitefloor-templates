# The planting palette

| | |
|---|---|
| Feature id | `planting-palette` (page `planting.html`) |
| Plan | plus and above |
| Config | `palette`: `kicker`, `title`, `intro`, optional `note`, `items` (at least three): `id`, `name`, optional `latin`, `months` (1–12, when it looks its best), `light` (any of `sun`, `part`, `shade`), `care` (`low`, `some`, `more`), `photo`, optional `text` |
| Files | `planting-palette.njk`, `.css`, `.js` |

## How it works
Each plant with the months it is at its best ("May to July", wrapping round the year), the light it wants and how much
care it needs. Two quiet rows of choices narrow it by month and by sun or shade. Without JavaScript every plant shows.
The same list feeds the garden through the year (what's at its best each month) and where the sun falls (plants for the
spot a visitor taps).

## Notes
Light uses the usual garden terms: full sun is six hours or more of direct sun on a summer's day, part shade three to
six, shade under three. Plants and photographs are the studio's own choices.

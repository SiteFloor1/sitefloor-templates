# The work on the walls

| | |
|---|---|
| Feature id | `nursery-wall` |
| Plan | starter and above |
| Config | `hero.exhibits`: 1 to 6 pieces, each `{ photo, title, room, area, text? }`; `area` is one of the seven EYFS areas of learning |
| Files | `nursery-wall.njk` (included by the look's hero), `nursery-wall.css`, `nursery-wall.js` |

## How it works
The first screen shows one piece of the children's work at a time, large, with a gallery caption: what it is, which
room made it and the area of learning. Two arrows step through the pieces; nothing turns by itself.

## Rules
Children are never identifiable: no faces, no names or initials on the work (crop or blur them before the photo goes in).
Captions are the nursery's own words.

## When something is missing or fails
Without JavaScript the first piece and its caption stay on screen.

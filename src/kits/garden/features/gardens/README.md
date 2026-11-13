# Gardens by kind

| | |
|---|---|
| Feature id | `gardens` |
| Plan | starter and above |
| Config | `gardens.styles`: `{ id, name }` (the kinds: courtyards, roof terraces…); `gardens.items`: `id`, `name`, `place`, `style`, optional `size` (in words, e.g. "60 m²"), `facing` (N, NE, E, SE, S, SW, W, NW), `year`, `photo`; optional `note`; `sections.gardens` |
| Files | `gardens.njk`, `gardens.css`, `gardens.js`; the card is `partials/garden-card.njk` |

## How it works
Every garden the studio wants to show, with where it is, its size and facing. The choice of kinds above the list
offers only the kinds the studio has gardens of, so no choice shows nothing. Without JavaScript every garden shows. With
`garden-pages` on, each garden links to its story.

## Notes
Photographs are the studio's own gardens, with the owners' permission. Demo photos are free Unsplash photos.

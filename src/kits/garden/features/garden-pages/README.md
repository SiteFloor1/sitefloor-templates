# Gardens and their stories

| | |
|---|---|
| Feature id | `garden-pages` (page `gardens.html`, and one page per story; a collection, counted as one page) |
| Plan | plus and above; needs `gardens` |
| Config | `gardenPages`: `kicker`, `title`, `intro`, `items`: `garden` (a `gardens.items` id), `slug`, `title`, optional `kicker`, `intro`, `description` (up to 160 characters), `brief` (one sentence: what the client asked for), `body` (paragraphs separated by a blank line), optional `photos`, `plants` (palette ids), `materials` (material ids) |
| Files | `garden-pages.njk` (the gardens page), `.css`, `.js`; a story is `partials/garden.njk` |

## How it works
Every garden on one page with the same choice of kinds as the home page. A garden with a story links to its page: the
brief in one sentence, the studio's words, more photographs, and what it was planted and built with (from the palette and
materials, with their seasons and details).

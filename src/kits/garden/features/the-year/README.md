# The year

| | |
|---|---|
| Feature id | `the-year` |
| Plan | starter and above |
| Config | `year.months`: twelve entries, January first: `plant`, `line` (one short sentence), `photo` (the full photograph), `strip` (a narrow crop of the same photo, about 200 × 640, for the closed strip) |
| Files | `the-year.njk`, `.css`, `.js` |

## How it works
Twelve tall photographs side by side, one a month. The visitor's month (on the studio's clock) stands open with its
name across it; tap a strip or use the arrow keys to open another. The open month is shared as `gardenMonth`, so the
studio's month (`garden-calendar`) follows it. Closed strips show the light crop; a strip's full photograph loads when
it is about to open (on hover or focus). Without JavaScript, the month the site was built stays open. A look places it,
usually in its hero (`heroParts`).

## Notes
Every photograph should be a plant from the studio's own gardens. Demo photos are free Unsplash photos, credited in
the demo's `img/CREDITS.md`.

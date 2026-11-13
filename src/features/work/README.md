# Our work (page)

| | |
|---|---|
| Feature id | `work` |
| Plan | plus and above |
| Config | `gallery` (shared with the home strip; needs the `gallery` feature), `work` (`kicker`, `title`, `intro?`) |
| Files | `work.njk`, `work.css`; page template `src/core/pages/work.njk`; behaviour in `src/features/gallery/gallery.js` |

## How it works
The whole photo feed on one page. Filter chips come from `gallery.filters` (hashtag → label) and only show when at least one post has that tag. Twelve photos show at first; more load as the visitor scrolls (a "Show more" button does the same for keyboard users). At the end, "See more on Instagram" links to the profile. Selecting a photo opens it larger with its caption, "View on Instagram", and a booking button (on WhatsApp the message includes a link to the post).

## When something is missing or fails
If the live feed can't be loaded, the page keeps the photos stored with the site (`gallery.photos`); with none stored, it shows a link to Instagram instead of an empty grid.

Registered in `src/features/registry.js`. Add to a site by listing the id in `features` in its `site.json`.

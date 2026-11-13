# Photo band

| | |
|---|---|
| Feature id | `photo-band` |
| Plan | plus and above |
| Config | `photoBand` (`src`, `srcMobile?`, `width`, `height`, `alt`, `kicker`, `caption`) |
| Files | `photo-band.njk`, `photo-band.css`, `photo-band.js` |

## How it works
Full-width photo with a caption. `photo-band.js` adds a gentle parallax.

## When something is missing or fails
No parallax when the visitor prefers reduced motion or JS fails.

Registered in `src/features/registry.js`. Add to a site by listing the id in `features` in its `site.json`.

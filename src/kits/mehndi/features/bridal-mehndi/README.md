# Bridal page

| | |
|---|---|
| Feature id | `bridal-mehndi` |
| Plan | plus and above (a page: `bridal.html`) |
| Config | `bridalPage`: `kicker`, `title`, `intro`, `photo` (the bride, turned away or cropped below the face), `trial` (the trial and patch test, in the artist's words), `before` (what to do before the artist arrives, one line each), `travel` (travel to the venue and any fee) |

## How it works
The page opens on one tall photograph of the bride beside the trial and patch test. Then what to do before the artist
arrives as a short list, travel to the venue, and the packages and the date check when they're on. A look can move
the reviews here (look.json `onPages`).

## When something is missing or fails
Nothing is live. The photo never shows a face unless the client supplies one with the bride's agreement.

Registered in `src/kits/mehndi/kit.js`. Add to a site by listing the id in `features` in its `site.json`.

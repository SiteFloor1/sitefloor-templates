# Hero film

| | |
|---|---|
| Feature id | `hero-film` |
| Plan | starter and above (in looks whose hero is a film, e.g. Maison) |
| Config | `heroFilm`: `{ photos: [{ src, srcMobile?, width, height, alt }] (1–6), seconds? (4–12, default 7) }` |
| Files | `hero-film.njk`, `hero-film.css`, `hero-film.js` |

## How it works
The restaurant's own photos fill the screen behind the hero and crossfade slowly, each with a gentle push-in, like the
opening of a film. No video to shoot or host: six good photos are enough. The first photo loads with the page (with a
portrait crop for phones via `srcMobile`); the others load one at a time after the page has finished loading, so they
never slow the first view. It pauses while the tab is hidden, and stays on the first photo for visitors who ask for
reduced motion.

## A video loop instead
```json
"heroFilm": { "video": { "src": "img/hero-grill.mp4", "poster": "img/hero-grill.webp", "width": 960, "height": 540 } }
```
A short silent loop (4–10 s) of the restaurant's own footage: the grill, the pass, candles. H.264 MP4, ideally under
400 KB; a heavily out-of-focus loop (as Maison uses behind the Menu Book) can be 960×540 and under 200 KB. The poster (the
loop's first frame as WebP) shows at once; the loop starts after the page has loaded and fades in, pauses when the tab is
hidden, and never plays with "reduce motion" or data saver. Use `photos` or `video`, not both.

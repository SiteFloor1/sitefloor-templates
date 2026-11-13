# Hero film (WVID-6, every plan)

| | |
|---|---|
| Feature id | `hero-film` |
| Plan | starter and above |
| Config | `hero.film`: `label` (what the film is, read out to screen readers), `wide` and `tall`, each `{ src, poster, width, height }` |
| Files | `hero-film.js`, `hero-film.css`; the markup is the look's `hero.njk` |

The studio's own film across the top of the home page: `wide` for large screens (cinema ratio, 2.39:1 works best),
`tall` for phones (4:5). Each is an H.264 `.mp4` with no sound and a still (`poster`, WebP) cut from its first frame.

## How it works
The still is a `<picture>` and paints straight away (it's the only image the browser fetches first). After the page
has loaded, the film for that screen starts muted and fades in over the still. The look's Pause button (shared,
`[data-motion-pause]`) stops it; so does a hidden tab.

## When something is missing or fails
- Reduced motion or Save-Data: the still stays and the film never downloads, unless the visitor taps a chapter.
- Autoplay refused (some phones in low-power mode): the still stays.
- Keep each cut small: the demo's wide cut is 3.1 MB for 12.6 s, the tall cut 1.6 MB (`docs/trades/wedding-film/speed.md`).

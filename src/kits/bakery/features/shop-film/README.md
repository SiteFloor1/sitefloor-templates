# shop-film (bakery kit, Starter)

The shop's own film, full screen at the top of the home page: a 6–12 second muted loop (chocolate being poured, the
gelato being worked). Its first frame shows straight away as a picture; the film starts once the page has loaded, the
tall cut on phones. Never with reduced motion or data saver; the shared Pause button stops it (WCAG 2.2.2).

## Config (`site.hero.film`)
```json
"film": { "wide": "img/pour-1920.mp4", "tall": "img/pour-720.mp4", "credit": "Kelly, Pexels",
  "poster": { "src": "img/pour.webp", "width": 1920, "height": 1012, "alt": "Dark chocolate pouring into a pool of chocolate" },
  "posterTall": { "src": "img/pour-m.webp", "width": 720, "height": 900, "alt": "…" } }
```
Making the files (from the shop's own clip, or a free Pexels video), with a seamless loop by fading the end into the start:
```
ffmpeg -i clip.mp4 -filter_complex "[0:v]split[a][b];[a]trim=1.5:11,setpts=PTS-STARTPTS[m];[b]trim=0:1.5,setpts=PTS-STARTPTS[h];[m][h]xfade=duration=1.5:offset=8,scale=1920:-2,format=yuv420p" -an -c:v libx264 -preset veryfast -crf 24 -movflags +faststart pour-1920.mp4
```
The tall cut is the same with a 4:5 crop on the subject, scaled to 720 × 900. The posters are the loop's first frame.
Keep each file under 1.5 MB; it isn't counted in the image budget, so it's listed in `docs/SPEED-LOG.md`.

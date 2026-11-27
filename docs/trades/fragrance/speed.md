# Fragrance houses and perfumers: speed

## 17 Nov 2026 — fragrance kit: Verrière look and demo

Whole site: JS 25.5 KB (9.6 KB gz), CSS 43.4 KB (10 KB gz), fonts 64 KB (Hina Mincho 400, SUSE 400 and 500; latin
woff2). HTML gz: home 7.5 KB, other pages 3.9–5.8 KB. `npm run budget` passes.

The turntable: 36 frames shown, 18 files per size (the flacon is the same from the back). Frame 1 is the hero
picture; the other 17 load only when someone hovers over, touches or tabs to the bottle, so the page costs
one picture. Desktop 1600×1000 (about 26 KB a frame, 472 KB for 18), large retina screens 2400×1500 through `srcset`
(about 58 KB a frame, 1,044 KB for 18), phones 780×1120 (about 24 KB a frame, 424 KB for 18). Rendered in Blender
Cycles at 2400×1500, 56–96 samples, denoised; the frames are laid onto one full plate so the studio never shimmers
between frames.

Fallback fonts size-matched from the font files against Liberation Serif and Sans on the hero's own words: Hina
Mincho 92.2% (ascent 125.8%, descent 31.2%), SUSE 97.7% (100.3%, 28.7%). On desktop the stage takes the picture's own
shape, so the name, notes and Buy are placed by CSS on the bottle's marks; nothing moves when the script or fonts
arrive.

Lighthouse, Verrière home, from `npm run serve`: mobile performance 100, accessibility 100, LCP 1.1 s, TBT 50 ms,
layout shift 0; desktop performance 100, accessibility 100, LCP 0.4 s, layout shift 0.

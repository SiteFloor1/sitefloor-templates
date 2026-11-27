# Car videographers and photographers: speed

## 27 Nov 2026 — carfilm kit: Viewfinder look and Kerrow demo

Whole site: JS 29.1 KB (11.1 KB gz), CSS 46 KB (10.3 KB gz), fonts 58.1 KB (Trirong 500, Wix Madefor Text 400 and
600, Martian Mono 400; latin woff2). HTML gz: home 6.7 KB, other pages 3.7–6 KB. `npm run budget` passes.

The hero film: the poster (31 KB WebP) paints first; the film (820 KB, 1600×900, H.264, 6 s loop at 25 fps; 200 KB at
960×540 on phones) starts only after the page has loaded, never with reduced motion or Save-Data. Showreel films load
only when played (`preload="none"`). The frame guides are placed by CSS at the first format's shape from the stage's
own proportions, so nothing moves when the script starts; the readout is rendered with the build day's light.

The sun maths runs in the browser: a minute-by-minute scan of the day (about 1,440 sun positions) per road shown,
well under 10 ms on a phone. The cloud forecast is one request per road and hour to MET Norway, only on the planner
page and only for dates within nine days.

Fallback fonts size-matched from the font files against Liberation Serif, Sans and Mono on the home page's own words:
Trirong 120.1% (ascent 99.9%, descent 44.5%), Wix Madefor Text 103.5% (97.4%, 24.3%), Martian Mono 116.6% (85.7%, 17.1%).

Lighthouse 12, Kerrow home, from `npm run serve`: mobile performance 98, accessibility 100, LCP 1.9 s, TBT 110 ms,
layout shift 0; desktop performance 100, accessibility 100, LCP 0.4 s, layout shift 0.001.

# Modest fashion and abaya boutiques: speed

## 16 Nov 2026 — modest kit: Taroub look, Taroub demo

Whole site (`npm run budget`): JS 29.2 KB (10.8 KB gz), CSS 48.9 KB (10.7 KB gz), fonts 80.2 KB (Shippori Mincho 400
and 500, Afacad 400 and 500; latin woff2). HTML gz: home 8.3 KB, Plan your visit 6.8 KB, other pages 4.5–5.7 KB.
Images: first screen 148 KB on the home page (the hero, 1500×2250 WebP); everything below is lazy (the home page's
full set is 783 KB, mostly the collection at 900×1350); the look page 64 KB on its first screen. One warm grade on
every photograph, taken from the hero's tan floor; the hem photograph warmed further to sit beside it.

Fallback fonts size-matched from the font files (average width of running text and hhea ascent and descent) against
Liberation Serif and Sans: Shippori Mincho 117% (ascent 99.1%, descent 24.6%), Afacad 400 89.5% (111.7%, 37.2%),
Afacad 500 82.9% (120.6%, 40.2%).

Measured in Chrome with the CPU slowed 4×, from the local server (Lighthouse isn't installed in the build machine;
the auditor's Lighthouse run is the one to record): layout shift on the home page 0 on a phone (390×844) and 0.0000
on desktop (1440×900); the look page 0.0004; the length page 0.016 on desktop (the form appears when its script
starts; under 0.1). Largest paint 0.26–0.58 s locally (the hero photograph on the home page). Phone home page: 8,728
px, about 10 screens with the footer (the collection two to a row). axe: no serious or critical violations on any
page of the demo or the client fixture (tests/e2e/a11y.spec.js), after the panel colour went lighter for contrast.

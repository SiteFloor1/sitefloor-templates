# Independent tour operators: speed

## 17 Nov 2026 — tourism kit: Logbook look, Larrow demo

Whole site (`npm run budget`): JS 28.6 KB (10.7 KB gz), CSS 45.3 KB (10.1 KB gz), fonts 34.7 KB (Familjen Grotesk 400, 500
and 700; latin woff2). HTML gz: home 19.4 KB (every journey's logbook and drawn map is on the page for the journey of
the month; the maps are a few KB each), journey pages 6.3–11 KB, Plan your visit 6.1 KB, other pages 3.6–4.4 KB.
Images: 1040×1300 WebP with 600-wide copies, one cool-neutral grade. First screen 106 KB on the home page (the open
journey's photograph; the others are lazy and load when that journey is chosen); the home page's full set is 1.4 MB if
every journey is opened. Kyoto's first screen is the heaviest at 277 KB (fine leaf detail).

Country outlines: Natural Earth 1:50m, simplified to about 2.5 km and rounded to 0.01° (`src/kits/tourism/data`,
624 KB in the repository, build time only); a page inlines only its own country.

Fallback font size-matched from the font files (average width of running text and hhea ascent and descent) against
Liberation Sans: Familjen Grotesk 400 94.1% (ascent 108.9%, descent 23.9%), 500 96.7% (106%, 23.3%).

Measured in Chrome with the CPU slowed 4×, from the local server: layout shift on the home page 0 on a phone
(390×844) and 0.0013 on desktop (1440×900); a journey page 0 and 0.0013; the trip builder 0 and 0.0001. Largest paint
0.18–0.30 s locally. Phone home page 7,655 px. axe: no serious or critical violations on any page of the demo or the
client fixture (tests/e2e/a11y.spec.js), after the year's faded rows moved from opacity to the muted ink for contrast.
Lighthouse isn't installed on the build machine; the auditor's run is the one to record.

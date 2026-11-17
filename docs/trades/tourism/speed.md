# Independent tour operators: speed

## 17 Nov 2026 — tourism kit: Logbook look, Larrow demo

Whole site (`npm run budget`): JS 28.6 KB (10.7 KB gz), CSS 45.3 KB (10.1 KB gz), fonts 34.7 KB (Familjen Grotesk 400, 500
and 700; latin woff2). HTML gz: home 18.6 KB (every journey's logbook is on the page for the journey of the month;
each country's outline is drawn once and reused, so Chile's three journeys share one), journey pages 6.3–11 KB, Plan your visit 6.1 KB, other pages 3.6–4.4 KB.
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
Lighthouse isn't installed on the build machine; the auditor's run is below.

## 17 Nov 2026 — the audit's Lighthouse (before the fixes)

Lighthouse, Chromium, local server, home page (from the audit, 2026-11-17-F):

| | Performance | Accessibility | Best practices | Largest paint | Layout shift |
|---|---|---|---|---|---|
| Phone (mobile preset), 7 runs | 100 in 4 runs; 83–88 in 3 | 96 | 100 | 1.7 s (good runs) to 3.9 s (render delay up to 2.6 s) | 0–0.001 |
| Desktop | 100 | 100 | 100 | 0.6 s | 0.001 |

SEO 69 is only the demo's noindex. Fixed after the audit: the year's month buttons on a phone are now at least 24 px
wide and 44 px tall (the table becomes a name line with the twelve months full width beneath it), the wordmark's
spoken name is its visible text, and the phone bar is a `nav` landmark. Home HTML down from 19.4 to 18.6 KB gz once
each country's outline is drawn once. The phone runs' render-delay variance is left for the next Lighthouse run to
confirm; the first-screen photograph is already eager with high fetch priority.

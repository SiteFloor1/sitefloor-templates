# Garage and parking rentals: speed

## 17 Nov 2026 — garage kit: Elsden look, Elsden demo

Whole site (`npm run budget`): JS 28 KB (10.8 KB gz), CSS 40.9 KB (9.3 KB gz), fonts 86.8 KB (Cardo 400, 400 italic
and 700, Radio Canada 400, 500 and 600; latin woff2). HTML gz: home 9.3 KB (the drawn plan is inline SVG), Plan your
visit 6.5 KB, other pages 4.5–5.1 KB.

The hall from above (a Bespoke add-on) adds no 3D engine: one rendered image per screen size and a car image. Home
page images 235 KB in all, 68 KB on the first screen (the 2208 × 1158 render as WebP, 44 KB; the phone render 1013 ×
1540, 26 KB); the night renders (23 KB, 17 KB on a phone) and the kept photographs load lazily. Car images 51–63 KB
(PNG with transparency), fetched only for the car picked. The drive is an SVG transform on each frame for 6.2 s,
then nothing runs; with reduced motion it never runs.

Fallback fonts size-matched from the font files (width of running text and hhea ascent and descent) against
Liberation Serif and Sans: Cardo 105.9% (ascent 93.5%, descent 34.3%), Radio Canada 103.3% (91.4%, 24.7%).

Layout shift, with fonts slowed 600 ms and the site script 1.5 s (tests/e2e/garage.spec.js): under 0.05 on the home
page at 390 and 1440 px, arriving at night at 390, laying up at 1024 and business at 390; no page scrolls sideways
at 320 px. axe: no serious or critical violations on any page of the demo or the client fixture. Lighthouse isn't
installed on the build machine; the auditor's runs are below.

Lighthouse 12.8.2 (the audit of 17 Nov 2026), Chromium, local server, home page, three runs each:

| | Performance | Accessibility | Best practices | First paint | Largest paint | Blocking | Layout shift |
|---|---|---|---|---|---|---|---|
| Phone (mobile preset) | 99–100 | 100 | 100 | 1.2–1.7 s | 1.6–1.8 s (the aerial render) | 0–20 ms | 0 |
| Desktop | 100 | 100 | 100 | 0.4 s | 0.4 s | 0 ms | 0.001 |

SEO 69 only because every demo is noindex.

Covered hall and live list (18 Nov 2026): the car images are gone. Each aerial view now has an `-empty` twin (desktop
day 44 KB + 34 KB, phone day 27 KB + 18 KB), drawn only over the free bays; `garage-spaces.js` and the Sheet reader
add about 2 KB. `npm run budget` passes. The Lighthouse figures above were measured before this change; CI re-runs
the layout-shift tests.

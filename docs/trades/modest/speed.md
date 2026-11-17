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

## 17 Nov 2026 — the audit's Lighthouse (before the fixes)

Lighthouse 12.8.2, Chromium, local server, home page, three runs each (from the audit, 2026-11-17-A):

| | Performance | Accessibility | Best practices | First paint | Largest paint | Blocking | Layout shift |
|---|---|---|---|---|---|---|---|
| Phone (mobile preset) | 90–91 | 100 | 100 | 1.0–1.6 s | 3.4–3.5 s (hero) | 0–70 ms | 0 |
| Desktop | 100 | 100 | 100 | 0.3–0.4 s | 0.7 s | 0 ms | 0 |

SEO is 69, because the demo is `noindex`, as every demo is.

## 17 Nov 2026 — after the audit (T-01 to T-05)

- Phone-sized copies through `srcset`/`sizes` (`photo.small`): hero 800 px (52 KB, was 148 KB to every screen), the
  collection, the look and made to measure 600 px (21–53 KB), the wall's second piece 300 px, the family photo 700 px.
- The appointment form, the length guide's first answer, the Eid dates and the family list's first row are drawn at
  build time for the build day; the browser redraws them in place for the real day, so the pages keep their shape.
- Below 1,100 px the header is the name, WhatsApp and Menu (no wrapping sentence); on wider inner pages the two
  sentences are one line each, so the header keeps its height whichever font is showing. Page headings wrap rather
  than run off a small phone.

Lighthouse 12, local server (three runs on the home page, one on the others):

| | Performance | Accessibility | First paint | Largest paint | Blocking | Layout shift |
|---|---|---|---|---|---|---|
| Phone, home | 97–100 | 100 | 1.0–1.6 s | 1.4–2.3 s (hero) | 0–50 ms | 0 |
| Phone, appointments | 100 | | | 1.5 s | | 0 |
| Phone, length | 100 | | | 1.0 s | | 0 |
| Desktop, home | 100 | | | 0.5 s | | 0 |

The kit's browser test now holds layout shift under 0.05 with fonts slowed 600 ms and scripts 1.5 s (appointments,
length and home at 390 px; Eid, Our story and length at 1,024 px), and no sideways scroll at 320 px.

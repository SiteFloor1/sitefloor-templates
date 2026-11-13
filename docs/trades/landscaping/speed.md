# Garden designers and landscapers: speed

## 12 Nov 2026 — shorter home, sun on home, lighter first screen

Home on a phone (390 × 844): about 5.8 screens before the footer (was about 12). Home images 1.38 MB (was 1.84), first
screen 62.5 KB (was 208): the closed month strips are lazy (phones show five, so the hidden seven never load) and the
twelve month photographs are 1000 × 1000 (about 64 KB each, from 98). The sun on home is the build-time SVG; nothing is
worked out until a tap. Gardens page: the first garden photograph has priority, the rest lazy. HTML gz: home 9.2 KB.
Before/after (client sites only): one 3:2 frame beside its heading, 881 px tall on a 1440 × 900 desktop (was about 2,200).

Lighthouse mobile, three runs each: home 100, 99, 99 (LCP 1.7–2.1 s, TBT 10–50 ms, layout shift 0, accessibility 100);
where the sun falls 100, 100, 100; gardens 99, 98, 86 (LCP 1.9–4.1 s: the first photograph competes with the fonts on
slow 4G; varies by run).

## 11 Nov 2026 — garden kit: Almanac look, Tollgarth demo (Signature)

Whole site: JS 13.4 KB gz, CSS 12.8 KB gz, fonts 68.7 KB (Alegreya 400, 500 and 400 italic; latin woff2). HTML gz:
home 9.3 KB, where the sun falls 6.7 KB, maintenance 5.1 KB, materials 5.0 KB, planting 5.2 KB, a garden story about
4.3 KB. Home images: 208 KB on the first screen (the open month's photograph, 1200×1200 WebP, and eleven strip crops at
200×640, 2–25 KB each); a strip's full photograph loads only when it is about to open (hover, focus or tap). Everything
below the first screen is lazy; the home page's images total 1.84 MB (budget 2 MB). The sample table's gardens load
only when a sample is touched. The sun study is drawn in SVG by the page's own script: no images, no 3D library
(first-screen images 0 KB). One light grade on every photograph.
Fallback fonts size-matched from the font files against Liberation Serif: Alegreya 400 101.6% (ascent 100%, descent
34%), 500 102.1% (99.5%, 33.8%), italic 90% (112.9%, 38.3%).
The client fixture (Signature: the year, the studio's month, the sun study and maintenance plans): JS 10.6 KB gz,
CSS 9.0 KB gz.

Lighthouse mobile (Lighthouse 12.6, slow 4G and 4× CPU), three runs each from a running server:
- Home: performance 92, 91, 92; accessibility 100; FCP 1.0–1.4 s; LCP 3.3 s (the open month's photograph:
  discoverable, fetchpriority high, not lazy); TBT 30–100 ms; layout shift 0.
- Where the sun falls: 100, 100, 100; accessibility 100; LCP 1.5 s; layout shift 0–0.025.
- Maintenance plans 100 and 99; planting 96 and 95; materials 92 and 89 (eight large sample photographs); all
  accessibility 100, layout shift 0.

Phone layout shift, measured in the browser with 4× CPU and slow-network throttling (412 × 823): 0.0003 on the home
page. Two causes found and fixed while measuring: the garden through the year now stacks its photographs from the start
and only crossfades (it used to change layout when its script started), and every choice row (kinds of garden, months,
plans, views) keeps its place before its script runs instead of appearing late. On phones the year shows the open month
and two either side, so each strip is at least 28 px wide to tap (WCAG 2.2 target size).

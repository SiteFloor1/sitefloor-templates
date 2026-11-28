# Luxury residences and hotel-grade rentals: speed

## 27 Nov 2026 — Sevrell (residences kit, Turndown look)

Whole demo (Signature, 23 pages): JS 14.6 KB gz, CSS 10.1 KB gz, fonts 67.5 KB (Imbue 500/600 and Inria Sans
400/700, latin woff2). Home HTML 5.4 KB gz; the hero photograph is 224 KB on desktop (2400×1004 WebP) and 88 KB on
phones (1000×1250); the four home cards load 720-pixel copies (20–52 KB each). `npm run budget` passes.

Fallback fonts size-matched from the font files (average advance of a mixed sample; hhea ascent and descent): Imbue
500 against Liberation Serif 74.3% (ascent 127.8%, descent 33.6%), 600 78.2% (121.5%, 32%); Inria Sans 400 against
Liberation Sans 94.1% (103.7%, 23.7%), 700 against Liberation Sans Bold 90.2% (108.2%, 24.7%).

Layout shift while loading (PerformanceObserver, fonts delayed 600 ms): home 0.00003 at 412 px and 0.003 at 1440 px;
Residences 0.00005 at 412 px (the list keeps its place until the sheet has filled it; it was 0.228 before) and 0.010
at 1440 px; Fees 0. Re-measured 28 Nov 2026 after the audit: the client's Residences page with its sheet failing
0 at 360 px, 0.011 at 1280 px and 0.009 at 1440 px (the list area keeps one height loading, filled or
unavailable; it was up to 0.341). Home page at 412 × 915: 4.1 phone screens including the footer and the demo bar.

Lighthouse was not run for this build; run it on the published demo and add the numbers here.

# Financial advisers: speed

## 16 Nov 2026 — Thursby (ifa kit, Statement look)

Whole demo (Signature, 24 pages): JS 10 KB gz, CSS 10.3 KB gz, fonts 44.1 KB (Frank Ruhl Libre 300/400/500, latin woff2).
Home HTML 6.3 KB gz; home images 380 KB, all on the first screen (the terrace, 2000×1000 WebP, 262 KB; 900×900 on
phones, 117 KB). Every other page has no images. The client fixture (Plus): JS 3.8 KB gz, CSS 6.6 KB gz.

Fallback font size-matched from the font files against Liberation Serif (metric-compatible with Times New Roman):
Frank Ruhl Libre 300 106.1% (ascent 90.2%, descent 31.5%), 400 108.4% (88.3%, 30.8%), 500 112.2% (85.3%, 29.8%).
Controls that need their script (the statement's amounts, pension dates, the old-pensions form, the review month) keep
their space, unseen, until it starts.

Layout shift while loading (PerformanceObserver, real fonts, local server): 0.000–0.018 on most pages at 360, 390 and
1440 px; the highest is 0.051 (Fees at 390 px) and 0.037 (Pensions at 1440 px), both from the font swap re-wrapping a
line. All under 0.1. Lighthouse wasn't available in this environment; run it before the case study.

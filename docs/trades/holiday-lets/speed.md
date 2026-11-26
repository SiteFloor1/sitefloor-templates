# Holiday-let and Airbnb management: speed

## 27 Nov 2026 — Tressa (hol kit, Arch look)

Whole demo (Signature, 17 pages including two guidebooks and two journal articles): JS 6.4 KB gz, CSS 8.1 KB gz,
fonts 74 KB (Zalando Sans Expanded and Zalando Sans, one variable latin woff2 each). Home HTML 6.9 KB gz; home images
517.5 KB if every photograph is loaded, 85 KB on the first screen (the arch, 2400×1798 WebP on desktop, 1170×1463 on
phones; a visitor loads one). The changeover's photographs and the homes load lazily; a changeover photograph is
fetched early only when its time is tapped.

Fallback fonts size-matched from the font files against Liberation Sans (average advance of a mixed sample with
figures; hhea ascent and descent): Zalando Sans 400 105.2% (ascent 91.6%, descent 23.8%), 500 106.6% (90.4%, 23.5%);
Zalando Sans Expanded 500 131.2% (73.5%, 19.1%). Tabular figures are never switched on (their zero is slashed).

Lighthouse 12 mobile, local server: home performance 99, accessibility 100, best practices 100 (FCP 1.4 s, LCP 2.1 s
on the arch, TBT 0 ms, CLS 0.001); What it costs 100/100/100; For owners 100/100/100; The homes 96/100/100 (LCP 2.7 s on
the first home). Layout shift while loading (PerformanceObserver, real fonts): 0.0007 at 412 px, 0.0006 at 1440 px; the
estimate's and the rules' controls hold their place until the script is ready. Home page: 6.4 phone screens at 412 ×
915, 4.7 desktop screens at 1440 × 900, including the footer and the demo bar.

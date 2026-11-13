# Fine jewellers: speed

## 29 Oct 2026 — Aldous Marr (jeweller kit, look `nacre`), after the owner's home-page review

Whole site: JS 14.8 KB gz, CSS 15.2 KB gz, fonts 39.7 KB (Italiana and Albert Sans 300/400/500, latin woff2). 33 pages;
HTML 7.1–8.9 KB gz a page. Home: six sections, 335 KB of images in all, 121 KB on the first screen (was 1,276 KB before
the home page was cut); collection pages 52–157 KB; piece pages up to 468 KB; the archive 532 KB. Piece photos in the
viewer load only when opened (`data-src`, not counted). No video. Lighthouse mobile, demo home, fresh server: 96 (cold,
TBT 130 ms), then 98; accessibility 100; LCP 2.3 s; layout shift 0. Axe passes on every page (open and closed).

## 29 Oct 2026 — Aldous Marr additions: date picker, occasion pages, bridal party, vitrine, shortlist, the card

Whole site: JS 19.7 KB gz (was 14.8; the shared date picker on the appointment request is most of it), CSS 17.0 KB gz,
fonts unchanged (39.7 KB). 39 pages; HTML 7.8–9.3 KB gz a page. Home unchanged at 335 KB of images, 121 KB on the first
screen. Occasion pages 210–292 KB of images (first screen 37–118 KB: the photograph, 1600×1000 or 900×1200 WebP);
bridal party 208 KB (first 143 KB); pieces with the vitrine 310 KB, all lazy. Lighthouse mobile, demo home, fresh
server: 98 and 98; accessibility 100; LCP 2.2–2.4 s; TBT 50–70 ms; layout shift 0. Axe and the phone layout-shift test
pass on every page.

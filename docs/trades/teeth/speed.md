# Teeth whitening and aesthetic dentistry: speed

## 9 Nov 2026 — smile kit: Booth look, Marlie demo

Whole site: JS 8.4 KB gz, CSS 10.0 KB gz, fonts 64.2 KB (Reddit Sans 200/300/400 and Brygada 1918 italic 400; latin
woff2). HTML gz: home 7.6 KB, Plan your visit 6.6 KB, patient information 5.5 KB, other pages 4.5–5.3 KB. Images:
home 234 KB, 110 KB of it on the first screen (the four strip frames, 720×900 WebP, 22–34 KB each; the chooser
photograph and portrait are lazy); smiles 174 KB; studio 143 KB. Every photograph has one warm black-and-white grade.
Fallback fonts size-matched from the font files against Liberation Sans / Liberation Serif Italic: Reddit Sans 200
98.9% (ascent 102.1%, descent 29.2%), 300 100.1% (100.9%, 28.9%), 400 101% (100%, 28.6%); Brygada 1918 italic 108.4%
(84.9%, 23.1%). The client fixture (Plus): JS 6.4 KB gz, CSS 8.0 KB gz, home images 110 KB.

Lighthouse mobile, Marlie home, three runs from a fresh `npm run serve` (gzip): performance 97, 98, 98; accessibility
100; FCP 1.4 s; LCP 2.3 s (the strip); TBT 120, 0, 50 ms; layout shift 0. Phone (390×844): the strip is 764 px tall,
inside one screen; the phone bar with Book stays on screen while scrolling (tests/e2e/smile.spec.js).

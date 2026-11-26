# Event designers and producers: speed

## 18 Nov 2026 — events kit: The doors look, Maudry demo

Whole site: JS 11.5 KB gz, CSS 9.9 KB gz, fonts 43.4 KB (Eczar 400/500/600; latin woff2). HTML gz: home 7.2 KB,
rooms 5.8 KB, start 5 KB, your proposal 4.8 KB. Images counted: home 1,183 KB in all, 355 KB on the first screen (the
library hero, 2000×1334 WebP at 240 KB; phones get a 780 px 4:5 crop at 80 KB; everything below is lazy); rooms
1,683 KB (240 KB first). Design visuals and Lay the table: 1440×900 WebP, 38–85 KB each (dark renders compress well).
Fallback font: see the 26 Nov entry (the 18 Nov figures were replaced).
The client fixture (Signature, sheet sources): JS 10.9 KB gz, CSS 8.8 KB gz. `npm run budget` passes for both.
To check on the first CI run: phone layout shift and accessibility (the all-sites end-to-end tests) and Lighthouse.

## 26 Nov 2026 — layout shift fixes, hero paint, fallback per weight; Lighthouse

Lighthouse 12, Maudry home, our own runs on a local build (Chromium 145, simulated throttling, phone preset):
performance 97 / 97 / 96, accessibility 100, best practices 100; FCP 1.2 s, LCP 2.6 s, CLS 0–0.001, TBT 20–80 ms.
Desktop preset: 99 / 100 / 100, LCP 0.8 s, CLS 0.003. With devtools throttling (measured, not simulated) the phone
run is 98 with LCP 2.1 s and a render delay of 43 ms. (The auditor's re-check on 26 Nov measured 94 and LCP 3.1 s
before these changes; the figures that stood here before were not the auditor's and are withdrawn.)
What changed: the hero no longer fades its own image in (a veil over the photo lifts instead, so the photo paints at
once) and drops `decoding="async"`; the phone hero is a 740 px crop at 79 KB (was 900 px at 115 KB); the library and
chandeliers room cards get 800 px copies, so a phone no longer fetches their 2000 px files. What's left of the simulated
LCP is bandwidth shared with the fonts and the first room photos below the hero (lazy, but inside the browser's
loading distance).
Layout shift: room photos take their height from their width and height attributes; a page title on a wide screen
keeps room for two lines. Every page of the demo and the client fixture at 360, 1280 and 1440, CPU 4× slower: CLS
0.003 or less, the visit page 0.011–0.014 (auditor), no sideways scroll.
Eczar fallback, size-matched per weight: 400 against Liberation Serif / Times New Roman at 106.5% (ascent 107.3%,
descent 59.5%), 500 against the same regular cut at 109.7% (104.2%, 57.8%), 600 against Liberation Serif Bold /
Times New Roman Bold at 106.7% (107.2%, 59.5%), measured over running text in the browser.

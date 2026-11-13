# Cafés: speed

## 28 Oct 2026 — café: Counter look, Morrow demo (restaurant kit)

Home page: JS 23.7 KB gz, CSS 18.2 KB gz, HTML 23.3 KB gz, fonts 70.2 KB (Gloock 400, Onest 400/500/600, latin woff2).
Images on the home page 700 KB of 800: the counter photo (680 px for phones, 1040 px in srcset; tagged bakes are spots
over it, not images), the photo band (1800 px, 104 KB), Can I work here?'s three photos (720×900) and the gallery.
The glass case's six bakes (640 px squares, 17–76 KB) and the brunch plates (1000 px) load only as they near the screen
(`data-src`), so they aren't counted. One shared grade (warm daylight, lifted shadows); photos recompressed once to fit.
Fallback fonts size-matched from the font files against Liberation Serif / Sans: Gloock 112.9% (ascent 86.3%, descent
19.9%), Onest 400 105.5%, Onest 600 vs Liberation Sans Bold 100.7%. Phone layout-shift test (360, 390, 412) and axe pass
for the demo and the Counter client fixture.
Your usual's glass is drawn per frame (no CSS shape animation, which Safari lacks): four paths and an ellipse, 750 ms.
Lighthouse mobile, demo home, three runs from a fresh server: 90 (first, cold), 98, 97; accessibility 100; FCP 1.0–1.1 s;
LCP 1.8–2.0 s; TBT 390 / 150 / 150 ms; layout shift 0.

## 28 Oct 2026 — Morrow, measured again on main (for its case study)

Whole site: JS 24.6 KB gz, CSS 18.2 KB gz, fonts 70.2 KB. Home HTML 23.3 KB gz; home images 806 KB in all, 160 KB on the
first screen (the budget now counts these separately). Lighthouse mobile, demo home, three runs from a fresh server: 90
(first, cold), 96, 97; accessibility 100; LCP 2.0–2.1 s; TBT 390 / 210 / 160 ms; layout shift 0.

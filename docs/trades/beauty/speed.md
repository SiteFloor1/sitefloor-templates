# Facialists and skin clinics: speed

## 16 Nov 2026 — skin kit: Palm look, Clémence demo

Whole site: JS 9.7 KB gz, CSS 10.6 KB gz, fonts 48.6 KB (Antic Didone 400, Baskervville 400 and 600; latin woff2).
HTML gz: home 7.7 KB, Plan your visit 7.1 KB, other pages 4.8–6.0 KB. Images: home 310 KB, 156 KB of it on the
first screen (the framed photograph: 2000×1081 WebP on desktop, 900×1200 on phones; the page-link photographs are
lazy); the room 238 KB; facials 56 KB. One grade on every photograph (greens down to 40%, a touch warm). Fallback
fonts size-matched from the font files against Liberation Serif: Antic Didone 116.8% (ascent 80.5%, descent 21.4%),
Baskervville 400 108.6% (91.9%, 27.2%), 600 110.5% (90.3%, 26.7%). The client fixture (Plus): JS 6.2 KB gz, CSS 8.0
KB gz.

Lighthouse mobile, Clémence home, three runs from a fresh `npm run serve` (gzip): performance 100, 100, 100;
accessibility 100 (after the card's heading became an h2); FCP 1.0–1.4 s; LCP 1.4–1.7 s (the photograph); TBT 0–60 ms;
layout shift 0.021 (on the question; the same with the real fonts blocked, so not the font swap; under the 0.1
threshold, to look at in the audit). Phone (390×844): the home page is 6.1 screens without the footer (hero 520,
finder 1107, menu 745, first visit 587, page links 490, questions 606, visit 1047 px); the phone bar with Book stays
on screen. axe: no serious or critical violations on the demo or the client fixture (tests/e2e/a11y.spec.js).

## 16 Nov 2026 — after the audit (SK-05, SK-07)

The 0.021 shift came from the finder's row of words: hidden until the script ran, it pushed the first card down on a
slow phone (Lighthouse's 4× CPU). The row now keeps its space from the first paint (hidden, not removed), so nothing
below it moves. Home page on a 390×844 phone: 5.98 screens without the footer, 6.63 with it (was 6.1 and 7.06): with
the first-visit page on, the home page keeps only the patch-test card; the page links are smaller rows; the footer
leaves out the week's hours on the home page, where Find us already shows them.

Lighthouse mobile after the fix: performance 100, accessibility 100, LCP 1.7 s, layout shift 0.001.

## 16 Nov 2026 — first screen (owner decision)

The photograph is now `clamp(360px, 100svh − 330px, 600px)` tall on desktop and `clamp(300px, 100svh − 440px, 520px)`
on phones, so the question and the five words are on the first screen: 1280×800 photo 470 px, words end at 777 px;
1440×900 photo 570 px, words end at 883 px; 390×844 photo 404 px, words end at 762 px, above the phone bar (775 px).
All measured with the demo ribbon. Lighthouse mobile: performance 100, accessibility 100, LCP 1.7 s, layout shift 0.001 on a phone; on desktop it was 0.013–0.022 (correction below).

## 16 Nov 2026 — desktop layout shift (SK-09)

Correction: the earlier 0.001 was true on phones only. On desktop the question re-wrapped from two lines in the
fallback font to one in Antic Didone (shift 0.013–0.022 at 1280, 1366 and 1440). Fixed by setting the fallbacks by the
rendered width of the home page's question and card text (Antic Fallback 111.9%, ascent 84.0%, descent 22.3%;
Baskervville Fallback 400 109.8%, ascent 90.9%, descent 26.9%) and giving the question an em-based width (15.3em, not
ch, which changes with the font). The question and the words now sit at the same place with the fonts blocked and
loaded at 1280×800, 1366×768, 1440×900 and 390×844. Layout shift at 4× CPU: 0.000 at all four sizes. Lighthouse:
desktop 100/100, layout shift 0, LCP 0.4 s; mobile 100/100, layout shift 0, LCP 1.7 s.

The question also gets `max-width: 24em` and `text-wrap: balance`: one line on desktop and two balanced lines on a phone in the display font and in a wide fallback (DejaVu Serif, for machines without Times or Liberation): 52/55/56/68 px tall at 1280/1366/1440/390 either way.

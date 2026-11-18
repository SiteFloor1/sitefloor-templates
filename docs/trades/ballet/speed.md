# Children's dance and ballet schools: speed

## 17 Nov 2026 — ballet kit: The round look, Wrenna demo

Whole site: JS 10.5 KB gz, CSS 9.9 KB gz (The round draws its own header, menu sheet, footer, phone bar, visit, Plan
your visit, questions, reviews and general pages), fonts 45 KB (Hahmlet, one variable latin woff2 for every weight).
HTML gz: home 7.7 KB, classes 5.3 KB, timetable, trial 5.3 KB, uniform 5.2 KB, Plan your visit 6 KB.
Images: home 123 KB, 34.3 KB of it on the first screen (the stage in the circle, 1200×1200 WebP); the trial and
uniform circles are lazy. Inner pages carry one lazy 900×900 circle each (38 to 51 KB) or none. The ring of dates is
SVG text, so it costs no image. Places left and show day load nothing on a demo (simulated in the browser); a client's
are one small CSV each.
Fallback font size-matched in Chrome, laid out in the page against Liberation Serif (regular below 600, bold from
600), in seven weight bands: 100–229 119.2%, 230–329 119.9%, 330–389 122% (the reading weight, matched on the site's
own paragraphs), 390–469 121.1%, 470–539 122.5%, 540–599 123.2%, 600–900 119.8% (the bold words of every heading);
ascent and descent are hhea 1160/288 per 1000 divided by each band's adjustment. Headline widths are set in em, not
ch. A heading's heavy words always take their own line, and on a phone page headings are sized so each line fits
whole (min(54px, 10.6vw); the privacy heading min(46px, 8.6vw)), so a heading's line count never depends on the font.
The client fixture (Plus, the school's places sheet): builds with no demo code; JS 8.7 KB gz, CSS 8.2 KB gz; home
84.8 KB of images, 34.3 KB on the first screen.

Lighthouse 12.6 mobile, Wrenna home, local server (three runs): performance 100, 100, 100; accessibility 100;
FCP 1.2 s; LCP 1.7 s (the stage); TBT 40–60 ms; layout shift 0.001 to 0.017 (the year's line as Hahmlet replaces
its fallback; the finder keeps a line for each session's places while the sheet loads, so places arriving move nothing).
Phone layout-shift test (360, 390, 412 px) and accessibility (axe, every page): pass on the demo and the fixture
(tests/e2e/all-sites.spec.js and a11y.spec.js run locally for this kit).

### 17 Nov 2026, after audit G (BL-04)
Layout shift with the CPU slowed four times, every demo page (15) and every client fixture page (7), at 1440, 390 and
360 px: at most 0.009 (was 0.126 on Uniform, 0.077 on Show day, about 0.05 on Classes; the cause was headline widths
in `ch` and one fallback band for all weights). No page is wider than the screen at 360 or 390 px (Privacy was 430:
the shared privacy heading at a phone size; Show day's intro now wraps).

### 18 Nov 2026, after re-check C (BL-06)
With Hahmlet held back 1.5 s, every demo page (15) and client fixture page (7) at 360, 390, 1024 and 1440 px: layout
shift at most 0.019 (client privacy at 360); demo at most 0.012 (was 0.170 on Fees, 0.118 on Teachers, 0.067 on Show
day, 0.051 on Privacy). `tests/e2e/ballet.spec.js` now holds every page at 360 and 390 px under 0.02 with the font late.


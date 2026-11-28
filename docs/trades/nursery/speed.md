# Day nurseries and pre-schools: speed

## 27 Nov 2026 — nursery kit: The atelier wall look, Alnwood demo

Whole site: JS 30 KB (10.9 KB gz), CSS 47.9 KB (10.5 KB gz; The atelier wall draws its own header strip, menu sheet,
footer, phone bar, visit, Plan your visit, questions and general pages), fonts 66.1 KB (Gentium Book Plus 400, 400
italic and 700, latin woff2). HTML gz: home 8.4 KB.
Images: home 554.9 KB, 171.3 KB of it on the first screen (the work, WebP); everything below is lazy. Places and
today's notice load nothing on a demo (worked out in the browser); a client's are one small CSV each.
Fallback fonts size-matched in Chrome, laid out in the page against Liberation Serif first: roman 102.8% (ascent
106.9%, descent 35.6%), italic 91.8% (119.7%, 39.9%), bold 102.8% (106.9%, 35.7%). On a phone, page headings and
intros reserve their lines, so a heading's line count never moves the page.
The client fixture (Plus, the nursery's places and today sheets): builds with no demo code; JS 8.6 KB gz, CSS 8.3 KB gz.

Layout shift with Gentium held back, every demo page at 360, 390 and 1440 px: at most 0.008. The shared privacy page
at most about 0.021 (shared text, limit 0.05 there); `tests/e2e/nursery.spec.js` holds every kit page under 0.02.
Phone layout-shift test and accessibility (axe, every page): pass on the demo and the fixture (run locally for this kit).
Lighthouse: not run locally; to record after the preview.

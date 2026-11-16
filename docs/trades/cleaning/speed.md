# Domestic and commercial cleaning: speed

## 15 Nov 2026 — Linnet (cleaning kit, Plumb look)

Whole demo (Signature, 14 pages): JS 12.5 KB gz, CSS 11.9 KB gz, fonts 58.4 KB (Anek Latin 400/600/800, latin
woff2). Home HTML 8.6 KB gz; home images 156 KB, 91.7 KB on the first screen (the living room, 1600×800 WebP);
everything below is lazy. The optional 3D illustration loads only on tap: 123 KB gz (three.js and the model), never
on first load; `tests/unit/cleaning.test.js` keeps it within 15% of the figure in `kit.js`. Service pages carry one photograph each, loaded first
(the largest page image). The client fixture (Signature, sheet-driven free days): JS 11.4 KB gz, CSS 10.1 KB gz.

Fallback font size-matched from the font files against Liberation Sans: Anek Latin 400 93.8% (ascent 95.9%, descent
21.3%), 600 97% (92.8%, 20.6%), 800 100.6% (89.4%, 19.9%). The headline is set on two fixed lines so the swap never
re-wraps it.

Lighthouse 12 mobile, local server (16 Nov): home 100 / 100 / 100 (performance, accessibility, best practices; LCP
1.5 s, the photo; TBT 0; CLS 0.000). Short-let turnovers, Deep cleans and End of tenancy: 100 / 100 / 100, CLS 0.000.
The client fixture's home: performance 99, CLS 0.000. Plan your visit and Offices (first build): 99–100 / 100 / 100.
(SEO is low on demos only because they are noindex.)

Layout shift with scripts held back 2.5 s (Playwright, layout-shift entries): phone home 0.001, phone Short-let 0.0002,
client home 0.001, desktop home 0.001 at 1280 and 1440. The strip is drawn at its final size in the HTML: the figure
size and the minute hairlines are set in `cqw` for the default home exactly as the script sets them, the controls are
drawn from the first paint (hidden only when scripting is off), and on phones a room's task list starts closed. On
service pages the sentence comes after the strip on phones, so the font arriving moves nothing above the fold.
Remaining at 1024 wide: about 0.02–0.05 from text re-wrapping when Anek Latin replaces its fallback (the header and the
line above the strip), as on other pages.

Home page at 390 × 844: 6.3 phone screens without the footer, 7.0 with it (first build 10.7). On phones the office
section is left off the home page (the office, its hours and the map are on Plan your visit, one tap from the menu),
the room list opens when a room is tapped, the bill starts at the time on site (the rooms are in the strip just
above), the extras sit two to a row and the key log puts each place under its time. At 1440 × 900 the photo, the
headline and the whole room strip fit the first screen (`cleaning.spec.js`).

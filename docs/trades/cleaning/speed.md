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

Lighthouse 12 mobile, local server: home performance 99, accessibility 100, best practices 100 (LCP 2.0 s, the
photo; TBT 0; CLS 0.03, the strip settling its figure size). Regular cleaning, Deep cleans, Short-let turnovers, End of
tenancy and the journal article: 100 / 100 / 100, CLS 0.01 or less. Plan your visit and Offices (first build): 99–100 /
100 / 100. (SEO is low on demos only because they are noindex.)

Home page at 390 × 844: 6.3 phone screens without the footer, 7.0 with it (first build 10.7). On phones the office
section is left off the home page (the office, its hours and the map are on Plan your visit, one tap from the menu),
the room list opens when a room is tapped, the bill starts at the time on site (the rooms are in the strip just
above), the extras sit two to a row and the key log puts each place under its time. At 1440 × 900 the photo, the
headline and the whole room strip fit the first screen (`cleaning.spec.js`).

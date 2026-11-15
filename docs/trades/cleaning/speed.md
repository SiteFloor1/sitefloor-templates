# Domestic and commercial cleaning: speed

## 15 Nov 2026 — Linnet (cleaning kit, Plumb look)

Whole demo (Signature, 16 pages): JS 12.5 KB gz, CSS 11.2 KB gz, fonts 58.4 KB (Anek Latin 400/600/800, latin
woff2). Home HTML 8.6 KB gz; home images 156 KB, 91.7 KB on the first screen (the living room, 1600×800 WebP);
everything below is lazy. The optional 3D illustration loads only on tap: 123 KB gz (three.js and the model), never
on first load; `tests/unit/cleaning.test.js` keeps it within 15% of the figure in `kit.js`. Heaviest inner page: Short-let
turnovers, 21 KB of images. The client fixture (Signature, sheet-driven free days): JS 11.4 KB gz, CSS 10.1 KB gz.

Fallback font size-matched from the font files against Liberation Sans: Anek Latin 400 93.8% (ascent 95.9%, descent
21.3%), 600 97% (92.8%, 20.6%), 800 100.6% (89.4%, 19.9%). The headline is set on two fixed lines so the swap never
re-wraps it.

Lighthouse 12 mobile, local server: home performance 98, accessibility 100, best practices 100 (LCP 2.3 s, the
photo; TBT 0; CLS 0.03, the strip settling its figure size). Plan your visit, Offices, End of tenancy, What's included
and Regular cleaning: performance 99–100, accessibility 100, best practices 100, CLS under 0.005. (SEO is low on
demos only because they are noindex.)

Home page at 390 × 844: 7.6 phone screens without the footer, 8.3 with it (first build 10.7). On phones the room list
opens when a room is tapped, the bill starts at the time on site (the rooms are in the strip just above), and the
office section shows today's hours only (the week is on Plan your visit). At 1440 × 900 the photo, the headline and
the whole room strip fit the first screen (`cleaning.spec.js`).

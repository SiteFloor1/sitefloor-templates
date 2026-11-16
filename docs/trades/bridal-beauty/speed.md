# Bridal hair and makeup artists: speed

## 16 Nov 2026 — guide pages and the journal (bridalbeauty-guides, bridalbeauty-journal)

The demo is now 15 pages (home, bridal, looks, trials, the morning, skin, six guide pages, the journal, Plan your
visit, privacy), plus three journal pieces. Guide pages and pieces are plain HTML: no script of their own, photos lazy
except the page's own (first screen). Lighthouse 12.6 mobile, local server: home 100 / 100 / 100 (LCP 1.4 s, layout
shift 0); Weddings abroad 100 / 100 / 100 (LCP 1.1 s, layout shift 0). Phone layout-shift test (360, 390, 430 px;
fonts held back 800 ms) on every new page: worst 0.017. axe on all 18 pages, phone and desktop, menu open: no serious
or critical issues. The masthead's caps now clear the header by 15–21 px at every width (both cover variants).

## 15 Nov 2026 — bridalbeauty kit: Cover look, Isolde demo

Whole site: JS 33 KB (12.3 KB gz), CSS 42.4 KB (9.6 KB gz), fonts 60.6 KB (Libre Bodoni 400 normal and italic,
Faustina 400/600; latin woff2). HTML gz: home 6.4 KB, bridal 5.7 KB, looks 5.5 KB, morning 5.4 KB, trials 6 KB, skin
5.1 KB, Plan your visit 6.6 KB.
Images: home 173.7 KB, 47.7 KB of it on the first screen (the cover, 1600×1920 WebP, and its cut-out); This season and
the party photo are lazy. Looks 202.8 KB (nine 800×1000 photos, lazy), bridal 27 KB. The demo's diary is worked out in
the browser; a client's is one CSV from their Google Sheet.
Fallback fonts size-matched from the font files against Liberation Serif / Times New Roman (a set sentence's average
width, hhea metrics): Libre Bodoni 108.9% (ascent 84.9%, descent 29.9%), italic 106.4% (86.8%, 30.6%); Faustina 400
98.8% (105.6%, 22%), 600 97.4% (107.1%, 22.3%).
The home page on a 390 px phone: 5.98 screens.
The client fixture (Plus, the name above her head, the artist's sheet): builds with no demo code.

Lighthouse 12.6 mobile, Isolde home, local server (two runs): performance 100, 99; accessibility 100; best practices
100; FCP 1.3–1.4 s; LCP 1.7–2.0 s (the cover); TBT 20–50 ms; layout shift 0.
Phone layout-shift test (360, 375, 390, 412, 430 px; fonts held back 800 ms): worst 0.027 (Plan your visit at 390 px);
every kit page under 0.001 after page headings kept two lines' height on a phone and the looks' filters scrolled
instead of wrapping.
Accessibility (axe, every page, phone and desktop, menu open): no serious or critical issues, after the phone's This
season row became keyboard-scrollable.

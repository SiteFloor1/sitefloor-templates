# Wealth managers: speed

## 4 Nov 2026 — Lyall Harrow (wealth kit, Foreshore look)

Whole demo (Signature, 16 real pages plus four adviser pages): JS 12 KB gz, CSS 11.1 KB gz, fonts 40.9 KB (Mona Sans 300/400, latin woff2). Home
HTML 7.8 KB gz; home images 801 KB, 27.6 KB on the first screen (the misty shore, 2000×875 WebP; 900×1125 on phones);
everything below is lazy. Heaviest page: Family and succession, 284 KB of images (254 KB on the first screen). The
client fixture (Plus): JS 6.2 KB gz, CSS 7.0 KB gz. Fallback font size-matched from the font files against Liberation
Sans: Mona Sans 300 102.3% (ascent 106.5%, descent 31.3%), 400 103.8% (105%, 30.8%). The headline is set on fixed
lines so the font swap never re-wraps it. The added pages are light: documents 7.5 KB HTML gz and no images, events
6.5 KB (drawn from the sheet), each adviser page 6.6 KB plus one 800×1000 photo (about 67 KB, on the first screen).

Lighthouse 12.8 mobile, demo home, local server: performance 99, accessibility 100, best practices 100; FCP 1.4 s;
LCP 1.8 s (the shore); TBT 40 ms. Layout shift while loading (PerformanceObserver, real fonts): 0 at 360 and 390 px,
0.0001 at 1440 px (header links on the font swap).

**5 Nov 2026 (audit W-02, W-03).** The script-only controls (family map, meeting form, insight filters, documents
picker, office clocks) now keep their space while the script starts, so nothing below them moves. `wealth.spec.js`
loads every demo page at 390 px with scripts held back 800 ms: layout shift under 0.02 on all of them (it was up to
0.37 on the family map, 0.26 on Arrange a meeting, 0.256 on Events). How we help sits in two columns on phones: the
home page is now 6.0 phone screens at 390 × 844 without the footer, 7.2 with it (it was 7.9 and 9.1).

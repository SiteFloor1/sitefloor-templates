# Nail, lash and beauty salons: speed

## 29 Oct 2026 — nails kit: Quail look, Verrall demo (figures refreshed 2 Nov 2026, after the work and team photos)

Whole site: JS 15.0 KB gz (14.9 KB until 3 Nov, when the law and pilates kits added a few bytes to every site), CSS 14.8 KB gz (Quail now draws its own visit, Plan your visit, team, work, gallery,
questions, reviews, vouchers, page links, photo band, general pages and seasons), fonts 71.5 KB (Old Standard TT 400
and italic, Plus Jakarta Sans 400/600; latin woff2). HTML gz: home 8.5 KB, menu 8.3 KB, shades 7.0 KB, Plan your visit
7.2 KB. Images counted: home 253.6 KB, 37.5 KB of it on the first screen (the hand, 1200×1500 WebP); the edit, the menu
photos and the salon are lazy. Art page 297.5 KB (four sets and the photo strip), work 146.6 KB (its own six photos), shapes
150.8 KB, team 46.8 KB (its own three), menu 94.4 KB, shades 76.6 KB (the finish stills). Not counted because they load only on a tap:
"Shade on your hand" reads the hand photo and its mask (grayscale PNG) the first time someone reaches for the rail,
and works out the nails' broad light once (55–85 ms on a laptop, off the page load); the four photographed shades of
the first hand are fetched when tapped.
Fallback fonts size-matched from the font files against Liberation Serif / Sans: Old Standard TT 107.8% (ascent 70.7%,
descent 22.1%, line gap 21.9%), italic 108.2%; Plus Jakarta Sans 400 102.3% (ascent 101.5%, descent 21.7%), 600 98.9%.
The client fixture (Plus, photographed shades only): JS 8.8 KB gz, CSS 11.6 KB gz, home images 24.1 KB.

Lighthouse mobile, Verrall home, from a fresh gzip server. First build: 81 (cold), 85, 88; total blocking time 480–680 ms
because the hero read the hand's pixels for recolouring while the page loaded. After moving that to the first time the
rail is touched: 98 (cold), 98, 98; accessibility 100; FCP 0.8 s; LCP 1.5–2.2 s (the hand); TBT 90–160 ms; layout shift 0.
2 Nov 2026, after the tighter masks, the replaced photos and Quail's own inner pages (five runs): 80 (cold, TBT 760 ms),
97, 100, 100, 94; accessibility 100; FCP 0.9–1.0 s; LCP 1.5–2.4 s; TBT 0–230 ms after the first run (the time is the
document's own parsing and styles, not the feature scripts); layout shift 0–0.001.
Phone layout-shift test (360, 390, 412 px, open and closed): passes on the demo and the fixture.

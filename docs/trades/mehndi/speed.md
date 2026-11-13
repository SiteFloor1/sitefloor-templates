# Mehndi and henna artists: speed

## 9 Nov 2026 — mehndi kit: Loupe look, Hatheli demo

Whole site: JS 10.1 KB gz, CSS 10.1 KB gz (Loupe draws its own header, menu sheet, footer, phone bar, visit, Plan your
visit, questions, reviews and general pages), fonts 65.3 KB (Darker Grotesque 300/500, Source Serif 4 300/400; latin
woff2). HTML gz: home 7.3 KB, bridal 5.9 KB, designs 5.0 KB, Plan your visit 5.5 KB, planner 4.7 KB.
Images counted: home 566.5 KB, 68.6 KB of it on the first screen (the palm, 1300×1544 WebP); the bride's photos, the
21:9 photo and the guest sizes are lazy. Designs 784.3 KB (nine 800×1000 photos; 310.6 KB in the first screen on a
desktop), bridal 437.7 KB, aftercare 208 KB, personal 68.6 KB (the palm again, lazy). The magnifier is the same palm
photo drawn larger, so it loads nothing more. The demo's diary is worked out in the browser; a client's is one CSV.
Fallback fonts size-matched from the font files against Liberation Sans / Serif (a set sentence's average width,
typo metrics): Darker Grotesque 300 80.4% (ascent 131.9%, descent 36.8%), 500 84.1% (ascent 126.1%, descent 35.2%);
Source Serif 4 300 114.8% (ascent 90.3%, descent 29.2%), 400 115.5% (ascent 89.7%, descent 29%).
The client fixture (Plus, the artist's sheet): builds with no demo code; home images lazy except the palm.

Lighthouse 12.6 mobile, Hatheli home, local gzip server (three runs): performance 100, 100, 97; accessibility 100;
FCP 0.9–1.0 s; LCP 1.4–2.7 s (the palm); TBT 0–30 ms; layout shift 0.
Phone layout-shift test (360, 390, 412 px, open and closed): passes on the demo and the fixture, after giving "Show me"
and its line their space before the script starts (they appeared late and moved the palm down 48 px).
Accessibility (axe, every page, open and closed): no serious or critical issues, after the unchosen guest sizes stopped
dimming their words (only their photos dim now).

## 12 Nov 2026 — owner's review: Rozha One, rust buttons, larger text, "Your stain, day by day"; audit H-01, H-02

Fonts 57.9 KB (was 65.3): Rozha One 400 replaces Darker Grotesque 300/500. Fallback: Rozha One 113.4% against
Liberation Serif (ascent 88%, descent 37.2%). JS 10.2 KB gz, CSS 10.3 KB gz. The new home section adds its photos
lazily, below the first screen. Lighthouse 12.6 mobile, Hatheli home: performance 100, accessibility 100, FCP 1.0 s,
LCP 1.4 s, TBT 20 ms, layout shift 0. Layout shift at 390 px with page scripts held back 1.5 s: designs 0 (was 0.078:
the filters now keep their space before the script starts), every other page under 0.001.

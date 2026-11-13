# Clothing brands (menswear, running and outerwear): speed

## 29 Oct 2026 — Isotach: wear kit, Basalt look (branch `trade/menswear`)

Whole site: JS 17.9 KB gz, CSS 14.7 KB gz (with the countdown and size finder), fonts 58.1 KB (Host Grotesk 300/500, Rethink Sans 400/500, latin woff2).
HTML gz 4–10 KB a page. Home images 1,491 KB in all but 159 KB on the first screen (the hero is a foggy black-and-white
2000 px WebP, 27 KB); the rest are lazy: five pieces in the carousel, four close-ups, the club, a band, two page links and
six "Worn" tiles. The close-ups were re-encoded (1000 px, q52–56, a 0.5 px soften on the woven ones) after the first build
came in at 2,171 KB, over the 2,000 KB cap. Lookbook 839 KB (cover photo first, 29 KB); a piece's page 400–510 KB.
Fallback fonts size-matched from the font files against Liberation Sans: Host Grotesk 106.4% (ascent 95.4%, descent
29.6%), Rethink Sans 400 104.5%, 500 102.5%. Lighthouse mobile, demo home, fresh server: 91 (first, cold), 88, 98, then 95
after the contrast fix; accessibility 97 → 100 (the dim grey #737875 failed on the size run's "Gone"; now #8A8E8B,
5.3:1); LCP 1.8–3.7 s; TBT 140–330 ms; layout shift 0.001.

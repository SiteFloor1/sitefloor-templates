# Grand cafés and tea rooms: speed

## 28 Oct 2026 — grand café: Salon look, Grenat demo (restaurant kit)

Whole site: JS 14.4 KB gz, CSS 14.6 KB gz, fonts 92.2 KB (Libre Caslon Display 400, Libre Caslon Text 400 and italic,
Instrument Sans 500; latin woff2). Home HTML 13.8 KB gz. Images counted on the home page 427 KB of 800 (the afternoon tea
spread, the three tiers, the plate, the sommelier, the piano). The room in the hero is a CSS background chosen by the
hour, so the budget doesn't count it: a visitor fetches one of them only, 174 KB by day on desktop, 127 KB on a phone,
30 KB / 16 KB by candlelight. Real home page weight on a phone by day: about 555 KB of images. One shared grade
(lifted blacks, warm highlights, softer colour). Fallback fonts size-matched from the font files against Liberation
Serif / Sans: Caslon Display 93% (ascent 104.3%, descent 28.6%), Caslon Text 116.9% (italic 117.1%), Instrument Sans 500
104.3%. Axe passes on every page by day and by candlelight; layout shift 0.
Lighthouse mobile, demo home, three runs from a fresh server: 77 (first, cold: TBT 910 ms), 93, 90; accessibility 100;
FCP 0.9–1.0 s; LCP 2.4–2.5 s; TBT 910 / 270 / 320 ms; layout shift 0.

## 28 Oct 2026 — Grenat: the window, salon plan, seasonal stands, four new pages, sharper hero

Whole site: JS 19.1 KB gz, CSS 18.3 KB gz, fonts unchanged (92.2 KB). HTML gz: home 15.4 KB, afternoon tea 10.6 KB,
gifts 8.0 KB, What's on 8.1 KB, Plan your visit 8.7 KB. Images counted: home 428 KB (the window's six pieces are lazy,
700×875 WebP, 20–62 KB each), afternoon tea 537 KB (the salon plan's 1800×1200 photo is 174 KB), What's on 204 KB,
gifts 67 KB (the sharper box photo); all under 800. The hero room is a CSS background the budget doesn't count, now 1x and 2x by image-set: a
desktop by day fetches 240 KB (1x) or 449 KB (2x screens), a phone 208 KB or 382 KB, by candlelight 37 KB (1x) or 155 KB (2x) on desktop. Real home
weight on a 2x phone by day is therefore about 810 KB of images. Axe passes on all nine pages by day and by night;
layout shift 0. Lighthouse mobile, demo home, fresh server: 74 (cold, TBT 860 ms), then 92; accessibility 100; LCP
2.7–3.0 s (the 2x hero); layout shift 0.

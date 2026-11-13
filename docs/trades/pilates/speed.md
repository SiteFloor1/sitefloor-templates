# Reformer Pilates studios: speed

## 30 Oct 2026 — pilates kit: Dune look, Ottoline demo (branch `trade/pilates`)

Whole site: JS 14.7 KB gz, CSS 12.6 KB gz, fonts 74.9 KB (Noto Serif Display 200/300 and 300 italic, Red Hat Text
400/500; latin woff2). HTML gz 5–8 KB a page (home 8.0 KB). Home images 433 KB, 94 KB on the first screen (the hero
reformer photograph: a 2400 px WebP, and a separate 1000 px phone crop); the intro photo and the page-link cards are
lazy. Classes page 88 KB (the reformer clip's poster; the 391 KB film is fetched only when someone taps Watch);
retreats 113 KB; work 336 KB (all lazy). Fallback fonts size-matched from the font files against Liberation Serif /
Sans: Noto Serif Display 200 108.4% (ascent 98.6%, descent 27%), 300 111.5% (95.9%, 26.3%), 300 italic 106.6% (100.3%,
27.5%); Red Hat Text 400 98.9% (102.9%, 30.8%), 500 101.4% (100.4%, 30.1%). The client fixture (Plus): JS 10.1 KB gz,
CSS 8.6 KB gz.

Lighthouse mobile, Ottoline home, three runs from a fresh server (the first cold): 95, 98, 99; accessibility 100;
FCP 1.4 s; LCP 1.7–2.4 s (the hero photograph); TBT 30–180 ms; layout shift 0–0.002. The phone layout-shift test and
axe pass on every page of the demo and the fixture.

## 2 Nov 2026 — Ottoline, Signature round two (31 pages)

Whole site: JS 18.7 KB gz (18.9 KB after the 2 Nov audit fixes and merges), CSS 14.4 KB gz, fonts unchanged (74.9 KB). HTML 5–8 KB gz a page. Home images 424 KB, 94 KB
on the first screen (unchanged). New pages, first-screen images: class pages 43–92 KB, exercise pages 25–105 KB, method
188 KB (only the first photograph is high priority; the rest lazy), retreat pages 113–214 KB (the Cotswolds photograph
re-encoded at 1400 px, q60 with a 0.6 px soften, after it came in at 427 KB, over the 400 KB cap), teacher pages 8–24
KB, settings and passport 0 KB. The client fixture (Plus): JS 10.1 KB gz, CSS 9.5 KB gz.

Lighthouse mobile, two runs each from a fresh server: home 99, 99 (LCP 1.4–1.6 s); method 100, 97 after the priority
fix (93, 94 before; LCP 3.1 → 1.4–2.5 s); a class page 100, 98. Accessibility 100 on all three; layout shift ≤ 0.003.
Full `npm run check`: 313 unit tests, 1,177 browser tests passed, every site in budget.

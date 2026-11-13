# Car hire: speed

## 29 Oct 2026 — Datum Hire (car hire, look `datum`)

Whole site: JS 24.9 KB gz (the kit's showpieces are on the edge of the 25 KB budget; any new script should load on tap),
CSS 16.3 KB gz, fonts 56.2 KB (Red Hat Display 300/400/500/600, latin woff2; fallback metrics measured against Liberation Sans).
Home HTML 14.2 KB gz; home images 1,774 KB in all, 149 KB on the first screen. Car pages 7–10 KB gz HTML, 50–364 KB of
images (first screen 40–204 KB); class pages first screen 120–353 KB; fleet page 0 KB on the first screen (lazy). The
hero film (animated from one photograph on the demo) is 182 KB and loads only after the page. Lighthouse mobile, demo
home, fresh server: 98 (cold, TBT 160 ms), then 99; accessibility 100; LCP 0.9–1.0 s; layout shift 0.001. A car page
and the fleet page: 100 and 99, accessibility 100. Axe and the phone layout-shift test: in `npm run check`.

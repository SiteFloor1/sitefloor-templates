# Car detailing: speed

## 5 Nov 2026 — paint chart and lease-return check

Whole demo: JS 18.0 KB gz (from 17.3), CSS 13.0 KB gz (from 12.7); on tap 157.7 KB gz (from 155.6) for the swatches
and finishes. No new images or models: the colour is set on the car already loaded, and the lease-return page reuses
the cloth photograph. Home page unchanged.

## 4 Nov 2026 — real 3D cars, the film builder, service pages

On tap: 155.6 KB gz of script, then one car: the SUV (default) 2.4 MB, saloon 2.5 MB, hatch 1.3 MB (the budget's
limit is 2.6 MB a car). Each is downloaded once and only when picked. Whole demo now 19 pages plus privacy: JS 17.3 KB gz,
CSS 12.7 KB gz; home images 493 KB, 187 KB on the first screen. New gallery and service photographs are 900 px
crops in the grid (35–67 KB each).

## 4 Nov 2026 — detailing kit: Mackerel look, Varnell demo (branch `trade/detailing`)

Whole site (demo, Signature, 20 pages): JS 15.0 KB gz, CSS 12.3 KB gz, fonts 49.9 KB (Funnel Display 300/400, Sora
300/500; latin woff2). HTML 4–9 KB gz a page. Home images 616 KB in all, 187 KB on the first screen (the rest lazy; the page links use 900 px
crops). The home page's first screen is the headlight photograph (a 2400 px WebP,
157 KB; a separate 900 px phone crop, 29 KB). The 3D car loads only on tap: 154.8 KB gz of script (three.js and the bay)
and the shared concept car (1.7 MB), the same model and size as the car studio's Showroom. The strip light's reflection
and the swirls are drawn in the paint's shader rather than with three.js's area light, whose lookup tables would have
put the on-tap script at 256 KB gz. Fallback fonts size-matched from the font files against Liberation Sans: Funnel
Display 300 105.4% (ascent 94.9%, descent 23.7%), 400 106.1% (94.2%, 23.6%); Sora 300 112.2% (86.5%, 25.9%), 500
113.8% (85.2%, 25.5%). The client fixture (Signature, sheets and the inspection light): JS 11.3 KB gz, CSS 9.5 KB gz.

Lighthouse mobile, two runs each from the local server: home 98, 97 (FCP 1.4 s, LCP 2.4 s, the hero photograph; TBT
20–40 ms; layout shift 0); paint correction 95, 100 (LCP 1.5–2.8 s; layout shift 0.019). Accessibility 100 and best
practice 100 on both. axe and the site-wide checks pass on every page of the demo and the fixture.

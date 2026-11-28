# Weather (shared)

One source for every forecast on every site: **MET Norway's Locationforecast 2.0** (free, commercial use allowed,
CC BY 4.0). Open-Meteo's free tier is non-commercial only, so client sites never use it for free.

| Piece | Where | What it does |
|---|---|---|
| Reading MET | `src/core/lib/met.js` | The named sender (`Sitefloor/1.0 hello@sitefloor.com`), the URL, MET's answer read into `{ updated, fetched, hours: [{ time, cloud, rain }] }`, the credit |
| The function | `functions/weather.js` → `src/core/lib/weather-edge.js` | `/weather?place=<id>` on a client site (Cloudflare Pages Functions, free plan) |
| The build | `scripts/lib/weather.js` | Client: `weather/places.json`, the only places its function answers for. Demo: `weather/<id>.json`, fetched now when `SITEFLOOR_WEATHER=fetch` (the daily demo rebuild) |
| The page | `src/core/js/weather.js` | `loadWeather(ctx, id)`, `weatherCredit(w, demo, tz)`, `localHour(iso, tz)` |

A kit lists the places its forecast features read in `kit.js` → `weather(site)` (`[{ id, lat, lon }]`). That is all a
kit adds: no CSP change (the page only calls its own site), and the privacy page says where forecasts come from.

**No visitor's browser calls MET.** On a client site the browser asks the site's own `/weather`. The function keeps
MET's answer in Cloudflare's cache until MET's `Expires` (at least 1 minute), so one call to MET serves every visitor
of that site in that data centre; a refresh asks with `If-Modified-Since`. When MET can't be reached, the last answer
(kept 6 hours) is served and MET is asked at most once a minute; past that, the page shows no forecast. The cache does nothing on `*.pages.dev` previews (each
visit there asks MET), which is fine at preview traffic.

**Demos** (GitHub Pages runs no functions) show the copy the daily rebuild fetched, labelled "fetched 04:23 today".
Local builds, tests and CI fetch nothing, so a demo built there shows no forecast line. Any forecast over 36 hours old
is not shown.

**Credit** wherever a forecast shows: "MET Norway (CC BY 4.0)", both linked (`weatherCredit`).

**Limits (free):** Cloudflare's free plan allows 100,000 function requests a day across the whole account, cache hits
included. Only pages with a forecast line call `/weather`, once per place per visit, and the browser keeps the answer
for MET's expiry time, so this is far off for now; watch it in the dashboard past roughly 50 busy clients.

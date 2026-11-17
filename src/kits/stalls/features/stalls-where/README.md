# Where to find us this week

| | |
|---|---|
| Feature id | `stalls-where` |
| Plan | starter and above |
| Config | `stops`: `source` ("sheet", or "simulated" on demos), `csvUrl`, `staleAfterDays?` (default 10), `fallback` (one line, e.g. "Check our Instagram for this week's stops."), `places` [{ `id`, `name`, `market?`, `postcode`, `lat?`, `lon?`, `usual?`, `pitch?` }], `usual` [{ `day`, `place`, `open`, `close` }]; `sections.where` |

## How it works
The stall keeps one sheet and adds a row per stop:

```
date,place,open,close,status,note,updated_at
2026-11-21,hackney,11:00,18:00,on,,2026-11-17 09:12
2026-11-22,walthamstow,11:00,17:00,cancelled,Market closed for the fair,2026-11-17 09:12
```

`place` is one of `stops.places` ids (or a free name); `status` is on or cancelled. The page lists what's still to
come, soonest first, marks "Here now" while a stop is trading and keeps cancelled stops (struck) so nobody makes a
wasted trip. Each stop has Directions (a maps search: no paid map) and Add to calendar (an .ics made in the browser).
The chosen stop is shared (`stallsChosen`) with the hero's countdown (`stalls-next`) and the rain check.

## When something is missing or fails
Fails closed: a sheet that can't be read in 6 seconds, a missing column, a bad row, or a newest `updated_at` older than
`staleAfterDays` shows the usual week marked "Usually" and the stall's fallback line. Without JavaScript the usual week
shows, marked the same way. A site using the sheet allows `docs.google.com` in its security policy.

Logic in `lib/stalls.js` (`stopsFromCsv`, `weekFromPattern`, `upcoming`, `stopIcs`); the sheet in `sheet-provider.js`;
the demo's week in `src/demo/stalls-stops-provider.js`. Registered in `src/kits/stalls/kit.js`.

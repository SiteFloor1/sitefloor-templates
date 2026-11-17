# Rain check (add-on)

| | |
|---|---|
| Feature id | `stalls-rain` |
| Plan | plus and above; sold as an add-on |
| Config | `rain` { `source`: "forecast" (or "simulated" on demos) }; `lat` and `lon` on each market in `stops.places` |

On the day of a stop, and the day before, one line under the next stop: "Rain likely from 15:00, by the forecast", or
"Dry, by the forecast". From Open-Meteo (free, no key, no cookies; the security policy allows `api.open-meteo.com`).
The forecast never cancels a stop: only the stall's sheet does, and the page says "Cancelled" only then. The line sits
in the hero's next-stop block (`data-rain-line`); this folder holds the script.

## When something is missing or fails
No forecast, a slow reply (6 s), a market without lat and lon, or a stop more than a day away: no line at all.

Registered in `src/kits/stalls/kit.js`; the demo's forecast in `src/demo/stalls-rain-provider.js`.

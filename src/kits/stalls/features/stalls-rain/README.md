# Rain check (add-on)

| | |
|---|---|
| Feature id | `stalls-rain` |
| Plan | plus and above; sold as an add-on |
| Config | `rain` { `source`: "forecast" }; `lat` and `lon` on each market in `stops.places` |

On the day of a stop, and the day before, one line under the next stop: "Rain forecast from 15:00." (the first hour
in the stop's hours with 0.2 mm or more), or "Dry, by the forecast.", followed by the credit the licence asks for:
"MET Norway (CC BY 4.0), updated 08:00." (both linked). From MET Norway's forecast through the shared weather function
(`src/core/js/weather.js`, `functions/weather.js`): the visitor's browser only calls the site's own `/weather`. A demo
reads the copy its daily rebuild fetched, and says "fetched 04:23 today" instead.
The forecast never cancels a stop: only the stall's sheet does, and the page says "Cancelled" only then. The line sits
in the hero's next-stop block (`data-rain-line`); this folder holds the script.

## When something is missing or fails
No forecast, a slow reply (6 s), a forecast over 36 hours old, a market without lat and lon, or a stop more than a
day away: no line at all.

Registered in `src/kits/stalls/kit.js`, which lists the markets in `weather`.

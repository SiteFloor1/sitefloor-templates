# wear-today (Signature)
**Not £0 a month.** Open-Meteo's free API is for non-commercial use only, and a brand's shop is commercial, so a
client needs its own paid Open-Meteo plan: the key goes in `weather.apiKey` (required on client sites, refused on demos)
and is visible in the page, as with any browser-side key. Sell it as an add-on with that cost passed on. A demo never
calls Open-Meteo; it shows a labelled example. The live section credits "weather data by Open-Meteo.com (CC BY 4.0)",
both linked, as the data licence asks, and the privacy page says the visitor's browser contacts Open-Meteo.

The brand's city now from Open-Meteo's customer API (`connect-src` allows customer-api.open-meteo.com on client sites), read
into one condition: wet (raining, or a 40% chance in the next 12 hours), windy (25 km/h and up), cold (under 10°) or mild.
One sentence ("London is 11° with rain from 6pm.") and the brand's own answer and pieces for that condition.

`weather = { place, lat, lng, apiKey, looks: { wet|windy|cold|mild: { say, pieces: [ids], with?: ["Gloves"] } } }`.
A client's section stays hidden if the forecast can't be read; a demo shows a labelled example. Nothing is claimed about
a garment; the brand chooses which pieces it would wear.

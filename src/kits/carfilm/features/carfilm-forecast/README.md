# Shoot-day cloud forecast (CVID-11)

| | |
|---|---|
| Feature id | `carfilm-forecast` |
| Plan | signature |
| Config | `forecast` { source: "met-norway" } |

Under the planner, for a date up to nine days ahead: the cloud cover forecast for the middle of that evening's golden
hour, in words and per cent, with the source and when it was updated. From MET Norway's Locationforecast 2.0
(https://api.met.no, free, no key, commercial use allowed with credit; Open-Meteo's free tier is non-commercial, so it
isn't used). The security policy allows `https://api.met.no`.

## When something is missing or fails
No reply in 6 s, an error, a forecast older than 12 hours, or nothing within 90 minutes of golden hour: no line at all.
The page never says the weather will be good; it calls it a forecast.

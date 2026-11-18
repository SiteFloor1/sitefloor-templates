# tourism-weather (Signature)

Typical weather (TOUR-7): each month's typical daytime high, always called "typical", always with its source and
period, never a forecast and never invented. Shown in When to go (every place names its `climate` key) and on journey
pages (each stop that names one), for the months the operator would go.

```json
"climate": { "source": "Open-Meteo, ERA5 reanalysis", "url": "https://open-meteo.com/", "about": "average daily high, 2005–2024",
  "places": { "atacama": [25, 24, 24, 22, 19, 18, 18, 19, 22, 24, 25, 26] } }
```

How we fill it: from the source's own archive for the stop's coordinates, January first, rounded to whole °C, and
`about` says exactly what period and measure it is. Rain is left out on purpose: reanalysis rain in mountains and on
coasts can be far from what a traveller sees; add it only from a better source the operator names.

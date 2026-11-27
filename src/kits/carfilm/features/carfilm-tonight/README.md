# Tonight's light (CVID-8)

| | |
|---|---|
| Feature id | `carfilm-tonight` |
| Plan | starter and above |
| Config | `roads` { default, items [{ id, name, area, lat, lon }], note? } |

In the monitor's readout: golden hour (sun 6° above to 4° below), sunset and blue hour (4° to 6° below) on the chosen
road, calculated in the browser (`lib/carfilm.js`, shared NOAA equations in `src/core/lib/sun.js`), and tomorrow's
once tonight's blue hour is over. Rendered for the build day too, so it reads right before any script runs. When the
sun never reaches 6° (a northern December), it says "Low sun all day" and gives sunrise to sunset. Weather is never
claimed. With one road, no menu.

# The film-coverage builder (DET10)

| | |
|---|---|
| Feature id | `protection-3d` |
| Plan | signature |
| Config | `protection`: `photo` (the studio's own photograph of film, shown first), `coverages` (`[{ id, name, line, area }]`, 1–4; `area` is what the 3D car shows covered: `front-end`, `full-front`, `track` or `whole`), `message` (WhatsApp opening), `note` (under the price); `filmPrices`: `{ source: "sheet"\|"simulated", csvUrl }`; `sections.protection3d` |
| Files | `protection-3d.njk`, `.css`, `.js`, `sheet-provider.js`; the stage and 3D bay from DET9 (`../correction-3d/stage.js`, `bay-3d.js`, `../../partials/stage-3d.njk`); prices in `../../lib/packages.js` (`filmPricesFromCsv`, `filmText`) |

## How it works
The visitor picks their car (SUV, the default, saloon or hatch) and a film package (front end, full front, track
pack, full body). Each package shows its price for that car and the chosen one its price and days, from the studio's
own price sheet (`package`, `body`, `price`, `days`, one row each; a missing or mistyped row says "Ask us", never a
guess). "Send this on WhatsApp" sends the car, the package and the price. "See it on a 3D car" loads the chosen car
into the photograph's box; each package moves where the film reaches (sliding over about a second, at once with
reduced motion), the covered paint lights up a little and the film's edge is drawn as a thin line of light. The areas are an
illustration of where a coverage reaches on a typical car; the studio's own line says exactly what it covers on
theirs (mirrors, headlights). Same 3D rules as DET9.

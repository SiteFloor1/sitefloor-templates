# Your colour on the 3D car (paint chart)

| | |
|---|---|
| Feature id | `paint-chart`, Signature; needs `correction-3d` or `protection-3d` |
| Config | `paintChart`: `{ source: "sheet"\|"simulated", csvUrl }` |
| Files | `paint-chart.njk` (included under each 3D stage by `partials/stage-3d.njk`), `.css`, `sheet-provider.js`; parsing and finishes in `src/kits/detailing/lib/paint.js`; the swatches are filled by `correction-3d/stage.js` |

## The studio's sheet
One row per colour: `name` (the studio's own, up to 40 characters), `hex` (#RRGGBB) and `finish` (solid, metallic,
pearl or matte; metallic when blank). Up to 24 colours; rows without a name or a valid colour are skipped.

## How it works
Under each 3D stage, the chart's colours as round swatches, labelled "Approximate on screen". Picking one repaints
the 3D car (once it's open, or as soon as it opens) with that colour and finish; the choice is shared, so the film
builder and the correction show the same colour. On the correction stage the paint keeps its glassy finish so the
swirls read the same on any colour. If the chart can't be read, no swatches show and the car keeps the look's colour.
Client sites must read the studio's sheet; `simulated` is for the demo (`src/demo/paint-chart-provider.js`).

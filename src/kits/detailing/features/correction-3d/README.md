# Paint correction on a 3D car (DET9)

| | |
|---|---|
| Feature id | `correction-3d` |
| Plan | signature |
| Config | `correction`: `photo` (the studio's own correction photograph, shown first), `text`, `steps` (`[{ name, text }]`, 2–5, in order), `package?` (the package id it links to); `sections.correction3d` |
| Files | `correction-3d.njk`, `.css` (the stage styles the coverage feature shares), `.js`; the 3D bay in `bay-3d.js` and `stage.js` (shared with the coverage feature) |

## How it works
The studio's photograph and words first, with its steps in order. "See it on a 3D car" (the download size on the
button) loads three.js and the visitor's size of car (SUV first, or saloon or hatch, picked above the stage) into the same box: the car in a dark bay, a masking-tape line down the
middle of the bonnet and roof, swirl marks on one side and corrected paint on the other. "Move the light" sweeps a
strip light along the car, as a detailer's inspection light does; drag to turn the car. It is labelled an
illustration on the page: the swirls are drawn, not a photograph of any car, and the page promises nothing about a
visitor's paint.

## 3D rules
Photo first; loads only on tap; Sitefloor's shared cars (`src/core/assets/cars`: the SUV, saloon and hatch the car
studio also uses, CC BY 4.0, all three credited under the stage), each loaded once, the size shared by both 3D
features and swappable in place;
redrawn only when something moves; no WebGL or a failed load leaves the photograph and says so; reduced motion turns
off the camera's easing. The page's security headers allow blob: images and WebAssembly only when a 3D feature is on.

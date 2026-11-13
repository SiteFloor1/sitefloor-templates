# The Showroom

| | |
|---|---|
| Feature id | `showroom` |
| Plan | signature (or an add-on) |
| Config | `vehicles` (`id`, `name`, `body`: hatch / saloon / suv / van), `jobs` (one price and time per vehicle), `tint` (`shades`, `jobs`: `{ rear, fronts, windscreen? }` job ids), `wrap` (`colours`, `finishes` with a job each), `showroom` (`wheels?`: `{ job, colours }`, `dechrome?`: job id, `start?`: the first build shown); `sections.showroom` |
| Files | `showroom.njk`, `showroom.css`, `showroom.js`; the 3D studio in `studio-3d.js` (three.js, loaded on tap); the model and still pictures in `src/kits/car/assets` (credits and licence in its `CREDITS.md`); prices in `pricing.js`, rules in `legality.js`; studio styles in `src/kits/car/kit.css` |

## How it works
It sits in the hero, so the car is the first thing a visitor sees: a car of the visitor's own size (saloon, SUV,
hatchback, van or supercar; `CARS` in `src/kits/car/lib/bodies.js`), with no maker's badges, as a still picture
rendered from its 3D model. Picking another size swaps the car, in the picture or in 3D. "Turn it in 3D" (or picking a colour, a shade or a
wheel colour) loads the 3D studio: three.js and the model, about 155 KB of script and the model file whose size is
on the button. Drag to turn the car, pinch or scroll to zoom, tap a part to change it (body, any window, wheels).

Three views move the camera: **Wrap** (front three-quarter; colour and finish: gloss, satin, matte and chrome are
real materials, with a clear coat on gloss), **Tint** (to the window being changed: windscreen, front sides or
rear; chameleon films show their colour cast) and **Wheels** (low on the front wheel; rim colour). The lighting is
a photo studio with long light boxes overhead, so the paint shows real reflections. The 3D picture is only redrawn
while it moves or changes, so phones stay cool. De-chrome is priced but not drawn (the studio car has no chrome).

The price is always for the visitor's own vehicle size (`vehicles`). A size without its own model shows the
concept supercar. New models are prepared with `tools/car-models/prep.js` (see its header). The price and time add up the studio's own jobs for that size. "Send this build" opens WhatsApp with
every choice and the website price.

The legality check uses the gov.uk rules (front side windows at least 70% light through, windscreen at least 75%
for cars first used from 1 April 1985, both 70% before that; nothing for rear windows). Shades below the rule are
marked; a visitor can still preview them, but they are left out of the price and the message, with a note saying
why: a studio can't legally fit them.

The model is CC BY 4.0: its credit line is on the stage, and wherever a picture of it appears (the hero still,
the driver view's outside pictures). Keep it there.

No heat-rejection or "cooler" figures: those only come from a film maker's spec sheet. No number-plate lookup (it needs a paid service).

## When something is missing or fails
Without JavaScript the still picture shows, with links to the prices and WhatsApp. Without WebGL, or if the model
can't load, the still picture stays and the button says 3D isn't available; prices and the message still work.
The picture and the form are in the HTML from the start, so nothing moves when the script runs; the 3D car fades
in over the picture in the same box. The site's security headers allow what the 3D studio needs and nothing else
when the Showroom is on (`blob:` images for the model's textures and WebAssembly for its mesh decoder).

Registered in `src/features/registry.js`. Add to a site by listing the id in `features` in its `site.json`.

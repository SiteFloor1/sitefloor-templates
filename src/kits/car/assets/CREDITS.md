# Car studio kit pictures

Shared by every car studio site (copied to `img/kit/`).

## The 3D studio car

Moved to `src/core/assets/cars/` (credits there) so other trades can draw it too; car sites get it at `img/cars/`.

## The everyday cars (one per vehicle size)

The saloon, SUV and hatch (models and their still pictures) moved to `src/core/assets/cars/` (credits there) so other
trades can draw them; car sites get them at `img/cars/`. The van stays here.

Downloaded from Sketchfab by the owner and prepared with `tools/car-models/prep.js` (profiles in
`tools/car-models/profiles.json`): makers' badges, lettering and number plates removed, the paint, glass and
wheels renamed for the Showroom, the interior simplified, WebP textures, meshopt compression. Checked 26 October
2026. The credit line on the page names the modeller (linked to their profile), says the model was adapted and links
the licence, as CC BY asks. 27 October: the hatch was replaced (the earlier one was under Sketchfab's Standard licence,
which doesn't clearly allow serving the model file); its wheels are split so only the rim takes the wheel colour. The
saloon was re-prepared lighter (2.6 MB from 4.0: plain tyres, brake discs and dashboard knobs, simpler rims).

| File | Model | Modeller | Licence |
|---|---|---|---|
| car-van.glb | https://sketchfab.com/3d-models/shvan-92-low-poly-model-09d718c9cf72401b8534d265a06a803f | Daniel Zhabotinsky | CC BY 4.0 |

The saloon and SUV are recognisably modelled on real cars (a Volvo S90 and a Mercedes-Maybach GLS). The modellers'
licences cover their work, not the carmakers' trademarks or designs. Badges are removed, the page never names
the car, and its credit links go to the modellers' profiles and the licence, not to the model pages (whose
addresses name the car); the owner has accepted the small remaining risk for the demo. For a client, offer the generic models
unless the client is happy with that.

Rendered from those models with the Showroom's own lighting (src/kits/car/features/showroom/studio-3d.js), in a
headless browser:

| File | What it is |
|---|---|
| car-van.webp, car-van-900.webp | The still picture of each car, shown until 3D opens and on plans without the Showroom |
| body-hatch.webp, body-saloon.webp, body-suv.webp, body-van.webp | Each car from the side with clear glass (tint visualiser) |
| body-hatch-front.webp, body-hatch-rear.webp, body-saloon-front.webp, body-saloon-rear.webp, body-suv-front.webp, body-suv-rear.webp, body-van-front.webp | Masks of the front and rear side glass, rendered from the same models (the van has no rear glass) |
| chip-car.webp | The front of the saloon in black gloss, rendered from car-saloon.glb (stone chip test) |

Rendered from that model with the Showroom's own lighting (src/kits/car/features/showroom/studio-3d.js), in a
headless browser:

| File | What it is |
|---|---|

## Photographs

Every photo is from Unsplash, free to use under the Unsplash License (https://unsplash.com/license), checked
26 October 2026; none is an Unsplash+ photo. They are stock photos of other people's cars and roads, used to show
shades and panels. Sites never say a studio worked on them. The driver's-seat views are scaled to 1000 px wide;
their glass is traced in `src/kits/car/lib/bodies.js`. The saloon photo was cut out of its background (rembg, `isnet-general-use`).

| File | Photo page | Photographer | What it shows |
|---|---|---|---|
| photo-saloon.webp | https://unsplash.com/photos/p7tai9P7H-s | Grahame Jenkins | Blue coupé-saloon from the side (PPF planner, tint page) |
| plan.webp | https://unsplash.com/photos/ooQ1GaXrUYM | Erik Mclean | White car seen from directly above |
| pov-day.webp (windscreen, day) | https://unsplash.com/photos/9EJjrpUhwvI | Zion C | Driver's view through the windscreen on a motorway (cropped to remove stickers and a phone) |
| pov-night.webp (windscreen, night) | https://unsplash.com/photos/4tJFcZlDygc | Irakli Shubitidze | Driver's view at dusk with glowing dials |
| pov-side.webp (front side window, day) | https://unsplash.com/photos/pM53n_rRUIs | Zion C | View out of a front side window with the door mirror |
| pov-side-night.webp (front side window, night) | https://unsplash.com/photos/driving-through-a-dark-empty-street-at-night-sVcwto6heLU | Lina Micán | Front side window and door mirror at night (brightened) |
| pov-rear.webp (rear window, day) | https://unsplash.com/photos/a-car-window-with-trees-outside-jmjxJr1OyjU | Ciocan Ciprian | Looking back through a rear window at a wet road |
| pov-rear-night.webp (rear window, night) | https://unsplash.com/photos/a-view-of-a-city-street-from-inside-a-car-MWP7wtfhEJs | Harrison Chang | From the back seat at night, traffic past the rear passenger window |

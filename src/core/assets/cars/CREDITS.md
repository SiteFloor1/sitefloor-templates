# Shared 3D cars

Licensed car models any kit may draw. A kit lists `"cars"` in `sharedAssets` (its `kit.js`) and the build copies this
folder to the site's `img/cars/`; nothing here is copied otherwise. Never import another kit's files to reach a model:
move it here instead, with its credit.

## studio-car.glb: the concept car

`studio-car.glb` is "Car Concept" from the Khronos glTF Sample Assets
(https://github.com/KhronosGroup/glTF-Sample-Assets/tree/main/Models/CarConcept), © 2024 Darmstadt Graphics Group
GmbH, model and textures by Eric Chadwick, licensed CC BY 4.0 (https://creativecommons.org/licenses/by/4.0/),
checked 26 October 2026. It was started from a public-domain (CC0) model by "Unity Fan" on Sketchfab.
Changes for Sitefloor: the Khronos and 3D Commerce logos (trademarks, not covered by the licence) were removed
from the number plate, the hardware and the tyres; the dashboard reads mph; material variants, the engine and
axles were removed; the wipers were simplified; textures are WebP at 1024 px or less; the mesh is compressed
(meshopt). The car carries no maker's badge. Sites credit it on the Showroom (see the feature README).

`studio-car.webp` and `studio-car-900.webp` are still pictures rendered from that model with the car kit's Showroom
lighting (src/kits/car/features/showroom/studio-3d.js) in a headless browser: the picture shown until the 3D car loads.

Every page that shows the car, or a picture of it, carries its credit line: the modeller, that it was adapted, and
the licence (linked), as CC BY asks.

## The everyday cars: car-saloon.glb, car-suv.glb, car-hatch.glb

Downloaded from Sketchfab by the owner and prepared with `tools/car-models/prep.js` (profiles in
`tools/car-models/profiles.json`): makers' badges, lettering and number plates removed, the paint, glass and wheels
renamed ("Paint 1", "Rim2", "Glass …"), the interior simplified, WebP textures, meshopt compression. Checked 26 October
2026. The credit line on the page names the modeller (linked to their profile), says the model was adapted and links
the licence, as CC BY asks.

| File | Model | Modeller | Licence |
|---|---|---|---|
| car-saloon.glb | https://sketchfab.com/3d-models/volvo-s90-recharge-free-9462b07c10244fd4a28d86846dc9e3a9 | lazercar | CC BY 4.0 |
| car-suv.glb | https://sketchfab.com/3d-models/mersedes-benz-maybach-gls-600-34c4687ba8204efaa7551afea9f5689f | Black Snow | CC BY 4.0 |
| car-hatch.glb | https://sketchfab.com/3d-models/milano-95-low-poly-model-122a22d210234596ad23623588d0d166 ("Milano '95") | Daniel Zhabotinsky | CC BY 4.0 |

The saloon and SUV are recognisably modelled on real cars (a Volvo S90 and a Mercedes-Maybach GLS). The modellers'
licences cover their work, not the carmakers' trademarks or designs. Badges are removed, the page never names the car,
and its credit links go to the modellers' profiles and the licence, not to the model pages (whose addresses name the
car); the owner has accepted the small remaining risk for the demos. For a client, offer the generic models unless the
client is happy with that.

`car-saloon.webp`, `car-suv.webp`, `car-hatch.webp` and their `-900` versions are still pictures rendered from these
models with the car kit's Showroom lighting, shown until 3D opens.

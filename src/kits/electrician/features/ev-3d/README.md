# ev-3d (electrician kit, Signature, ELEC-11)

The charger on your driveway, in 3D, on the EV charging page (`ev-check` must be on). A still of the scene shows
first; "See it on a driveway in 3D" loads three.js and the car (the kit's credited model, `img/kit/ev-car.glb`, about
1.8 MB; the button says so). Drag the charger along the wall, or use the slider; pick where the car's port is. The
dashed line is the cable from the fuse board inside; the lead runs to the port and is measured against the client's
`ev.leadMetres` when given. The run is priced with the client's standard install and price a metre
(`cablePrice` in `lib/quotes.js`), and it moves the EV check's answer above to match.

The car is CC BY 4.0: its credit line is always on the stage. Keep it there.

## When something is missing or fails
The slider and the port choice price the run before the 3D loads and without it. Without WebGL, or if the car can't
load, the still stays and a line says the 3D can't open here. The site's security headers allow `blob:` images and
WebAssembly (the car's mesh decoder) only when this is on.

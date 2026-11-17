# garage-aerial (Signature; sold as a Bespoke add-on)

The hall from above (PARK-9): a photoreal render of the client's own hall, made once from its plan (Blender,
Cycles; the scene scripts are kept with the design rounds), as the look's hero. A top-down render of a car the size
the visitor picks (`garage-pick`) drives in through the gate and turns nose first into the bay that fits; the bay
lights. It plays once when the hall first comes into view and again on every pick; with reduced motion the car is
shown parked. Charging (garage-charging) and cameras (garage-security) are layers. Every render carries the same
caption: "Rendered from our plan. Not a photograph."

```json
"aerial": {
  "day":   { "src": "img/hall-day.jpg",   "width": 2208, "height": 1158 },
  "dayPhone":   { "src": "img/hall-day-phone.jpg",   "width": 1013, "height": 1540 },
  "night": { "src": "img/hall-night.jpg", "width": 2208, "height": 1158 },
  "nightPhone": { "src": "img/hall-night-phone.jpg", "width": 1013, "height": 1540 },
  "cars": { "hatch": "img/car-hatch.png", "estate": "img/car-estate.png", "suv": "img/car-suv.png" },
  "frame": { "x": -12.5, "top": 17.3, "bottom": -0.8, "width": 34.5 },
  "phoneFrame": { "x": 22.0, "top": 17.3, "bottom": -0.8, "height": 27.5 }
}
```

`frame` places the desktop render in hall metres (its left edge `x`, its top and bottom edges in y, its width);
`phoneFrame` the phone render, turned a quarter so the gate is at the bottom (its top edge in x, `top` and `bottom` its
left and right edges in y, its height). Car images
are 5.6 × 2.6 m, front to the right. No 3D engine runs in the page: one image, one car image and an SVG layer.

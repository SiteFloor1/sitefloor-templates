# garage-aerial (Signature; sold as a Bespoke add-on)

The hall from above (PARK-9): a photoreal render of the client's own hall, made once from its plan (Blender, Cycles;
the scene scripts are kept with the design rounds), as the look's hero. Every bay is rendered with a car under a
fitted cover, and again with every bay empty (`aerial.empty`); the site lays the empty render over each bay that's
free today (the live list, garage-spaces), so the picture always matches the list. Open cars aren't drawn: no free
model reaches the realism a client's hall needs.

When the visitor picks a car (`garage-pick`), a line of light runs in through the gate, along the aisle and into the
bay that fits, and the bay lights. It plays once when the hall first comes into view and again on every pick; with
reduced motion the lit route and bay are shown at once. Charging (garage-charging) and cameras (garage-security) are
layers. Every render carries the same caption: "Rendered from our plan. Not a photograph."

```json
"aerial": {
  "day":        { "src": "img/hall-day.webp",        "width": 2208, "height": 1158 },
  "dayPhone":   { "src": "img/hall-day-phone.webp",   "width": 1013, "height": 1540 },
  "night":      { "src": "img/hall-night.webp",       "width": 2208, "height": 1158 },
  "nightPhone": { "src": "img/hall-night-phone.webp", "width": 1013, "height": 1540 },
  "empty": { "day": { "src": "img/hall-day-empty.webp", "width": 2208, "height": 1158 }, "...": "the same four, every bay empty" },
  "frame": { "x": -12.5, "top": 17.3, "bottom": -0.8, "width": 34.5 },
  "phoneFrame": { "x": 22.0, "top": 17.3, "bottom": -0.8, "height": 27.5 }
}
```

`frame` places the desktop render in hall metres (its left edge `x`, its top and bottom edges in y, its width);
`phoneFrame` the phone render, turned a quarter so the gate is at the bottom (its top edge in x, `top` and `bottom` its
left and right edges in y, its height). The check refuses a frame that doesn't match a render's shape, and an empty
render that isn't the same size as its full one. No 3D engine runs in the page: the renders and an SVG layer.

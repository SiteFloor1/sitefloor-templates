# Room by room in 3D (cleaning kit, Signature)

A small link under the room strip ("See it room by room in 3D · an illustration of a two-bedroom flat · loads only if
you ask, about 125 KB"). Tapping it loads `model-3d.js` as its own chunk (three.js, tree-shaken, and a procedural flat
drawn from boxes; no model file). Tap a room: its tasks and minutes, from `visit()` for a two-bedroom flat with two
bathrooms on a regular clean, the same minutes the strip shows for that home. Drag sideways or use the arrow keys to
turn it; it draws only when something changes. No WebGL: it says so, and the strip already lists every room.
The model's colours are the look's: `--model-bg`, `--model-wall`, `--model-edge`, `--model-wood`, `--model-stone`,
`--model-tile`, `--model-carpet`, `--model-unit`, `--model-white`, `--model-soft`, `--model-pick`, each falling back to
the look's tokens. The size printed on the link is `MODEL_3D_KB` in kit.js; the kit's unit test keeps it within 15%.

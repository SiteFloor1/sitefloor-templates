# letting-building: the lift indicator and the building in 3D (Signature)

Over the hero photograph of the entrance, a brass plate of floor lamps, one per floor of the hero building
(`homes.hero`), each saying how many homes are free on it (a floor's `note`, such as "Porter", stands instead).
A lamp picks the floor and the list of homes below follows. "See the building" loads a code-built 3D illustration
of the building (three.js, only on tap, its own chunk) with every free home's windows lit from the sheet; drag to
turn it, tap a lit window to open that home. Labelled "Illustration".

- Needs `letting-board` (the homes) and a `model` on the hero building: `mansion`, `terrace` or `tower`; up to 9 floors.
- The palette comes from the look (`--b3-brick`, `--b3-stone`, `--b3-roof`, `--b3-iron`, `--b3-glass`,
  `--b3-glass-lit`, `--b3-glow`, `--b3-frame`, `--b3-accent`, `--b3-sky`, `--b3-ground`, `--b3-sun`).
- Fails closed: a stale or unreadable sheet lights no lamp and no window. No WebGL: the photograph, plate and list stay.
- The hero element the 3D turns on is the nearest `[data-lbd-host]` (it gets `is-3d` or `no-3d`).

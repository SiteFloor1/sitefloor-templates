# The turntable (Signature)

`turntable`: the bottle's turntable frames, numbered from 01: `frames` (how many make the full turn, 24–36 is usual),
`repeat?` (a bottle that looks the same from the back: the frames are seen again every `repeat`), `src` (the
pattern, e.g. `img/turn/d-{n}.webp`), `wideSrc?` (the same frames 1.5 times as wide, for large retina screens),
`phoneSrc?` with `phoneWidth`/`phoneHeight` (an upright crop for phones), `width`, `height`. Frame 1 is the hero
picture (its `alt` is `hero.photo.alt`). The visitor drags or uses the arrow keys; nothing turns by itself. The rest
of the frames load only when someone hovers, touches or tabs to the bottle.

For a client: their own 24 to 36 turntable photographs (same light and distance; we give them the shot list), or a
rendered bottle (a Bespoke add-on). The page is the same either way.

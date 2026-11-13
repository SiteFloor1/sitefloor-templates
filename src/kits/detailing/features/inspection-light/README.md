# The inspection light (hero option)

| | |
|---|---|
| Feature id | `inspection-light` |
| Plan | signature |
| Config | `inspection`: `before` and `after` (`{ src, width, height }`, the same size), `alt` (what the pair shows), `caption` (e.g. "Our bonnet, before and after a two-stage correction") |
| Files | `inspection-light.njk` (included by the look's hero), `.css`, `.js` |

## How it works
When the studio has a real matched pair (one panel, the same light, camera position and framing, before and after
correction) the hero becomes the inspection light: the before photograph fills the screen and the visitor drags a
strip light across it; inside its beam, the after photograph shows. One slow pass on load, none with reduced motion;
the grip works with the arrow keys.

## Honesty
It only ever swaps two real photographs: nothing imitates correction with a filter. The checks refuse two files of
different sizes or the same file twice. Without a pair the look shows its photograph hero instead. Shoot the pair on
a tripod: tape a line, photograph the half, correct, photograph again without moving anything.

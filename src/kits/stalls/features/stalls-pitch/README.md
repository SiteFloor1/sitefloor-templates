# Pitch finder

| | |
|---|---|
| Feature id | `stalls-pitch` |
| Plan | plus and above (client-only) |
| Config | `stops.places[].pitch` { `photo`, `line` } on the markets the stall has photographed |

At a big market a stall can be hard to find. On the Where to find us page, each regular market can show the stall's
own photo of its pitch and one line ("Look for the pink awning by the clock tower"). It needs the stall's own
photograph of its own pitch, so it's client-only: a demo never shows a stock photo as somebody's pitch. The markup is
part of `stalls-find`.

Registered in `src/kits/stalls/kit.js`.

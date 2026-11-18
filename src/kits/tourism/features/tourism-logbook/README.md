# tourism-logbook (Plus)

The logbook (TOUR-5): a page per journey (`journey-<id>.html`; the journeys count as one page) and the same component
in the home page's hero. Left, the photograph of the stop on show (a stop without its own photograph keeps the last
one, and the caption always names the place shown); centre, the stop's days, place and words, and the list of stops;
right, the country drawn and the route.

- **The map** is drawn at build time: the journey's `country` outline from Natural Earth (public domain, `data/`),
  projected flat with the width corrected for latitude, and the route through the stops and any `via` places. Only
  that one country's outline is inlined, as SVG. Place names and dots are HTML laid over it, so they stay readable at
  any size; a name that would sit on top of another is left off (its dot stays). "Route approximate" is always shown.
- **Choosing a stop** swaps the words, the photograph and the local time, and draws the line to that stop (its share
  of the route, computed at build time; `pathLength="1"`). Dashed: the way ahead.
- No 3D, no autoplay, nothing tied to scrolling. With reduced motion the line jumps instead of drawing.

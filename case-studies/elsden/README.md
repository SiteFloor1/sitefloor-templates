# Case study source: elsden

- `elsden/index.html`: the car storage case study (Hall One at eye level, from just inside the gate, in the dark. On
  arrival the strip lights strike one run at a time down the hall; pick a car and the floor outline of the free bay
  that fits glows, with a tag on the bay, using the same fit rule as the kit's `pickBay`. Every light was rendered on
  its own (Blender light groups); the page sums those passes in WebGL with a weight per light and tone-maps once, so
  each state is the render with those lights on. Without WebGL, or with reduced motion, it shows the lit stills. Then the hall drawn to scale
  from the demo's measurements wiped into the hall rendered from above, bay for bay; the live list (a Google Sheet you
  can change, with bays coming back, beside the free-bays line it feeds, and what the site says when the sheet goes quiet); the hall at night
  from above; the plans; the numbers. Plaster, ink, night navy, one warm light; Cardo and Radio Canada (Elsden's own),
  self-hosted with size-matched stand-ins). Media (the eye-level stills and light passes, the day and night aerials, a phone crop
  of the night aerial) live in the published artifact under `media/`; the fonts in `media/fonts/`. Nothing moves until
  asked; reduced motion skips the crossfade.

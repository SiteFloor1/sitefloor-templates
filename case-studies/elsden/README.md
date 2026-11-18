# Case study source: elsden

- `elsden/index.html`: the car storage case study (Hall One at eye level, from just inside the gate. The hall's lights
  are low; pick a car and the lights come up and the floor outline of the free bay that fits glows, with a tag on the
  bay, using the same fit rule as the kit's `pickBay`. Each lit state is a render of the hall with that bay's own light
  group on (Blender light groups, summed and tone-mapped once per state), crossfaded. Then the hall drawn to scale
  from the demo's measurements wiped into the hall rendered from above, bay for bay; the live list (a Google Sheet you
  can change, beside the free-bays line it feeds, and what the site says when the sheet goes quiet); the hall at night
  from above; the plans; the numbers. Plaster, ink, night navy, one warm light; Cardo and Radio Canada (Elsden's own),
  self-hosted with size-matched stand-ins). Media (the four eye-level stills, the day and night aerials, a phone crop
  of the night aerial) live in the published artifact under `media/`; the fonts in `media/fonts/`. Nothing moves until
  asked; reduced motion skips the crossfade.

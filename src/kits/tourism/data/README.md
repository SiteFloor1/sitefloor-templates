# Country outlines

`countries.json`: every country in Natural Earth's 1:50m admin-0 countries (public domain, naturalearthdata.com;
the GeoJSON from github.com/nvkelso/natural-earth-vector), keyed by ISO 3166 alpha-3 (Natural Earth's `ADM0_A3` where
it has no ISO code). Rings smaller than 0.02 square degrees are dropped, the rest simplified (Douglas–Peucker, 0.025°)
and rounded to 0.01°. Used at build time only: a journey page inlines just its own country's outline as SVG.

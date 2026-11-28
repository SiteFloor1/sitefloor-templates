# residences-map: neighbourhood guide (Signature)

`neighbourhood`: `{ intro, centre: { lat, lng, label }, ring (minutes, the outer ring), checked (YYYY-MM), places:
[{ name, kind, lat, lng, minutes?, note? }] }`. Drawn at build time as SVG (`lib/map.js`): the building in the middle,
rings at 5-minute steps to `ring`, each place numbered. Minutes the operator walked are used as given; otherwise an
estimate from the straight-line distance (×1.3, 80 m a minute), written "about". No map tiles, no ratings.

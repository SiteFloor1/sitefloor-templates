# Light study on the 3D model (construction kit, Signature)

On the visualiser page: pick a month (the 21st), a time (UK clock time) and which way the garden faces; the sun on the
3D house moves to its real height and bearing for the postcode district (NOAA's solar position equations, in
`lib/sun.js`), the scene darkens after sunset, and one sentence says where the sun is and whether it reaches the new
room's glass or only the roof light. It works as words before the 3D is opened; once it is, a compass dial on the model shows the sun's bearing. It ignores neighbouring houses and
trees, and says so.

```json
"lightStudy": { "title": "When the light *comes in*", "intro": "…", "facing": "S", "places": [{ "code": "N5", "lat": 51.5537, "lng": -0.0985 }] }
```

`places` are postcode districts' centres the builder works in (never an address); the first is the default.

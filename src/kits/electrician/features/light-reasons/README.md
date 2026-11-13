# light-reasons (electrician kit, Plus)

"Every light has a reason": up to eight lights numbered on one photograph of a finished room. A number on the photo
(or in the list beside it) shows that light's name, why it's there, the scene it belongs to, its colour temperature
and how it's controlled, all in the client's words. Without JavaScript every light is listed with its reason.

```json
"fittings": {
  "photo": { "src": "img/garden-room.webp", "width": 1488, "height": 960, "alt": "…", "caption": "Fittings named for illustration." },
  "items": [{ "x": 36.7, "y": 58.8, "name": "Wall lights, up and down", "why": "…", "scene": "Evening, Cinema", "colour": "Warm white, 2700K", "control": "Dimmed from the keypad by the doors" }]
}
```
`x`/`y` are percentages across and down the photo. Heading: `sections.lights`. On Signature, the house in 3D
(`house-3d`) opens in this same frame, over the photograph.

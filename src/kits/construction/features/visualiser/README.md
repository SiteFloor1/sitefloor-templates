# Extension visualiser (construction kit, Starter)

On the first screen of the home page: a real photograph of a finished extension, and a button that loads a 3D house
with a rear extension on tap. The visitor picks the house type (terrace, semi, detached), the depth, a roof light or an
all-glass roof, and before or after; the size and the new floor area are worked out as they change. Drag (or the arrow
keys) turns the house; on a phone only a sideways drag turns it, so the page still scrolls.

- **Photo first, 3D on tap.** `house-3d.js` and three.js are a separate chunk, loaded only when the button is pressed
  (its size is printed on the button from `buildData.model3dKb`; a unit test keeps that figure honest). No WebGL: the
  photograph stays and says so. A failed load says so and the button works again.
- **The price is the builder's, or nothing.** A range appears only when the visualiser page (Signature) is on and
  `visualiser.rates` holds the builder's own £ per m² of new room, low and high, for each roof, with VAT stated and the
  month they were checked. A demo may not carry rates; the demo says where the range would show.

```json
"visualiser": {
  "house": "terrace", "roof": "lantern",
  "depth": { "min": 3, "max": 6, "step": 0.5, "start": 4 },
  "message": "Hello, I'd like to talk about an extension.",
  "rates": { "perM2": { "lantern": [3800, 4600], "glass": [4400, 5300] }, "vat": "excluded", "checked": "2026-11" }
}
```

The photograph is `hero.photo` (16:9) and `hero.photoPhone` (4:5). Markup uses tokens only; the look restyles it.

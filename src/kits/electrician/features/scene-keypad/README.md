# scene-keypad (electrician kit, Signature, ELEC-7)

The hero's keypad: Evening, Cinema and Away (up to four keys, the client's own names) swap the hero to the client's
photographs of the same home in each light, with a slow fade and the line under the headline saying what the scene
does. Real photographs only, never a simulated light.

```json
"hero": { "scenes": [
  { "id": "evening", "label": "EVENING", "line": "Garden room, wall lights and the drive, all at full.",
    "wide": { "src": "img/evening-wide.webp", "width": 1920, "height": 1080, "alt": "…" }, "tall": { "src": "img/evening-tall.webp", "width": 900, "height": 1125 } }
] }
```
The first scene shows when the page opens; the others are fetched after the page has loaded (or when a key is
touched), so the first view downloads one photograph. Without this feature (Starter, Plus) the hero shows the first
scene alone. Best shot from one tripod position, lights switched between frames. The chosen scene carries into the
house in 3D.

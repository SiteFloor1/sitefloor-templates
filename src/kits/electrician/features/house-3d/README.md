# house-3d (electrician kit, Signature, ELEC-10)

The house in 3D: a full-width chapter of the home page. A glass pavilion under a stone first floor (living room,
kitchen, garden room; landing, bedroom, bathroom), a cinema below seen through its sunken court, a terrace under a deep
canopy, a lit pool and a garden of cypresses, at blue hour. Built in code with three.js (`villa-scene.js`), so there's
no model file and it is nobody's real home.

- **First:** a still of the model (garden and pool lit, the house dark; `assets/villa-wide.webp` and `villa-tall.webp`)
  with "Light the house". **Nothing 3D loads until it's tapped** (three.js and the bloom pass, on the tap budget). The
  model then takes the still's place and the house lights up room by room.
- **Scenes:** Evening, Cinema, Away and Goodnight (`SCENE_LEVELS` in `src/kits/electrician/lib/house.js`). Goodnight
  puts the rooms out one after another, the bedroom last. A tap on the hero's keypad carries the scene into the house.
- **Rooms:** tap one in the model (it lights and the camera flies to it) or in the list under "Lit now". "Whole house"
  flies back.
- **Colour:** a slider from 2200 K to 3500 K. Lights warm as they dim (dim-to-warm), as good LED fittings do.
- **Fittings:** only those in `house3d.rooms`, drawn where they'd really go: downlights (ceilings, and the canopy over
  the terrace in the garden), wall lights in pairs, pendants over the island and the table, strips under the cupboards
  and on the cinema risers, uplights on walls and trees, a keypad by the door, path lights (`bollard`), wall grazers
  on the garden wall (`wall` in the garden), pool lights (`underwater`), a star ceiling in the cinema (`starlight`). Strips: one drawn per strip listed (up to three).
- **The quote:** the fittings in the rooms lit now at the client's price for each kind (`houseQuote` in
  `lib/quotes.js`), sent on WhatsApp with the rooms. Never more than the client's own figures.

```json
"house3d": {
  "message": "Hello <your business>, I've been lighting the house on your website.",
  "types": [{ "id": "downlight", "name": "Downlight", "price": 145 }, { "id": "bollard", "name": "Path light", "price": 195 }],
  "rooms": [{ "id": "kitchen", "fittings": { "downlight": 6 } }, { "id": "garden", "fittings": { "bollard": 6 } }]
}
```
Rooms: `living`, `kitchen`, `garden-room`, `hall`, `bedroom`, `bathroom`, `cinema`, `garden`, `pool`. Kinds:
`downlight`, `wall`, `pendant`, `strip`, `uplight`, `keypad`, `bollard`, `underwater`, `starlight`. The section's words are
`sections.house` (`title`, `intro`).

## When something is missing or fails
Without JavaScript the still shows. Without WebGL (or if the scene fails), the message says so and the keypad, the
rooms and the price still work. Drawing stops when the model is off screen or the tab is hidden. With reduced motion
the lights switch instantly and the camera doesn't drift or fly. Phones get no shadows and a lower pixel ratio.
